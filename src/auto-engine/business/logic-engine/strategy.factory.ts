import { AuenNodeCategory } from '@prisma/client';
import { NodeStrategy } from './node-strategy.interface';
import { InSensorStrategy } from './strategies/in-sensor.strategy';
import { NodeManualTargetStrategy } from './strategies/node-manual-target.strategy';
import { NodeManualValueByUrlStrategy } from './strategies/node-manual-value-by-url.strategy';
import { ProxyMirrorStrategy } from './strategies/proxy-mirror.strategy';
import { ProxyInverterStrategy } from './strategies/proxy-inverter.strategy';
import { FakeStrategy } from './strategies/fake.strategy';
import { OutLogicOrStrategy } from './strategies/out-logic-or.strategy';
import { OutLogicAndStrategy } from './strategies/out-logic-and.strategy';
import { OutThermostatStrategy } from './strategies/out-thermostat.strategy';

export class StrategyFactory {
  private static readonly strategies: Record<AuenNodeCategory, NodeStrategy> = {
    [AuenNodeCategory.in_sensor]: new InSensorStrategy(),
    [AuenNodeCategory.node_manual_target]: new NodeManualTargetStrategy(),
    [AuenNodeCategory.node_manual_value_by_url]: new NodeManualValueByUrlStrategy(),
    [AuenNodeCategory.proxy_mirror]: new ProxyMirrorStrategy(),
    [AuenNodeCategory.proxy_inverter]: new ProxyInverterStrategy(),
    [AuenNodeCategory.fake]: new FakeStrategy(),
    [AuenNodeCategory.out_logic_or]: new OutLogicOrStrategy(),
    [AuenNodeCategory.out_logic_and]: new OutLogicAndStrategy(),
    [AuenNodeCategory.out_thermostat]: new OutThermostatStrategy(),
  };

  static getStrategy(category: AuenNodeCategory): NodeStrategy {
    const strategy = this.strategies[category];
    if (!strategy) throw new Error(`No strategy registered for category: ${category}`);
    return strategy;
  }
}
