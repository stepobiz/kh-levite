import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class NodeManualValueByUrlStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, _context: LogicEngineContext): Promise<string> {
    const urlAttr = node.attributes.find(a => a.attribute.code === 'setpoint_url');
    if (!urlAttr?.value) return node.actualValue;
    try {
      const res = await fetch(urlAttr.value, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return node.actualValue;
      const data = await res.json() as { value?: unknown };
      if (data.value === undefined) return node.actualValue;
      return String(data.value);
    } catch {
      return node.actualValue;
    }
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    return node.desiredValue;
  }

  syncHardware(): 'NONE' {
    return 'NONE';
  }
}
