import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';
import { ConfigurationDto } from './dto/configuration.dto';

@ApiTags('Configuration — Configurations')
@Controller('cfg/configurations')
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query('sectionId', new ParseIntPipe({ optional: true })) sectionId?: number) {
    return this.service.findAll(sectionId);
  }

  @Get(':code')
  @ApiOkResponse()
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Post()
  @ApiCreatedResponse()
  create(@Body() dto: ConfigurationDto) {
    return this.service.create(dto);
  }

  @Patch(':code')
  @ApiOkResponse()
  update(@Param('code') code: string, @Body() dto: ConfigurationDto) {
    return this.service.update(code, dto);
  }

  @Delete(':code')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('code') code: string) {
    return this.service.delete(code);
  }
}
