import { Logger } from '@nestjs/common';
import { DeviceComponentRepository } from '../repository/device-component.repository';
import { TelemetryLogRepository } from '../repository/telemetry-log.repository';
import { IotProtocolDriver } from '../device-driver/iot-protocol-driver';
import { DeviceComponentMapper } from '../mapper/device-component.mapper';
import { driverRegistry } from '../device-driver/driver-registry';

const logger = new Logger('TelemetryProcessor');
const COOLDOWN_SECONDS = 5;

export class TelemetryProcessor {
	constructor(
		private readonly componentRepo: DeviceComponentRepository,
		private readonly logRepo: TelemetryLogRepository,
	) { }

	async process() {
		const components = await this.componentRepo.findAll();

		for (const component of components) {
			const device = component.device;
			if (!device) {
				logger.warn(`Component ${component.id} has no device loaded`);
				continue;
			}

			const driver: IotProtocolDriver | undefined = driverRegistry[device.driver ?? ''];

			if (!driver) {
				logger.error(`Unsupported driver: ${device.driver}`);
				continue;
			}

			let hwValue: string;
			try {
				hwValue = await driver.read(DeviceComponentMapper.toDto(component));
			} catch (err) {
				logger.error(`Read error for component ${component.id}:`, err);
				continue;
			}

			const lastLog = await this.logRepo.findLastByComponentId(component.id!);

			if (!lastLog || lastLog.value !== hwValue) {
				await this.logRepo.create({
					component: { connect: { id: component.id } },
					value: hwValue,
					direction: 'READ',
				});
			}

			if (component['nextValue'] !== null && component['nextValue'] !== undefined) {
				const cooldownOk = !component['nextValueUpdatedAt'] ||
					(new Date().getTime() - new Date(component['nextValueUpdatedAt']).getTime()) / 1000 >= COOLDOWN_SECONDS;

				if (!cooldownOk) continue;

				if (hwValue === component['nextValue']) {
					await this.componentRepo.update(component.id!, { nextValue: null });
				} else {
					try {
						await driver.write(DeviceComponentMapper.toDto(component), component['nextValue']);
						await this.logRepo.create({
							component: { connect: { id: component.id } },
							value: component['nextValue'],
							direction: 'WRITE',
						});
						await this.componentRepo.update(component.id!, { nextValue: null });
					} catch (err) {
						logger.error(`Write error for component ${component.id}:`, err);
					}
				}
			}
		}
	}
}