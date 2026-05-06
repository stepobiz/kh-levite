import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DeviceComponentBusiness } from 'src/iot/business/device-component.business';
import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';

@ApiTags('Components')
@Controller('iot/components')
export class ComponentsFlatController {
  constructor(private readonly business: DeviceComponentBusiness) {}

  @Get()
  @ApiOkResponse({ type: [DeviceComponentDto] })
  findAll() {
    return this.business.findAll();
  }
}
