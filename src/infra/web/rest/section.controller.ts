import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { SectionBusiness } from '../../business/section.business';
import { SectionDto } from '../../dto/section.dto';

@ApiTags('Configuration — Sections')
@Controller('cfg/sections')
export class SectionController {
  constructor(private readonly business: SectionBusiness) {}

  @Get()
  @ApiOkResponse()
  findAll() {
    return this.business.findAll();
  }

  @Post()
  @ApiCreatedResponse()
  create(@Body() dto: SectionDto) {
    return this.business.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SectionDto) {
    return this.business.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.business.delete(id);
  }
}
