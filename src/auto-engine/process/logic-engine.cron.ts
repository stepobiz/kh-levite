import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LogicEngineService } from './logic-engine.service';

@Injectable()
export class LogicEngineCron {
  private readonly logger = new Logger(LogicEngineCron.name);

  constructor(private readonly logicEngine: LogicEngineService) {}

  @Cron('*/5 * * * * *')
  async runCycle() {
    this.logger.debug('cycle started');
    try {
      await this.logicEngine.process();
      this.logger.debug('cycle completed');
    } catch (err) {
      this.logger.error('cycle failed', err);
    }
  }
}
