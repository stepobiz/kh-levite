import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessLogRepository } from '../business/entity/process-log.repository';

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_RETENTION_HOURS = 24;

@Injectable()
export class ProcessLogRetentionProcess implements OnModuleInit {
  private readonly logger = new Logger(ProcessLogRetentionProcess.name);

  constructor(
    private readonly repository: ProcessLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.run().catch(err => this.logger.error('Retention loop crashed', err));
  }

  async run() {
    while (true) {
      await this.purge().catch(err => this.logger.error('Purge error', err));
      await new Promise(resolve => setTimeout(resolve, ONE_HOUR_MS));
    }
  }

  private async purge() {
    const retentionHours = await this.getRetentionHours();
    const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
    const result = await this.repository.deleteOlderThan(cutoff);
    if (result.count > 0) {
      this.logger.log(`Purged ${result.count} process logs older than ${retentionHours}h`);
    }
  }

  private async getRetentionHours(): Promise<number> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({
        where: { code: 'infra.process_log_retention_hours' },
      });
      return cfg?.valInt ?? DEFAULT_RETENTION_HOURS;
    } catch {
      return DEFAULT_RETENTION_HOURS;
    }
  }
}
