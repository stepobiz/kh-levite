import { Module } from '@nestjs/common';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { ConfigurationController } from './web/rest/configuration.controller';
import { ConfigurationBusiness } from './business/entity/configuration.business';
import { ConfigurationRepository } from './business/entity/configuration.repository';
import { SectionController } from './web/rest/section.controller';
import { SectionBusiness } from './business/entity/section.business';
import { SectionRepository } from './business/entity/section.repository';
import { ProcessLogController } from './web/rest/process-log.controller';
import { ProcessLogBusiness } from './business/entity/process-log.business';
import { ProcessLogRepository } from './business/entity/process-log.repository';
import { ProcessLogRetentionProcess } from './process/process-log-retention.process';

@Module({
  imports: [RealtimeModule],
  controllers: [ConfigurationController, SectionController, ProcessLogController],
  providers: [
    ConfigurationBusiness, ConfigurationRepository,
    SectionBusiness, SectionRepository,
    ProcessLogBusiness, ProcessLogRepository,
    ProcessLogRetentionProcess,
  ],
  exports: [ProcessLogBusiness, ConfigurationBusiness],
})
export class InfraModule {}
