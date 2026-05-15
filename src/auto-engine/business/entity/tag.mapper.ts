import { TagDto } from '../../dto/tag.dto';
import { Prisma } from '@prisma/client';

export class TagMapper {
  static toCreateInput(dto: TagDto): Prisma.AuenTagCreateInput {
    return { name: dto.name! };
  }

  static toUpdateInput(dto: Partial<TagDto>): Prisma.AuenTagUpdateInput {
    const data: Prisma.AuenTagUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    return data;
  }

  static toDto(entity: any): TagDto {
    return {
      id: entity.id,
      name: entity.name,
    };
  }
}
