import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NodeBusiness } from 'src/auto-engine/business/node.business';
import { AuenNodeWithAttributes } from 'src/auto-engine/process/node-strategy.interface';
import { StrategyFactory } from 'src/auto-engine/process/strategy.factory';
import { DeviceComponentRepository } from 'src/iot/repository/device-component.repository';
import { TelemetryLogRepository } from 'src/iot/repository/telemetry-log.repository';
import { ProcessLogBusiness } from '../business/process-log.business';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

const PROCESS_NAME = 'sync_engine';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class SyncProcess implements OnModuleInit {
  private readonly logger = new Logger(SyncProcess.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NodeBusiness)) private readonly nodeBusiness: NodeBusiness,
    @Inject(forwardRef(() => DeviceComponentRepository)) private readonly componentRepository: DeviceComponentRepository,
    @Inject(forwardRef(() => TelemetryLogRepository)) private readonly telemetryRepository: TelemetryLogRepository,
    @Inject(forwardRef(() => ProcessLogBusiness)) private readonly processLogBusiness: ProcessLogBusiness,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.start().catch(err => this.logger.error('SyncEngine loop crashed', err));
  }

  async start() {
    while (true) {
      const enabled = await this.getCfgBool('sync.enabled') ?? true;
      if (!enabled) {
        await sleep(5000);
        continue;
      }

      const startTs = Date.now();
      const startedAt = new Date();
      let status = 'success';
      let errorMsg: string | undefined;
      let itemCount = 0;

      try {
        itemCount = await this.process();
      } catch (err: any) {
        status = 'error';
        errorMsg = err?.message ?? String(err);
      }

      const endedAt = new Date();
      const durationMs = Date.now() - startTs;

      await this.processLogBusiness
        .log({ processName: PROCESS_NAME, startedAt, endedAt, durationMs, itemCount, status, errorMsg })
        .catch(() => {});

      this.realtimeGateway.emitProcessUpdate({
        processName: PROCESS_NAME,
        startedAt,
        endedAt,
        durationMs,
        itemsProcessed: itemCount,
        status: status as 'success' | 'error',
      });

      const minInterval = await this.getCfg('sync.cycle_min_interval_ms') ?? 2000;
      const cooldown = await this.getCfg('sync.cycle_cooldown_ms') ?? 0;

      const wait = Math.max(0, minInterval - durationMs) + cooldown;
      if (wait > 0) await sleep(wait);
    }
  }

  async process(): Promise<number> {
    const allNodes = await this.nodeBusiness.findAllWithAttributes() as unknown as AuenNodeWithAttributes[];
    const nodes = allNodes.filter(n => n.iotComponentId != null);
    let count = 0;

    for (const node of nodes) {
      try {
        const strategy = StrategyFactory.getStrategy(node.type.category);
        const direction = strategy.syncHardware(node, allNodes);
        if (direction === 'NONE') continue;

        const componentId = node.iotComponentId!;

        if (direction === 'WRITE') {
          const lastLog = await this.telemetryRepository.findLastByComponentId(componentId);
          const component = await this.componentRepository.findById(componentId);
          if (
            lastLog?.value !== node.actualValue &&
            component?.nextValue !== node.actualValue
          ) {
            await this.componentRepository.setNextValue(componentId, node.actualValue);
            count++;
          }
        } else if (direction === 'READ') {
          const lastLog = await this.telemetryRepository.findLastByComponentId(componentId);
          if (lastLog && lastLog.value !== node.actualValue) {
            await this.nodeBusiness.setDesiredFromHardware(node.id, lastLog.value);
            count++;
          }
        }
      } catch (err) {
        this.logger.error(`SyncEngine node ${node.id} (${node.code}) error: ${err}`);
      }
    }

    return count;
  }

  private async getCfg(code: string): Promise<number | null> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({ where: { code } });
      return cfg?.valInt ?? null;
    } catch {
      return null;
    }
  }

  private async getCfgBool(code: string): Promise<boolean | null> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({ where: { code } });
      return cfg?.valBool ?? null;
    } catch {
      return null;
    }
  }
}
