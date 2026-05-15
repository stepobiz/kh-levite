import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ConfigurationBusiness } from '../../business/entity/configuration.business';
import { ConfigurationDto } from '../../dto/configuration.dto';

@ApiTags('Configuration — Configurations')
@Controller('cfg/configurations')
export class ConfigurationController {
  constructor(private readonly business: ConfigurationBusiness) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query('sectionId', new ParseIntPipe({ optional: true })) sectionId?: number) {
    return this.business.findAll(sectionId);
  }

  @Get(':code')
  @ApiOkResponse()
  findByCode(@Param('code') code: string) {
    return this.business.findByCode(code);
  }

  @Post()
  @ApiCreatedResponse()
  create(@Body() dto: ConfigurationDto) {
    return this.business.create(dto);
  }

  @Patch(':code')
  @ApiOkResponse()
  update(@Param('code') code: string, @Body() dto: ConfigurationDto) {
    return this.business.update(code, dto);
  }

  @Delete(':code')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('code') code: string) {
    return this.business.delete(code);
  }
}
