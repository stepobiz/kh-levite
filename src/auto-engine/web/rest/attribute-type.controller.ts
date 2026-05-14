import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AttributeTypeBusiness } from '../../business/attribute-type.business';
import { AttributeTypeDto } from '../../dto/attribute-type.dto';

@ApiTags('AutoEngine — Attribute Types')
@Controller('auen/attribute-types')
export class AttributeTypeController {
  constructor(private readonly business: AttributeTypeBusiness) {}

  @Get()
  @ApiOkResponse({ type: [AttributeTypeDto] })
  findAll() {
    return this.business.findAll();
  }

  @Post()
  @ApiCreatedResponse({ type: AttributeTypeDto })
  create(@Body() dto: AttributeTypeDto) {
    return this.business.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AttributeTypeDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: AttributeTypeDto) {
    return this.business.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.business.delete(id);
  }
}
