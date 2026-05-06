import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';
import { StrategyFactory } from '../strategy.factory';

export class ProxyInverterStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string> {
    const sourceAttr = node.attributes.find(a => a.attribute.code === 'source_node_id');
    if (!sourceAttr) return node.actualValue;

    const sourceId = parseInt(sourceAttr.value, 10);
    if (isNaN(sourceId)) return node.actualValue;

    const sourceNode = context.allNodes.find(n => n.id === sourceId);
    if (!sourceNode) return node.actualValue;

    if (sourceNode.type.valueType !== 'boolean') return node.actualValue;
    return sourceNode.actualValue === '1' ? '0' : '1';
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    const delayAttr = node.attributes.find(a => a.attribute.code === 'delay_from_child');
    if (delayAttr && node.desiredValueUpdatedAt) {
      const waitMs = parseInt(delayAttr.value, 10) * 1000;
      if (!isNaN(waitMs) && waitMs > 0) {
        const elapsed = Date.now() - new Date(node.desiredValueUpdatedAt).getTime();
        if (elapsed < waitMs) return undefined;
      }
    }
    return node.desiredValue;
  }

  syncHardware(node?: AuenNodeWithAttributes, allNodes?: AuenNodeWithAttributes[]): 'READ' | 'WRITE' | 'NONE' {
    if (!node || !allNodes) return 'NONE';
    const sourceAttr = node.attributes.find(a => a.attribute.code === 'source_node_id');
    if (!sourceAttr) return 'NONE';
    const sourceId = parseInt(sourceAttr.value, 10);
    if (isNaN(sourceId)) return 'NONE';
    const source = allNodes.find(n => n.id === sourceId);
    if (!source) return 'NONE';
    const sourceStrategy = StrategyFactory.getStrategy(source.type.category);
    return sourceStrategy.syncHardware();
  }
}
