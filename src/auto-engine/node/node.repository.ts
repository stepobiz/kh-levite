import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const NODE_INCLUDE = {
  type: true,
  parent: true,
  children: true,
  attributes: { include: { attribute: true } },
} as const;

@Injectable()
export class NodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auenNode.findMany({ include: NODE_INCLUDE, orderBy: { id: 'asc' } });
  }

  findById(id: number) {
    return this.prisma.auenNode.findUnique({ where: { id }, include: NODE_INCLUDE });
  }

  create(data: { code: string; description?: string | null; typeId: number; parentId?: number | null }) {
    return this.prisma.auenNode.create({
      data: {
        code: data.code,
        description: data.description,
        typeId: data.typeId,
        parentId: data.parentId ?? null,
      },
      include: NODE_INCLUDE,
    });
  }

  update(id: number, data: { code?: string; description?: string | null; typeId?: number; parentId?: number | null }) {
    const prismaData: Record<string, unknown> = {};
    if (data.code !== undefined) prismaData.code = data.code;
    if (data.description !== undefined) prismaData.description = data.description;
    if (data.typeId !== undefined) prismaData.typeId = data.typeId;
    if ('parentId' in data) prismaData.parentId = data.parentId ?? null;
    return this.prisma.auenNode.update({ where: { id }, data: prismaData as any, include: NODE_INCLUDE });
  }

  setParent(id: number, parentId: number) {
    return this.prisma.auenNode.update({
      where: { id },
      data: { parentId },
      include: NODE_INCLUDE,
    });
  }

  removeParent(id: number) {
    return this.prisma.auenNode.update({
      where: { id },
      data: { parentId: null },
      include: NODE_INCLUDE,
    });
  }

  setManualValue(id: number, value: string) {
    return this.prisma.auenNode.update({
      where: { id },
      data: { actualValue: value, actualValueUpdatedAt: new Date() },
      include: NODE_INCLUDE,
    });
  }

  delete(id: number) {
    return this.prisma.auenNode.delete({ where: { id } });
  }

  findAttributes(nodeId: number) {
    return this.prisma.auenNodeAttribute.findMany({
      where: { nodeId },
      include: { attribute: true },
    });
  }

  upsertAttribute(nodeId: number, attributeId: number, value: string) {
    return this.prisma.auenNodeAttribute.upsert({
      where: { nodeId_attributeId: { nodeId, attributeId } },
      update: { value },
      create: { nodeId, attributeId, value },
      include: { attribute: true },
    });
  }

  deleteAttribute(nodeId: number, attributeId: number) {
    return this.prisma.auenNodeAttribute.delete({
      where: { nodeId_attributeId: { nodeId, attributeId } },
    });
  }
}
