import { forwardRef, Module } from '@nestjs/common';
import { AutoEngineModule } from 'src/auto-engine/auto-engine.module';
import { IotModule } from 'src/iot/iot.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { ConfigurationController } from './web/rest/configuration.controller';
import { ConfigurationBusiness } from './business/configuration.business';
import { ConfigurationRepository } from './repository/configuration.repository';
import { SectionController } from './web/rest/section.controller';
import { SectionBusiness } from './business/section.business';
import { SectionRepository } from './repository/section.repository';
import { ProcessLogController } from './web/rest/process-log.controller';
import { ProcessLogBusiness } from './business/process-log.business';
import { ProcessLogRepository } from './repository/process-log.repository';
import { SyncBusiness } from './business/sync.business';
import { ProcessLogRetentionProcess } from './process/process-log-retention.process';
import { SyncProcess } from './process/sync.process';

@Module({
  imports: [
    RealtimeModule,
    forwardRef(() => AutoEngineModule),
    forwardRef(() => IotModule),
  ],
  controllers: [ConfigurationController, SectionController, ProcessLogController],
  providers: [
    ConfigurationBusiness, ConfigurationRepository,
    SectionBusiness, SectionRepository,
    ProcessLogBusiness, ProcessLogRepository,
    SyncBusiness,
    ProcessLogRetentionProcess,
    SyncProcess,
  ],
  exports: [ProcessLogBusiness, ConfigurationBusiness],
})
export class InfraModule {}
