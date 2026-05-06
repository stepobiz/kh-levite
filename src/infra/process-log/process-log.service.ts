import { Injectable } from '@nestjs/common';
import { ProcessLogRepository } from './process-log.repository';

@Injectable()
export class ProcessLogService {
  constructor(private readonly repository: ProcessLogRepository) {}

  log(data: {
    processName: string;
    startedAt: Date;
    endedAt: Date;
    durationMs: number;
    itemCount: number;
    status: string;
    errorMsg?: string;
  }) {
    return this.repository.create(data);
  }

  getStats(processName: string) {
    return Promise.all([
      this.repository.findLast(processName),
      this.repository.findLast100Avg(processName),
      this.repository.findSlowestLast24h(processName),
    ]).then(([lastCycle, last100Avg, slowestLast24h]) => ({
      lastCycle,
      last100Avg,
      slowestLast24h,
    }));
  }
}
