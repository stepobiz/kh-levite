import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { NodeTypeBusiness } from '../../business/entity/node-type.business';
import { NodeTypeDto, NodeTypeAttributeDto, NodeTypeAttributeInputDto } from '../../dto/node-type.dto';

@ApiTags('AutoEngine — Node Types')
@Controller('auen/node-types')
export class NodeTypeController {
  constructor(private readonly business: NodeTypeBusiness) {}

  @Get()
  @ApiOkResponse({ type: [NodeTypeDto] })
  findAll() {
    return this.business.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: NodeTypeDto })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.business.findById(id);
  }

  @Post()
  @ApiCreatedResponse({ type: NodeTypeDto })
  create(@Body() dto: NodeTypeDto) {
    return this.business.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: NodeTypeDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: NodeTypeDto) {
    return this.business.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.business.delete(id);
  }

  @Get(':id/attributes')
  @ApiOkResponse({ type: [NodeTypeAttributeDto] })
  findAttributes(@Param('id', ParseIntPipe) id: number) {
    return this.business.findAttributes(id);
  }

  @Post(':id/attributes/:attributeId')
  @ApiOkResponse({ type: NodeTypeAttributeDto })
  upsertAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
    @Body() dto: NodeTypeAttributeInputDto,
  ) {
    return this.business.upsertAttribute(id, attributeId, dto.isRequired);
  }

  @Delete(':id/attributes/:attributeId')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Association removed' })
  deleteAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
  ) {
    return this.business.deleteAttribute(id, attributeId);
  }
}
