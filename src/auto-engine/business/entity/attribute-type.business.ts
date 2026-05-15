import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    this._assertSelectValid(dto);
    const entity = await this.repository.create(AttributeTypeMapper.toCreateInput(dto));
    return AttributeTypeMapper.toDto(entity);
  }

  async update(id: number, dto: AttributeTypeDto): Promise<AttributeTypeDto> {
    await this.findById(id);
    this._assertSelectValid(dto);
    const entity = await this.repository.update(id, AttributeTypeMapper.toUpdateInput(dto));
    return AttributeTypeMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  private _assertSelectValid(dto: Partial<AttributeTypeDto>): void {
    if (dto.dataType !== 'select') return;
    let parsed: { value: string; label: string }[];
    try {
      parsed = JSON.parse(dto.options ?? '');
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
    } catch {
      throw new BadRequestException('options must be a non-empty JSON array for select type');
    }
    // No value validation here — attribute values are validated on node.business
    void parsed;
  }
}
