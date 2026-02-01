import { Controller, Post, Put, Param, Body, ForbiddenException, Get } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeviceComponentBusiness } from 'src/iot/business/device-component.business';
import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';

@ApiTags('DeviceComponent')
@Controller('iot/devices/:deviceId/components')
export class DeviceComponentController {
  constructor(private readonly business: DeviceComponentBusiness) {}

  @Post()
  @ApiCreatedResponse({ type: DeviceComponentDto })
  create(@Param('deviceId') deviceId: string, @Body() dto: DeviceComponentDto) {
    const parsedId = Number(deviceId);
    if (dto.deviceId !== undefined && dto.deviceId !== parsedId) {
      throw new ForbiddenException('deviceId mismatch');
    }
    dto.deviceId = parsedId;
    return this.business.create(dto);
  }

  @Put(':id')
  @ApiOkResponse({ type: DeviceComponentDto })
  update(
    @Param('deviceId') deviceId: string,
    @Param('id') id: string,
    @Body() dto: DeviceComponentDto
  ) {
    const parsedDeviceId = Number(deviceId);
    if (dto.deviceId !== undefined && dto.deviceId !== parsedDeviceId) {
      throw new ForbiddenException('deviceId mismatch');
    }
    dto.deviceId = parsedDeviceId;
    return this.business.update(Number(id), dto);
  }

  @Get()
  @ApiOkResponse({ type: [DeviceComponentDto] })
  findAll(@Param('deviceId') deviceId: string) {
    return this.business.findAllByDevice(Number(deviceId));
  }
}