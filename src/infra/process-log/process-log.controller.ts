import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { ProcessLogService } from './process-log.service';

@ApiTags('Infra — Process Stats')
@Controller('infra/process-stats')
export class ProcessLogController {
  constructor(private readonly processLogService: ProcessLogService) {}

  @Get(':processName')
  @ApiOkResponse({ description: 'Process statistics for a given process name' })
  getStats(@Param('processName') processName: string) {
    return this.processLogService.getStats(processName);
  }
}
