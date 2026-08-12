import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DriverBusiness, DriverInfoDto } from 'src/iot/business/driver.business';

@ApiTags('Drivers')
@Controller('iot/drivers')
export class DriverController {
  constructor(private readonly business: DriverBusiness) {}

  @Get()
  @ApiOkResponse({ description: 'Driver disponibili nel driverRegistry, con i parametri device richiesti da ciascuno' })
  findAll(): DriverInfoDto[] {
    return this.business.findAll();
  }
}
