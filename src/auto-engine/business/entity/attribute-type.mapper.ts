import { AttributeTypeDto } from '../../dto/attribute-type.dto';
import { Prisma } from '@prisma/client';

export class AttributeTypeMapper {
  static toCreateInput(dto: AttributeTypeDto): Prisma.AuenAttributeTypeCreateInput {
    return {
      code: dto.code!,
      description: dto.description ?? null,
      dataType: dto.dataType!,
    };
  }

  static toUpdateInput(dto: Partial<AttributeTypeDto>): Prisma.AuenAttributeTypeUpdateInput {
    const data: Prisma.AuenAttributeTypeUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dataType !== undefined) data.dataType = dto.dataType;
    return data;
  }

  static toDto(entity: any): AttributeTypeDto {
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      dataType: entity.dataType,
      isSystem: entity.isSystem,
    };
  }
}
