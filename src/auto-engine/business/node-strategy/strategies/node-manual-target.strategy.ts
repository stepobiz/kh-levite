import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class NodeManualTargetStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, _context: LogicEngineContext): Promise<string> {
    return node.actualValue;
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    return node.desiredValue;
  }

  syncHardware(): 'NONE' {
    return 'NONE';
  }

  allowedValueTypes(): string[] {
    return ['number', 'boolean', 'string'];
  }
}
