import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { NodeTypeService } from './node-type.service';
import { NodeTypeDto } from './dto/node-type.dto';

@ApiTags('AutoEngine — Node Types')
@Controller('auen/node-types')
export class NodeTypeController {
  constructor(private readonly service: NodeTypeService) {}

  @Get()
  @ApiOkResponse({ type: [NodeTypeDto] })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: NodeTypeDto })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @ApiCreatedResponse({ type: NodeTypeDto })
  create(@Body() dto: NodeTypeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: NodeTypeDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: NodeTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
