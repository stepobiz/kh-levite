import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeviceBusiness } from 'src/iot/business/entity/device.business';
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
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.business.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: DeviceDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: DeviceDto) {
    return this.business.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted successfully' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.business.delete(id);
  }
}