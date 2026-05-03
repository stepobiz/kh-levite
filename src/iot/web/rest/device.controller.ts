import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeviceBusiness } from 'src/iot/business/device.business';
import { DeviceDto } from 'src/iot/dto/device.dto';

@Controller('iot/devices')
export class DeviceController {
  constructor(private readonly business: DeviceBusiness) {}

  @Post()
  @ApiCreatedResponse({ type: DeviceDto })
  create(@Body() dto: DeviceDto) {
    return this.business.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [DeviceDto] })
  findAll() {
    return this.business.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: DeviceDto })
  findById(@Param('id') id: number) {
    return this.business.findById(Number(id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: DeviceDto })
  update(@Param('id') id: number, @Body() dto: DeviceDto) {
    return this.business.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted successfully' })
  delete(@Param('id') id: number) {
    return this.business.delete(Number(id));
  }
}