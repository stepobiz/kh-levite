import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelemetryProcessor } from './telemetry-processor';
import { DeviceComponentRepository } from '../repository/device-component.repository';
import { TelemetryLogRepository } from '../repository/telemetry-log.repository';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { ProcessLogService } from 'src/infra/process-log/process-log.service';

const PROCESS_NAME = 'telemetry_processor';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class TelemetryCronService implements OnModuleInit {
  private readonly logger = new Logger(TelemetryCronService.name);
  private processor: TelemetryProcessor;

  constructor(
    private readonly prisma: PrismaService,
    private readonly componentRepo: DeviceComponentRepository,
    private readonly logRepo: TelemetryLogRepository,
    private readonly realtimeGateway: RealtimeGateway,
    @Inject(forwardRef(() => ProcessLogService)) private readonly processLogService: ProcessLogService,
  ) {
    this.processor = new TelemetryProcessor(this.componentRepo, this.logRepo, this.realtimeGateway);
  }

  onModuleInit() {
    this.start().catch(err => this.logger.error('TelemetryProcessor loop crashed', err));
  }

  async start() {
    while (true) {
      const enabled = await this.getCfgBool('iot.enabled') ?? true;
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
        itemCount = await this.processor.process();
      } catch (err: any) {
        status = 'error';
        errorMsg = err?.message ?? String(err);
      }

      const endedAt = new Date();
      const durationMs = Date.now() - startTs;

      await this.processLogService
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

      const minInterval = await this.getCfg('iot.cycle_min_interval_ms') ?? 20000;
      const cooldown = await this.getCfg('iot.cycle_cooldown_ms') ?? 0;

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
