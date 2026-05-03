import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class NodeMirrorStrategy implements NodeStrategy {
  calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): string {
    const sourceAttr = node.attributes.find(a => a.attribute.code === 'source_node_id');
    if (!sourceAttr) return node.actualValue;

    const sourceId = parseInt(sourceAttr.value, 10);
    if (isNaN(sourceId)) return node.actualValue;

    const sourceNode = context.allNodes.find(n => n.id === sourceId);
    return sourceNode?.actualValue ?? node.actualValue;
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    return node.desiredValue;
  }

  syncHardware(): 'NONE' {
    return 'NONE';
  }
}
