import { forwardRef, Module } from '@nestjs/common';
import { DeviceController } from 'src/iot/web/rest/device.controller';
import { DeviceBusiness } from 'src/iot/business/device.business';
import { DeviceRepository } from 'src/iot/repository/device.repository';
import { ComponentController } from 'src/iot/web/rest/component.controller';
import { ComponentsFlatController } from 'src/iot/web/rest/components-flat.controller';
import { DeviceComponentBusiness } from 'src/iot/business/device-component.business';
import { DeviceComponentRepository } from 'src/iot/repository/device-component.repository';
import { TelemetryLogController } from 'src/iot/web/rest/telemetry-log.controller';
import { TelemetryLogBusiness } from 'src/iot/business/telemetry-log.business';
import { TelemetryLogRepository } from 'src/iot/repository/telemetry-log.repository';
import { TelemetryCronService } from './process/telemetry-cron.service';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { InfraModule } from 'src/infra/infra.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    RealtimeModule,
    PrismaModule,
    forwardRef(() => InfraModule),
  ],
  controllers: [
    DeviceController,
    ComponentController,
    ComponentsFlatController,
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
  exports: [DeviceComponentRepository, TelemetryLogRepository],
})
export class IotModule {}
