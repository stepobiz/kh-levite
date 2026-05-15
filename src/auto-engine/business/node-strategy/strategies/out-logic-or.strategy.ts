import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class OutLogicOrStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string> {
    const children = context.allNodes.filter(n => n.parentId === node.id);
    const result = children.some(c => _childContributes(c, node, context.allNodes));
    return result ? '1' : '0';
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

  allowedValueTypes(): string[] {
    return ['boolean'];
  }
}

function _getEffectiveValueType(child: AuenNodeWithAttributes, allNodes: AuenNodeWithAttributes[]): string {
  if (child.type.category.startsWith('proxy_')) {
    const sourceAttr = child.attributes.find(a => a.attribute.code === 'source_node_id');
    const sourceId = sourceAttr ? Number(sourceAttr.value) : null;
    const source = sourceId ? allNodes.find(n => n.id === sourceId) : null;
    if (source?.type?.valueType) return source.type.valueType;
  }
  return child.type.valueType ?? 'boolean';
}

function _childContributes(
  child: AuenNodeWithAttributes,
  parent: AuenNodeWithAttributes,
  allNodes: AuenNodeWithAttributes[],
): boolean {
  const vt = _getEffectiveValueType(child, allNodes);
  if (vt === 'thermal') {
    const trigger = parent.attributes.find(a => a.attribute.code === 'thermal_trigger')?.value;
    if (trigger) return child.actualValue === trigger;
    return child.actualValue !== 'off' && child.actualValue != null;
  }
  return child.actualValue === '1';
}
