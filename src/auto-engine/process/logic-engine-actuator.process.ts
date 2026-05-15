import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogicEngineActuatorBusiness } from '../business/logic-engine-actuator.business';
import { ProcessLogBusiness } from 'src/infra/business/entity/process-log.business';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

const PROCESS_NAME = 'sync_engine';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class LogicEngineActuatorProcess implements OnModuleInit {
  private readonly logger = new Logger(LogicEngineActuatorProcess.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly actuatorBusiness: LogicEngineActuatorBusiness,
    private readonly processLogBusiness: ProcessLogBusiness,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.start().catch(err => this.logger.error('LogicEngineActuator loop crashed', err));
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
      let status: 'success' | 'error' = 'success';
      let errorMsg: string | undefined;
      let itemCount = 0;

      try {
        itemCount = await this.actuatorBusiness.process();
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
        status,
      });

      const minInterval = await this.getCfg('sync.cycle_min_interval_ms') ?? 2000;
      const cooldown = await this.getCfg('sync.cycle_cooldown_ms') ?? 0;

      const wait = Math.max(0, minInterval - durationMs) + cooldown;
      if (wait > 0) await sleep(wait);
    }
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
