import { NodeTypeDto, NodeTypeAttributeDto } from '../../dto/node-type.dto';
import { Prisma } from '@prisma/client';

export class NodeTypeMapper {
  static toCreateInput(dto: NodeTypeDto): Prisma.AuenNodeTypeCreateInput {
    return {
      name: dto.name!,
      iconSlug: dto.iconSlug ?? null,
      category: dto.category!,
      valueType: dto.valueType ?? 'boolean',
    };
  }

  static toUpdateInput(dto: Partial<NodeTypeDto>): Prisma.AuenNodeTypeUpdateInput {
    const data: Prisma.AuenNodeTypeUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.iconSlug !== undefined) data.iconSlug = dto.iconSlug;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.valueType !== undefined) data.valueType = dto.valueType;
    return data;
  }

  static toDto(entity: any): NodeTypeDto {
    return {
      id: entity.id,
      name: entity.name,
      iconSlug: entity.iconSlug,
      category: entity.category,
      valueType: entity.valueType,
    };
  }

  static toAttributeDto(entity: any): NodeTypeAttributeDto {
    return {
      nodeTypeId: entity.nodeTypeId,
      attributeId: entity.attributeId,
      isRequired: entity.isRequired,
      attribute: entity.attribute
        ? {
            id: entity.attribute.id,
            code: entity.attribute.code,
            description: entity.attribute.description,
            dataType: entity.attribute.dataType,
          }
        : undefined,
    };
  }
}
