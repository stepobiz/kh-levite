import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import { DeviceComponentBusiness } from 'src/iot/business/entity/device-component.business';
import { TelemetryLogBusiness } from 'src/iot/business/entity/telemetry-log.business';
import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';
import { TelemetryLogDto } from 'src/iot/dto/telemetry-log.dto';
import { CommandDto } from 'src/iot/dto/command.dto';

@ApiTags('Components')
@Controller('iot/devices/:deviceId/components')
export class ComponentController {
  constructor(
    private readonly componentBusiness: DeviceComponentBusiness,
    private readonly telemetryBusiness: TelemetryLogBusiness,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: DeviceComponentDto })
  create(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() dto: DeviceComponentDto,
  ) {
    return this.componentBusiness.create(deviceId, dto);
  }

  @Get()
  @ApiOkResponse({ type: [DeviceComponentDto] })
  findAll(@Param('deviceId', ParseIntPipe) deviceId: number) {
    return this.componentBusiness.findAllByDevice(deviceId);
  }

  @Get(':id')
  @ApiOkResponse({ type: DeviceComponentDto })
  findById(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.componentBusiness.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: DeviceComponentDto })
  update(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeviceComponentDto,
  ) {
    return this.componentBusiness.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted successfully' })
  delete(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.componentBusiness.delete(id);
  }

  @Get(':id/telemetry')
  @ApiOkResponse({ type: [TelemetryLogDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max entries (default 100)' })
  findTelemetry(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    return this.telemetryBusiness.findByComponentId(id, limit ? Number(limit) : 100);
  }

  @Get(':id/telemetry/latest')
  @ApiOkResponse({ type: TelemetryLogDto })
  findLatestTelemetry(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.telemetryBusiness.findLatestByComponentId(id);
  }

  @Post(':id/command')
  @ApiCreatedResponse({ type: DeviceComponentDto, description: 'Command buffered on the component' })
  setCommand(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CommandDto,
  ) {
    return this.componentBusiness.setNextValue(id, dto.value);
  }
}
