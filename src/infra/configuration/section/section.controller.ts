import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { SectionService } from './section.service';
import { SectionDto } from './dto/section.dto';

@ApiTags('Configuration — Sections')
@Controller('cfg/sections')
export class SectionController {
  constructor(private readonly service: SectionService) {}

  @Get()
  @ApiOkResponse()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiCreatedResponse()
  create(@Body() dto: SectionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: SectionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
