import { AuenNodeWithAttributes, DefaultChildSpec, LogicEngineContext, NodeStrategy } from '../node-strategy.interface';

export class OutThermostatStrategy implements NodeStrategy {
  async calculateDesired(node: AuenNodeWithAttributes, context: LogicEngineContext): Promise<string> {
    const children = context.allNodes.filter(n => n.parentId === node.id);

    const sensor = children.find(c => c.type.category === 'in_sensor');
    const setpoint = children.find(c =>
      c.type.category === 'node_manual_value_by_url' ||
      c.type.category === 'node_manual_target',
    );

    if (!sensor || !setpoint) return node.actualValue;

    const currentTemp = parseFloat(sensor.actualValue);
    const targetTemp = parseFloat(setpoint.actualValue);
    if (isNaN(currentTemp) || isNaN(targetTemp)) return node.actualValue;

    const hysteresisAttr = node.attributes.find(a => a.attribute.code === 'hysteresis');
    const hysteresis = parseFloat(hysteresisAttr?.value ?? '0.5');

    if (node.actualValue === '1') {
      return currentTemp > targetTemp + hysteresis ? '0' : '1';
    } else {
      return currentTemp < targetTemp - hysteresis ? '1' : '0';
    }
  }

  updateActual(node: AuenNodeWithAttributes): string | undefined {
    return node.desiredValue;
  }

  syncHardware(): 'WRITE' {
    return 'WRITE';
  }

  getDefaultChildren(): DefaultChildSpec[] {
    // Requires exactly one AuenNodeType per (category, valueType) pair in the DB.
    // The @@unique([category, valueType]) constraint on AuenNodeType enforces this.
    return [
      { description: 'Setpoint', typeCategory: 'node_manual_target', valueType: 'number', isLogical: true },
      { description: 'Sensore temperatura', typeCategory: 'in_sensor', valueType: 'number', isLogical: true },
    ];
  }
}
