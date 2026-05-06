import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SectionController } from './section/section.controller';
import { SectionService } from './section/section.service';
import { SectionRepository } from './section/section.repository';
import { ConfigurationController } from './configuration/configuration.controller';
import { ConfigurationService } from './configuration/configuration.service';
import { ConfigurationRepository } from './configuration/configuration.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SectionController, ConfigurationController],
  providers: [SectionService, SectionRepository, ConfigurationService, ConfigurationRepository],
})
export class ConfigurationModule {}
