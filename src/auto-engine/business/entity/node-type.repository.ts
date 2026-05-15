import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  create(data: Prisma.AuenNodeTypeCreateInput) {
    return this.prisma.auenNodeType.create({ data });
  }

  update(id: number, data: Prisma.AuenNodeTypeUpdateInput) {
    return this.prisma.auenNodeType.update({ where: { id }, data });
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
