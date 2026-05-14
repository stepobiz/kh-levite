import { Injectable, Logger } from '@nestjs/common';
import { NodeRepository } from 'src/auto-engine/repository/node.repository';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { AuenNodeWithAttributes, LogicEngineContext } from './node-strategy.interface';
import { StrategyFactory } from './strategy.factory';

@Injectable()
export class LogicEngineBusiness {
  private readonly logger = new Logger(LogicEngineBusiness.name);

  constructor(
    private readonly nodeRepository: NodeRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async process(): Promise<number> {
    const raw = await this.nodeRepository.findAllWithAttributes();
    const nodes = raw as AuenNodeWithAttributes[];
    const sorted = topoSort(nodes);
    const context: LogicEngineContext = { allNodes: sorted };

    for (const node of sorted) {
      try {
        const strategy = StrategyFactory.getStrategy(node.type.category);

        const prevDesired = node.desiredValue;
        const prevActual = node.actualValue;

        const nextDesired = await strategy.calculateDesired(node, context);
        if (nextDesired !== node.desiredValue) {
          const now = new Date();
          await this.nodeRepository.updateDesiredValue(node.id, nextDesired, now);
          node.desiredValue = nextDesired;
          node.desiredValueUpdatedAt = now;
        }

        if (node.actualValue !== node.desiredValue) {
          const nextActual = strategy.updateActual(node);
          if (nextActual !== undefined) {
            const now = new Date();
            await this.nodeRepository.updateActualValue(node.id, nextActual, now);
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
