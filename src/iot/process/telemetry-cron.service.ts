import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TelemetryProcessor } from './telemetry-processor';
import { DeviceComponentRepository } from '../repository/device-component.repository';
import { TelemetryLogRepository } from '../repository/telemetry-log.repository';

@Injectable()
export class TelemetryCronService {
  private processor: TelemetryProcessor;

  constructor(
    private readonly componentRepo: DeviceComponentRepository,
    private readonly logRepo: TelemetryLogRepository,
  ) {
    this.processor = new TelemetryProcessor(this.componentRepo, this.logRepo);
  }

  @Cron('*/20 * * * * *') // ogni 20 secondi
  async handleTelemetryPolling() {
	try {
		await this.processor.process();
	} catch (e: any) {
		console.log("errore nell'esecuzione del processo")
	}
  }
}