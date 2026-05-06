import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuenNodeWithAttributes, LogicEngineContext } from './node-strategy.interface';
import { StrategyFactory } from './strategy.factory';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { ProcessLogService } from 'src/infra/process-log/process-log.service';

const PROCESS_NAME = 'logic_engine';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class LogicEngineService implements OnModuleInit {
  private readonly logger = new Logger(LogicEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    @Inject(forwardRef(() => ProcessLogService)) private readonly processLogService: ProcessLogService,
  ) {}

  onModuleInit() {
    this.start().catch(err => this.logger.error('Loop crashed', err));
  }

  async start() {
    while (true) {
      const enabled = await this.getCfgBool('autoengine.enabled') ?? true;
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

      await this.processLogService
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

      const minInterval = await this.getCfg('autoengine.cycle_min_interval_ms') ?? 1000;
      const cooldown = await this.getCfg('autoengine.cycle_cooldown_ms') ?? 0;

      const wait = Math.max(0, minInterval - durationMs) + cooldown;
      if (wait > 0) await sleep(wait);
    }
  }

  async process(): Promise<number> {
    const raw = await this.prisma.auenNode.findMany({
      include: {
        type: true,
        attributes: { include: { attribute: true } },
      },
    });

    const nodes = raw as AuenNodeWithAttributes[];
    const sorted = topoSort(nodes);
    const context: LogicEngineContext = { allNodes: sorted };

    for (const node of sorted) {
      try {
        const strategy = StrategyFactory.getStrategy(node.type.category);

        const prevDesired = node.desiredValue;
        const prevActual = node.actualValue;

        // Phase 1 — calculateDesired
        const nextDesired = await strategy.calculateDesired(node, context);
        if (nextDesired !== node.desiredValue) {
          const now = new Date();
          await this.prisma.auenNode.update({
            where: { id: node.id },
            data: { desiredValue: nextDesired, desiredValueUpdatedAt: now },
          });
          node.desiredValue = nextDesired;
          node.desiredValueUpdatedAt = now;
        }

        // Phase 2 — updateActual
        if (node.actualValue !== node.desiredValue) {
          const nextActual = strategy.updateActual(node);
          if (nextActual !== undefined) {
            const now = new Date();
            await this.prisma.auenNode.update({
              where: { id: node.id },
              data: { actualValue: nextActual, actualValueUpdatedAt: now },
            });
            node.actualValue = nextActual;
            node.actualValueUpdatedAt = now;
          }
        }

        if (node.desiredValue !== prevDesired || node.actualValue !== prevActual) {
          this.realtimeGateway.emitNodeUpdate({
            nodeId: node.id,
            desiredValue: node.desiredValue,
            actualValue: node.actualValue,
            desiredValueUpdatedAt: node.desiredValueUpdatedAt ?? null,
            actualValueUpdatedAt: node.actualValueUpdatedAt ?? null,
          });
        }
      } catch (err) {
        this.logger.error(`Node ${node.id} (${node.code}) error: ${err}`);
      }
    }

    return sorted.length;
  }

  private async getCfg(code: string): Promise<number | null> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({ where: { code } });
      if (!cfg) return null;
      return cfg.valInt ?? null;
    } catch {
      return null;
    }
  }

  private async getCfgBool(code: string): Promise<boolean | null> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({ where: { code } });
      if (!cfg) return null;
      return cfg.valBool ?? null;
    } catch {
      return null;
    }
  }
}

function topoSort(nodes: AuenNodeWithAttributes[]): AuenNodeWithAttributes[] {
  const depthMap = new Map<number, number>();

  const getDepth = (nodeId: number): number => {
    if (depthMap.has(nodeId)) return depthMap.get(nodeId)!;
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.parentId == null) {
      depthMap.set(nodeId, 0);
      return 0;
    }
    const depth = getDepth(node.parentId) + 1;
    depthMap.set(nodeId, depth);
    return depth;
  };

  nodes.forEach(n => getDepth(n.id));
  return [...nodes].sort((a, b) => depthMap.get(b.id)! - depthMap.get(a.id)!);
}
