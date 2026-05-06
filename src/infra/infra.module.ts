import { forwardRef, Module } from '@nestjs/common';
import { AutoEngineModule } from 'src/auto-engine/auto-engine.module';
import { IotModule } from 'src/iot/iot.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { ProcessLogRepository } from './process-log/process-log.repository';
import { ProcessLogService } from './process-log/process-log.service';
import { ProcessLogController } from './process-log/process-log.controller';
import { ProcessLogRetentionService } from './process-log/process-log-retention.service';
import { SyncService } from './sync/sync.service';

@Module({
  imports: [
    ConfigurationModule,
    RealtimeModule,
    forwardRef(() => AutoEngineModule),
    forwardRef(() => IotModule),
  ],
  controllers: [ProcessLogController],
  providers: [
    ProcessLogRepository,
    ProcessLogService,
    ProcessLogRetentionService,
    SyncService,
  ],
  exports: [ProcessLogService],
})
export class InfraModule {}
