import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { TelemetryLogBusiness } from 'src/iot/business/entity/telemetry-log.business';
import { TelemetryLogDto } from 'src/iot/dto/telemetry-log.dto';

@Controller('iot/telemetry-logs')
export class TelemetryLogController {
  constructor(private readonly business: TelemetryLogBusiness) {}

  @Get()
  @ApiOkResponse({ type: [TelemetryLogDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('limit') limit?: string) {
    return this.business.findAll(limit ? parseInt(limit, 10) : undefined);
  }

  @Get(':id')
  @ApiOkResponse({ type: TelemetryLogDto })
  findById(@Param('id') id: number) {
    return this.business.findById(id);
  }
}