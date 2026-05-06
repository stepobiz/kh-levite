import { Injectable, Logger } from '@nestjs/common';
import { DeviceComponentBusiness } from '../business/device-component.business';
import { TelemetryLogBusiness } from '../business/telemetry-log.business';
import { IotProtocolDriver } from '../device-driver/iot-protocol-driver';
import { driverRegistry } from '../device-driver/driver-registry';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

const logger = new Logger('TelemetryProcessor');
const COOLDOWN_SECONDS = 5;

@Injectable()
export class TelemetryProcessor {
	constructor(
		private readonly componentBusiness: DeviceComponentBusiness,
		private readonly telemetryBusiness: TelemetryLogBusiness,
		private readonly realtimeGateway?: RealtimeGateway,
	) {}

	async process(): Promise<number> {
		const components = await this.componentBusiness.findAllForProcessor();
		let processed = 0;

		for (const component of components) {
			if (!component.device) {
				logger.warn(`Component ${component.id} has no device loaded`);
				continue;
			}

			const driver: IotProtocolDriver | undefined = driverRegistry[component.device.driver ?? ''];
			if (!driver) {
				logger.error(`Unsupported driver: ${component.device.driver}`);
				continue;
			}

			let hwValue: string;
			try {
				hwValue = await driver.read(component);
				processed++;
			} catch (err) {
				logger.error(`Read error for component ${component.id}:`, err);
				continue;
			}

			const lastLog = await this.telemetryBusiness.findLatestByComponentId(component.id!);
			if (!lastLog || lastLog.value !== hwValue) {
				const log = await this.telemetryBusiness.create({
					componentId: component.id!,
					value: hwValue,
					direction: 'READ',
				});
				this.realtimeGateway?.emitTelemetryUpdate({
					id: log.id!,
					componentId: component.id!,
					value: hwValue,
					direction: 'READ',
					createdAt: log.createdAt!,
				});
			}

			if (component.nextValue == null) continue;

			const cooldownOk = !component.nextValueUpdatedAt ||
				(Date.now() - new Date(component.nextValueUpdatedAt).getTime()) / 1000 >= COOLDOWN_SECONDS;

			if (!cooldownOk) continue;

			if (hwValue === component.nextValue) {
				await this.componentBusiness.setNextValue(component.id!, null);
			} else {
				try {
					await driver.write(component, component.nextValue);
					const writeLog = await this.telemetryBusiness.create({
						componentId: component.id!,
						value: component.nextValue,
						direction: 'WRITE',
					});
					this.realtimeGateway?.emitTelemetryUpdate({
						id: writeLog.id!,
						componentId: component.id!,
						value: component.nextValue,
						direction: 'WRITE',
						createdAt: writeLog.createdAt!,
					});
					await this.componentBusiness.setNextValue(component.id!, null);
				} catch (err) {
					logger.error(`Write error for component ${component.id}:`, err);
				}
			}
		}

		return processed;
	}
}
