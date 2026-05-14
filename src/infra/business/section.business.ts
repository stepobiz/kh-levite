import { Injectable, NotFoundException } from '@nestjs/common';
import { SectionRepository } from '../repository/section.repository';
import { SectionDto } from '../dto/section.dto';

@Injectable()
export class SectionBusiness {
  constructor(private readonly repository: SectionRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`Section ${id} not found`);
    return entity;
  }

  create(dto: SectionDto) {
    return this.repository.create({ code: dto.code, name: dto.name });
  }

  async update(id: number, dto: SectionDto) {
    await this.findById(id);
    return this.repository.update(id, { code: dto.code, name: dto.name });
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
