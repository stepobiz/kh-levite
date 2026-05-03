import { AuenNodeCategory } from '@prisma/client';
import { NodeStrategy } from './node-strategy.interface';
import { NodeMirrorStrategy } from './strategies/node-mirror.strategy';

// Placeholder — remaining strategies will be registered in KL-20.
export class StrategyFactory {
  private static readonly strategies: Partial<Record<AuenNodeCategory, NodeStrategy>> = {
    [AuenNodeCategory.node_mirror]: new NodeMirrorStrategy(),
  };

  static getStrategy(category: AuenNodeCategory): NodeStrategy | undefined {
    return this.strategies[category];
  }
}
