import { Module } from '@nestjs/common';
import { DeviceController } from 'src/iot/web/rest/device.controller';
import { DeviceBusiness } from 'src/iot/business/device.business';
import { DeviceRepository } from 'src/iot/repository/device.repository';
import { DeviceComponentController } from 'src/iot/web/rest/device-component.controller';
import { DeviceComponentItemController } from 'src/iot/web/rest/device-component-item.controller';
import { DeviceComponentBusiness } from 'src/iot/business/device-component.business';
import { DeviceComponentRepository } from 'src/iot/repository/device-component.repository';
import { TelemetryLogController } from 'src/iot/web/rest/telemetry-log.controller';
import { TelemetryLogBusiness } from 'src/iot/business/telemetry-log.business';
import { TelemetryLogRepository } from 'src/iot/repository/telemetry-log.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { TelemetryCronService } from './process/telemetry-cron.service';

@Module({
	imports: [
		ScheduleModule.forRoot(),

	],
	controllers: [
		DeviceController,
		DeviceComponentController,
		DeviceComponentItemController,
		TelemetryLogController,

	],
	providers: [
		DeviceBusiness,
		DeviceRepository,
		DeviceComponentBusiness,
		DeviceComponentRepository,
		TelemetryLogBusiness,
		TelemetryLogRepository,
		TelemetryCronService,

	],
})
export class IotModule { }