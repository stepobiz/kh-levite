import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProcessLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    processName: string;
    startedAt: Date;
    endedAt: Date;
    durationMs: number;
    itemCount: number;
    status: string;
    errorMsg?: string;
  }) {
    return this.prisma.sysProcessLog.create({ data });
  }

  findLast(processName: string) {
    return this.prisma.sysProcessLog.findFirst({
      where: { processName },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findLast100Avg(processName: string): Promise<{ avgDurationMs: number; successRate: number }> {
    const rows = await this.prisma.sysProcessLog.findMany({
      where: { processName },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
    if (rows.length === 0) return { avgDurationMs: 0, successRate: 1 };
    const avgDurationMs = Math.round(rows.reduce((s, r) => s + r.durationMs, 0) / rows.length);
    const successRate = rows.filter(r => r.status === 'success').length / rows.length;
    return { avgDurationMs, successRate };
  }

  findSlowestLast24h(processName: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.sysProcessLog.findFirst({
      where: { processName, startedAt: { gte: since } },
      orderBy: { durationMs: 'desc' },
    });
  }

  deleteOlderThan(before: Date) {
    return this.prisma.sysProcessLog.deleteMany({ where: { startedAt: { lt: before } } });
  }
}
