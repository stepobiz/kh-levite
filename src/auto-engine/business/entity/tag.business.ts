import { Injectable, NotFoundException } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { TagMapper } from './tag.mapper';
import { TagDto } from '../../dto/tag.dto';

@Injectable()
export class TagBusiness {
  constructor(private readonly repository: TagRepository) {}

  async findAll(): Promise<TagDto[]> {
    const list = await this.repository.findAll();
    return list.map(TagMapper.toDto);
  }

  async findById(id: number): Promise<TagDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`Tag ${id} not found`);
    return TagMapper.toDto(entity);
  }

  async create(dto: TagDto): Promise<TagDto> {
    const entity = await this.repository.create(TagMapper.toCreateInput(dto));
    return TagMapper.toDto(entity);
  }

  async update(id: number, dto: TagDto): Promise<TagDto> {
    await this.findById(id);
    const entity = await this.repository.update(id, TagMapper.toUpdateInput(dto));
    return TagMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}
