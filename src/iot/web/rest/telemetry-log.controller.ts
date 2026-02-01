import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { TelemetryLogBusiness } from 'src/iot/business/telemetry-log.business';
import { TelemetryLogDto } from 'src/iot/dto/telemetry-log.dto';

@Controller('iot/telemetry-logs')
export class TelemetryLogController {
  constructor(private readonly business: TelemetryLogBusiness) {}

  @Get()
  @ApiOkResponse({ type: [TelemetryLogDto] })
  findAll() {
    return this.business.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: TelemetryLogDto })
  findById(@Param('id') id: number) {
    return this.business.findById(id);
  }
}