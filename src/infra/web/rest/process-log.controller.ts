import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { ProcessLogBusiness } from '../../business/process-log.business';

@ApiTags('Infra — Process Stats')
@Controller('infra/process-stats')
export class ProcessLogController {
  constructor(private readonly business: ProcessLogBusiness) {}

  @Get(':processName')
  @ApiOkResponse({ description: 'Process statistics for a given process name' })
  getStats(@Param('processName') processName: string) {
    return this.business.getStats(processName);
  }
}
