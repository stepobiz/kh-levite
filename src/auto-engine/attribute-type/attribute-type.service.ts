import { Injectable, NotFoundException } from '@nestjs/common';
import { AttributeTypeRepository } from './attribute-type.repository';
import { AttributeTypeDto } from './dto/attribute-type.dto';

@Injectable()
export class AttributeTypeService {
  constructor(private readonly repository: AttributeTypeRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`AttributeType ${id} not found`);
    return entity;
  }

  create(dto: AttributeTypeDto) {
    return this.repository.create({
      code: dto.code!,
      description: dto.description,
      dataType: dto.dataType!,
    });
  }

  async update(id: number, dto: AttributeTypeDto) {
    await this.findById(id);
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dataType !== undefined) data.dataType = dto.dataType;
    return this.repository.update(id, data);
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
