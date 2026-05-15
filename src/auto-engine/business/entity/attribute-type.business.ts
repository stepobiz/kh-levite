import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttributeTypeRepository } from './attribute-type.repository';
import { AttributeTypeMapper } from './attribute-type.mapper';
import { AttributeTypeDto } from '../../dto/attribute-type.dto';

@Injectable()
export class AttributeTypeBusiness {
  constructor(private readonly repository: AttributeTypeRepository) {}

  async findAll(): Promise<AttributeTypeDto[]> {
    const list = await this.repository.findAll();
    return list.map(AttributeTypeMapper.toDto);
  }

  async findById(id: number): Promise<AttributeTypeDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`AttributeType ${id} not found`);
    return AttributeTypeMapper.toDto(entity);
  }

  async create(dto: AttributeTypeDto): Promise<AttributeTypeDto> {
    const entity = await this.repository.create(AttributeTypeMapper.toCreateInput(dto));
    return AttributeTypeMapper.toDto(entity);
  }

  async update(id: number, dto: AttributeTypeDto): Promise<AttributeTypeDto> {
    const existing = await this.findById(id);
    if (existing.isSystem) throw new ForbiddenException(`AttributeType ${id} is a system record and cannot be modified`);
    const entity = await this.repository.update(id, AttributeTypeMapper.toUpdateInput(dto));
    return AttributeTypeMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (existing.isSystem) throw new ForbiddenException(`AttributeType ${id} is a system record and cannot be deleted`);
    await this.repository.delete(id);
  }
}
