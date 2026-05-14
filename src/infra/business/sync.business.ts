import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { NodeBusiness } from 'src/auto-engine/business/node.business';
import { AuenNodeWithAttributes } from 'src/auto-engine/business/logic-engine/node-strategy.interface';
import { StrategyFactory } from 'src/auto-engine/business/logic-engine/strategy.factory';
import { DeviceComponentBusiness } from 'src/iot/business/device-component.business';
import { TelemetryLogBusiness } from 'src/iot/business/telemetry-log.business';

@Injectable()
export class SyncBusiness {
  private readonly logger = new Logger(SyncBusiness.name);

  constructor(
    @Inject(forwardRef(() => NodeBusiness)) private readonly nodeBusiness: NodeBusiness,
    @Inject(forwardRef(() => DeviceComponentBusiness)) private readonly componentBusiness: DeviceComponentBusiness,
    @Inject(forwardRef(() => TelemetryLogBusiness)) private readonly telemetryBusiness: TelemetryLogBusiness,
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
        this.logger.error(`SyncEngine node ${node.id} (${node.code}) error: ${err}`);
      }
    }

    return count;
  }
}
