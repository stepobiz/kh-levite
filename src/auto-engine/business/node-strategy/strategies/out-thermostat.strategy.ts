import { AuenNodeWithAttributes, LogicEngineContext, NodeCreationContext, NodeStrategy } from '../node-strategy.interface';

export class OutThermostatStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string> {
    const children = context.allNodes.filter(n => n.parentId === node.id);

    const sensor = children.find(c => c.type.category === 'in_sensor');
    const setpoint = children.find(c =>
      c.type.category === 'node_manual_value_by_url' ||
      c.type.category === 'node_manual_target',
    );

    if (!sensor || !setpoint) return 'off';

    const currentTemp = parseFloat(sensor.actualValue);
    const targetTemp = parseFloat(setpoint.actualValue);
    if (isNaN(currentTemp) || isNaN(targetTemp)) return 'off';

    const hysteresisAttr = node.attributes.find(a => a.attribute.code === 'hysteresis');
    const hysteresis = parseFloat(hysteresisAttr?.value ?? '0.5');

    const season = context.season;
    if (!season || season === 'off') return 'off';

    if (season === 'winter') {
      if (currentTemp < targetTemp - hysteresis) return 'heat';
      if (currentTemp > targetTemp + hysteresis) return 'off';
      return node.actualValue === 'heat' ? 'heat' : 'off';
    }

    if (season === 'summer') {
      if (currentTemp > targetTemp + hysteresis) return 'cool';
      if (currentTemp < targetTemp - hysteresis) return 'off';
      return node.actualValue === 'cool' ? 'cool' : 'off';
    }

    return 'off';
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    return node.desiredValue;
  }

  syncHardware(): 'NONE' {
    return 'NONE';
  }

  allowedValueTypes(): string[] {
    return ['thermal'];
  }

  async onCreate(ctx: NodeCreationContext): Promise<void> {
    await ctx.createChild({ description: 'Setpoint', typeCategory: 'node_manual_target', valueType: 'number', isLogical: true });
    await ctx.createChild({ description: 'Sensore temperatura', typeCategory: 'in_sensor', valueType: 'number', isLogical: true });
  }
}
