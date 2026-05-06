import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { TagDto } from './dto/tag.dto';

@ApiTags('AutoEngine — Tags')
@Controller('auen/tags')
export class TagController {
  constructor(private readonly service: TagService) {}

  @Get()
  @ApiOkResponse({ type: [TagDto] })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiCreatedResponse({ type: TagDto })
  create(@Body() dto: TagDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TagDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: TagDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
