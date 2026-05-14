import { Injectable, Logger } from '@nestjs/common';
import { NodeBusiness } from './entity/node.business';
import { AuenNodeWithAttributes } from './node-strategy/node-strategy.interface';
import { StrategyFactory } from './node-strategy/strategy.factory';
import { DeviceComponentBusiness } from 'src/iot/business/entity/device-component.business';
import { TelemetryLogBusiness } from 'src/iot/business/entity/telemetry-log.business';

@Injectable()
export class LogicEngineActuatorBusiness {
  private readonly logger = new Logger(LogicEngineActuatorBusiness.name);

  constructor(
    private readonly nodeBusiness: NodeBusiness,
    private readonly componentBusiness: DeviceComponentBusiness,
    private readonly telemetryBusiness: TelemetryLogBusiness,
  ) {}

  async process(): Promise<number> {
    const allNodes = await this.nodeBusiness.findAllWithAttributes() as unknown as AuenNodeWithAttributes[];
    const nodes = allNodes.filter(n => n.iotComponentId != null);
    let count = 0;

    for (const node of nodes) {
      try {
        const strategy = StrategyFactory.getStrategy(node.type.category);
        const direction = strategy.syncHardware(node, allNodes);
        if (direction === 'NONE') continue;

        const componentId = node.iotComponentId!;

        if (direction === 'WRITE') {
          const lastLog = await this.telemetryBusiness.findLatestByComponentId(componentId);
          const component = await this.componentBusiness.findByIdWithNextValue(componentId);
          if (
            lastLog?.value !== node.actualValue &&
            component?.nextValue !== node.actualValue
          ) {
            await this.componentBusiness.setNextValue(componentId, node.actualValue);
            count++;
          }
        } else if (direction === 'READ') {
          const lastLog = await this.telemetryBusiness.findLatestByComponentId(componentId);
          if (lastLog && lastLog.value !== node.actualValue) {
            await this.nodeBusiness.setDesiredFromHardware(node.id, lastLog.value);
            count++;
          }
        }
      } catch (err) {
        this.logger.error(`Node ${node.id} (${node.code}) error: ${err}`);
      }
    }

    return count;
  }
}
