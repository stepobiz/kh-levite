import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { IotModule } from './iot/iot.module';
import { AutoEngineModule } from './auto-engine/auto-engine.module';
import { InfraModule } from './infra/infra.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/',
      exclude: ['/api*', '/api-docs*'],
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PrismaModule,
    IotModule,
    AutoEngineModule,
    InfraModule,
    RealtimeModule,
  ],
})
export class AppModule {}