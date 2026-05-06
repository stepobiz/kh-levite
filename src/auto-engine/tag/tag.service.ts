import { Injectable, NotFoundException } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { TagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(private readonly repository: TagRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`Tag ${id} not found`);
    return entity;
  }

  create(dto: TagDto) {
    return this.repository.create(dto.name!);
  }

  async update(id: number, dto: TagDto) {
    await this.findById(id);
    return this.repository.update(id, dto.name!);
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
