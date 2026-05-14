import { Injectable, NotFoundException } from '@nestjs/common';
import { NodeTypeRepository } from '../repository/node-type.repository';
import { NodeTypeDto } from '../dto/node-type.dto';

@Injectable()
export class NodeTypeBusiness {
  constructor(private readonly repository: NodeTypeRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`NodeType ${id} not found`);
    return entity;
  }

  create(dto: NodeTypeDto) {
    return this.repository.create({
      name: dto.name!,
      iconSlug: dto.iconSlug,
      category: dto.category! as string,
      valueType: dto.valueType,
    });
  }

  async update(id: number, dto: NodeTypeDto) {
    await this.findById(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.iconSlug !== undefined) data.iconSlug = dto.iconSlug;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.valueType !== undefined) data.valueType = dto.valueType;
    return this.repository.update(id, data);
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
