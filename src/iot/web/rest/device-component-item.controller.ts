import { Controller, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { DeviceComponentBusiness } from 'src/iot/business/device-component.business';
import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';

@ApiTags('DeviceComponent')
@Controller('iot/device-components')
export class DeviceComponentItemController {
  constructor(private readonly business: DeviceComponentBusiness) {}

  @Get()
  @ApiOkResponse({ type: [DeviceComponentDto] })
  findAll() {
    return this.business.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: DeviceComponentDto })
  findById(@Param('id') id: string) {
    return this.business.findById(Number(id));
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted successfully' })
  delete(@Param('id') id: string) {
    return this.business.delete(Number(id));
  }
}