import {
  Controller, Get, Post, Patch, Put, Delete,
  Param, Query, Body, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { NodeService } from './node.service';
import {
  NodeDto,
  SetParentDto,
  NodeAttributeDto,
  NodeAttributeResponseDto,
  NodeValueDto,
  NodeReorderDto,
} from './dto/node.dto';

@ApiTags('AutoEngine — Nodes')
@Controller('auen/nodes')
export class NodeController {
  constructor(private readonly service: NodeService) {}

  @Get()
  @ApiOkResponse({ type: [NodeDto] })
  findAll(@Query('tagId', new ParseIntPipe({ optional: true })) tagId?: number) {
    return this.service.findAll(tagId);
  }

  @Get(':id')
  @ApiOkResponse({ type: NodeDto })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @ApiCreatedResponse({ type: NodeDto })
  create(@Body() dto: NodeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: NodeDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: NodeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

  @Patch(':id/parent')
  @ApiOkResponse({ type: NodeDto })
  setParent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetParentDto,
  ) {
    return this.service.setParent(id, dto.parentId);
  }

  @Delete(':id/parent')
  @ApiOkResponse({ type: NodeDto })
  removeParent(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeParent(id);
  }

  @Get(':id/attributes')
  @ApiOkResponse({ type: [NodeAttributeResponseDto] })
  findAttributes(@Param('id', ParseIntPipe) id: number) {
    return this.service.findAttributes(id);
  }

  @Put(':id/attributes/:attributeId')
  @ApiOkResponse({ type: NodeAttributeResponseDto })
  upsertAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
    @Body() dto: NodeAttributeDto,
  ) {
    return this.service.upsertAttribute(id, attributeId, dto.value);
  }

  @Delete(':id/attributes/:attributeId')
  @ApiOkResponse({ description: 'Attribute removed' })
  deleteAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
  ) {
    return this.service.deleteAttribute(id, attributeId);
  }

  @Post(':id/value')
  @ApiCreatedResponse({ type: NodeDto })
  setManualValue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NodeValueDto,
  ) {
    return this.service.setManualValue(id, dto.value);
  }

  @Patch(':id/order')
  @ApiOkResponse({ type: NodeDto })
  reorder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NodeReorderDto,
  ) {
    return this.service.reorder(id, dto.direction);
  }

  @Post(':id/clone')
  @ApiCreatedResponse({ type: NodeDto })
  clone(
    @Param('id', ParseIntPipe) id: number,
    @Body() override: NodeDto,
  ) {
    return this.service.clone(id, override);
  }

  @Put(':id/tags/:tagId')
  @ApiOkResponse({ description: 'Tag added' })
  addTag(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.service.addTag(id, tagId);
  }

  @Delete(':id/tags/:tagId')
  @ApiOkResponse({ description: 'Tag removed' })
  removeTag(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.service.removeTag(id, tagId);
  }
}
