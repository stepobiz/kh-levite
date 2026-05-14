import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class OutLogicAndStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string> {
    const children = context.allNodes.filter(n => n.parentId === node.id);
    if (children.length === 0) return '0';
    return children.every(c => c.actualValue === '1') ? '1' : '0';
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    const delayAttr = node.attributes.find(a => a.attribute.code === 'delay_from_child');
    if (delayAttr && node.desiredValueUpdatedAt) {
      const waitMs = parseInt(delayAttr.value, 10) * 1000;
      const elapsed = Date.now() - new Date(node.desiredValueUpdatedAt).getTime();
      if (elapsed < waitMs) return undefined;
    }
    return node.desiredValue;
  }

  syncHardware(): 'WRITE' {
    return 'WRITE';
  }
}
