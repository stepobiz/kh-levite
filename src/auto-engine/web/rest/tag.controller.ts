import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { TagBusiness } from '../../business/entity/tag.business';
import { TagDto } from '../../dto/tag.dto';

@ApiTags('AutoEngine — Tags')
@Controller('auen/tags')
export class TagController {
  constructor(private readonly business: TagBusiness) {}

  @Get()
  @ApiOkResponse({ type: [TagDto] })
  findAll() {
    return this.business.findAll();
  }

  @Post()
  @ApiCreatedResponse({ type: TagDto })
  create(@Body() dto: TagDto) {
    return this.business.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TagDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: TagDto) {
    return this.business.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Deleted' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.business.delete(id);
  }
}
