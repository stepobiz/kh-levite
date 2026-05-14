import { AuenNodeWithAttributes, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class InSensorStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, _context: LogicEngineContext): Promise<string> {
    return node.actualValue;
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    return node.desiredValue;
  }

  syncHardware(): 'READ' {
    return 'READ';
  }
}
