import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuenNodeCategory } from '@prisma/client';
import { NodeTypeRepository } from './node-type.repository';
import { NodeTypeMapper } from './node-type.mapper';
import { NodeTypeDto, NodeTypeAttributeDto } from '../../dto/node-type.dto';
import { StrategyFactory } from '../node-strategy/strategy.factory';

@Injectable()
export class NodeTypeBusiness {
  constructor(private readonly repository: NodeTypeRepository) {}

  async findAll(): Promise<NodeTypeDto[]> {
    const list = await this.repository.findAll();
    return list.map(NodeTypeMapper.toDto);
  }

  async findById(id: number): Promise<NodeTypeDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`NodeType ${id} not found`);
    return NodeTypeMapper.toDto(entity);
  }

  getAllowedValueTypes(category: AuenNodeCategory): string[] {
    const strategy = StrategyFactory.getStrategy(category);
    return strategy.allowedValueTypes();
  }

  async create(dto: NodeTypeDto): Promise<NodeTypeDto> {
    if (dto.category && dto.valueType !== undefined) {
      this._assertValueTypeAllowed(dto.category, dto.valueType);
    }
    const entity = await this.repository.create(NodeTypeMapper.toCreateInput(dto));
    return NodeTypeMapper.toDto(entity);
  }

  async update(id: number, dto: NodeTypeDto): Promise<NodeTypeDto> {
    const existing = await this.findById(id);
    if (existing.isSystem) throw new ForbiddenException(`NodeType ${id} is a system record and cannot be modified`);
    const category = dto.category ?? existing.category;
    const valueType = dto.valueType ?? existing.valueType;
    if (category && valueType !== undefined) {
      this._assertValueTypeAllowed(category as AuenNodeCategory, valueType);
    }
    const entity = await this.repository.update(id, NodeTypeMapper.toUpdateInput(dto));
    return NodeTypeMapper.toDto(entity);
  }

  private _assertValueTypeAllowed(category: AuenNodeCategory, valueType: string | undefined | null): void {
    const allowed = StrategyFactory.getStrategy(category).allowedValueTypes();
    if (allowed.length === 0) return;
    if (!valueType || !allowed.includes(valueType)) {
      throw new BadRequestException(`valueType "${valueType}" is not allowed for category "${category}". Allowed: [${allowed.join(', ')}]`);
    }
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (existing.isSystem) throw new ForbiddenException(`NodeType ${id} is a system record and cannot be deleted`);
    await this.repository.delete(id);
  }

  async findAttributes(nodeTypeId: number): Promise<NodeTypeAttributeDto[]> {
    await this.findById(nodeTypeId);
    const rows = await this.repository.findAttributes(nodeTypeId);
    return rows.map(NodeTypeMapper.toAttributeDto);
  }

  async upsertAttribute(nodeTypeId: number, attributeId: number, isRequired: boolean): Promise<NodeTypeAttributeDto> {
    await this.findById(nodeTypeId);
    const row = await this.repository.upsertAttribute(nodeTypeId, attributeId, isRequired);
    return NodeTypeMapper.toAttributeDto(row);
  }

  async deleteAttribute(nodeTypeId: number, attributeId: number): Promise<void> {
    await this.findById(nodeTypeId);
    await this.repository.deleteAttribute(nodeTypeId, attributeId);
  }
}
