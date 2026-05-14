import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NodeTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auenNodeType.findMany({ orderBy: { id: 'asc' } });
  }

  findById(id: number) {
    return this.prisma.auenNodeType.findUnique({ where: { id } });
  }

  create(data: { name: string; iconSlug?: string | null; category: string; valueType?: string }) {
    return this.prisma.auenNodeType.create({ data: data as any });
  }

  update(id: number, data: Record<string, unknown>) {
    return this.prisma.auenNodeType.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.auenNodeType.delete({ where: { id } });
  }

  findAttributes(nodeTypeId: number) {
    return this.prisma.auenNodeTypeAttribute.findMany({
      where: { nodeTypeId },
      include: { attribute: true },
      orderBy: { attributeId: 'asc' },
    });
  }

  upsertAttribute(nodeTypeId: number, attributeId: number, isRequired: boolean) {
    return this.prisma.auenNodeTypeAttribute.upsert({
      where: { nodeTypeId_attributeId: { nodeTypeId, attributeId } },
      update: { isRequired },
      create: { nodeTypeId, attributeId, isRequired },
      include: { attribute: true },
    });
  }

  deleteAttribute(nodeTypeId: number, attributeId: number) {
    return this.prisma.auenNodeTypeAttribute.delete({
      where: { nodeTypeId_attributeId: { nodeTypeId, attributeId } },
    });
  }
}
