import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AttributeTypeService } from './attribute-type.service';
import { AttributeTypeDto } from './dto/attribute-type.dto';

@ApiTags('AutoEngine — Attribute Types')
@Controller('auen/attribute-types')
export class AttributeTypeController {
  constructor(private readonly service: AttributeTypeService) {}

  @Get()
  @ApiOkResponse({ type: [AttributeTypeDto] })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiCreatedResponse({ type: AttributeTypeDto })
  create(@Body() dto: AttributeTypeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AttributeTypeDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: AttributeTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
