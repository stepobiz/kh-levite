import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const NODE_INCLUDE = {
  type: true,
  parent: true,
  children: true,
  attributes: { include: { attribute: true } },
  tags: { include: { tag: true } },
} as const;

@Injectable()
export class NodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tagId?: number) {
    return this.prisma.auenNode.findMany({
      where: tagId != null ? { tags: { some: { tagId } } } : undefined,
      include: NODE_INCLUDE,
      orderBy: { id: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.auenNode.findUnique({ where: { id }, include: NODE_INCLUDE });
  }

  create(data: { code?: string | null; description?: string | null; typeId: number; parentId?: number | null; iotComponentId?: number | null; isLogical?: boolean; attributes?: Array<{ attributeId: number; value: string }> }) {
    return this.prisma.auenNode.create({
      data: {
        code: data.code ?? null,
        description: data.description,
        typeId: data.typeId,
        parentId: data.parentId ?? null,
        iotComponentId: data.iotComponentId ?? null,
        isLogical: data.isLogical ?? false,
        ...(data.attributes?.length
          ? { attributes: { create: data.attributes.map(a => ({ attributeId: a.attributeId, value: a.value })) } }
          : {}),
      },
      include: NODE_INCLUDE,
    });
  }

  update(id: number, data: { code?: string; description?: string | null; typeId?: number; parentId?: number | null; iotComponentId?: number | null; isLogical?: boolean; attributes?: Array<{ attributeId: number; value: string }> }) {
    const prismaData: Record<string, unknown> = {};
    if (data.code !== undefined) prismaData.code = data.code;
    if (data.description !== undefined) prismaData.description = data.description;
    if (data.typeId !== undefined) prismaData.typeId = data.typeId;
    if ('parentId' in data) prismaData.parentId = data.parentId ?? null;
    if ('iotComponentId' in data) prismaData.iotComponentId = data.iotComponentId ?? null;
    if (data.isLogical !== undefined) prismaData.isLogical = data.isLogical;
    if (data.attributes !== undefined) {
      prismaData.attributes = {
        deleteMany: {},
        create: data.attributes.map(a => ({ attributeId: a.attributeId, value: a.value })),
      };
    }
    return this.prisma.auenNode.update({ where: { id }, data: prismaData as any, include: NODE_INCLUDE });
  }

  findByIotComponentId(componentId: number, excludeNodeId?: number) {
    return this.prisma.auenNode.findFirst({
      where: {
        iotComponentId: componentId,
        ...(excludeNodeId != null ? { id: { not: excludeNodeId } } : {}),
      },
      select: { id: true, code: true },
    });
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
    const now = new Date();
    return this.prisma.auenNode.update({
      where: { id },
      data: {
        desiredValue: value,
        desiredValueUpdatedAt: now,
        actualValue: value,
        actualValueUpdatedAt: now,
      },
      include: NODE_INCLUDE,
    });
  }

  async delete(id: number) {
    const allNodes = await this.prisma.auenNode.findMany({ orderBy: { id: 'asc' } });
    const childrenMap = new Map<number, number[]>();
    allNodes.forEach(n => {
      if (n.parentId != null) {
        if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
        childrenMap.get(n.parentId)!.push(n.id);
      }
    });
    const toDelete: number[] = [];
    const collectDfs = (nodeId: number) => {
      toDelete.push(nodeId);
      (childrenMap.get(nodeId) ?? []).forEach(childId => collectDfs(childId));
    };
    collectDfs(id);
    const deleteOrder = [...toDelete].reverse();
    await this.prisma.$transaction(async tx => {
      for (const nodeId of deleteOrder) {
        await tx.auenNodeTag.deleteMany({ where: { nodeId } });
        await tx.auenNodeAttribute.deleteMany({ where: { nodeId } });
        await tx.auenNode.delete({ where: { id: nodeId } });
      }
    });
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

  addTag(nodeId: number, tagId: number) {
    return this.prisma.auenNodeTag.upsert({
      where: { nodeId_tagId: { nodeId, tagId } },
      update: {},
      create: { nodeId, tagId },
    });
  }

  removeTag(nodeId: number, tagId: number) {
    return this.prisma.auenNodeTag.delete({
      where: { nodeId_tagId: { nodeId, tagId } },
    });
  }

  async reorder(id: number, direction: 'up' | 'down') {
    const node = await this.prisma.auenNode.findUniqueOrThrow({ where: { id } });
    const siblings = await this.prisma.auenNode.findMany({
      where: { parentId: node.parentId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    const idx = siblings.findIndex(s => s.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return this.findById(id);
    [siblings[idx], siblings[targetIdx]] = [siblings[targetIdx], siblings[idx]];
    await this.prisma.$transaction(async tx => {
      for (let i = 0; i < siblings.length; i++) {
        await tx.auenNode.update({ where: { id: siblings[i].id }, data: { order: i } });
      }
    });
    return this.findById(id);
  }

  findTypeById(typeId: number) {
    return this.prisma.auenNodeType.findUnique({ where: { id: typeId } });
  }

  async findTypeRequiredAttributeIds(typeId: number): Promise<number[]> {
    const rows = await this.prisma.auenNodeTypeAttribute.findMany({
      where: { nodeTypeId: typeId, isRequired: true },
      select: { attributeId: true },
    });
    return rows.map(r => r.attributeId);
  }

  findTypeByCategory(category: string, valueType?: string) {
    return this.prisma.auenNodeType.findFirst({
      where: { category: category as any, ...(valueType ? { valueType } : {}) },
    });
  }

  updateDesiredValue(id: number, value: string, updatedAt: Date) {
    return this.prisma.auenNode.update({
      where: { id },
      data: { desiredValue: value, desiredValueUpdatedAt: updatedAt },
    });
  }

  updateActualValue(id: number, value: string, updatedAt: Date) {
    return this.prisma.auenNode.update({
      where: { id },
      data: { actualValue: value, actualValueUpdatedAt: updatedAt },
    });
  }

  findAllWithAttributes() {
    return this.prisma.auenNode.findMany({
      include: { type: true, attributes: { include: { attribute: true } } },
      orderBy: { id: 'asc' },
    });
  }

  findAllWithIotComponent() {
    return this.prisma.auenNode.findMany({
      where: { iotComponentId: { not: null } },
      include: { type: true, attributes: { include: { attribute: true } } },
      orderBy: { id: 'asc' },
    });
  }

  setDesiredFromHardware(id: number, value: string) {
    const now = new Date();
    return this.prisma.auenNode.update({
      where: { id },
      data: {
        desiredValue: value,
        desiredValueUpdatedAt: now,
        actualValue: value,
        actualValueUpdatedAt: now,
      },
    });
  }

  async cloneSubtree(
    rootId: number,
    override?: { code?: string; description?: string | null; typeId?: number; parentId?: number | null },
  ) {
    const allNodes = await this.prisma.auenNode.findMany({
      include: { attributes: true, tags: true },
      orderBy: { id: 'asc' },
    });

    const rootNode = allNodes.find(n => n.id === rootId);
    if (!rootNode) return null;

    // Build a parent→children map for efficient DFS
    const childrenMap = new Map<number, typeof allNodes>();
    allNodes.forEach(n => {
      if (n.parentId != null) {
        if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
        childrenMap.get(n.parentId)!.push(n);
      }
    });

    // Collect subtree in DFS order (parent always before its children)
    const subtree: typeof allNodes = [];
    const collectDfs = (nodeId: number) => {
      const node = allNodes.find(n => n.id === nodeId);
      if (!node) return;
      subtree.push(node);
      (childrenMap.get(nodeId) ?? []).forEach(c => collectDfs(c.id));
    };
    collectDfs(rootId);

    // Code is no longer unique — clones keep the same code as the original.
    // Root uses caller-supplied code if provided.
    const codeMap = new Map<number, string | null>();
    subtree.forEach(n => {
      if (n.id === rootId && override?.code) {
        codeMap.set(n.id, override.code);
      } else {
        codeMap.set(n.id, n.code ?? null);
      }
    });

    const idMap = new Map<number, number>();
    await this.prisma.$transaction(async tx => {
      for (const node of subtree) {
        const isRoot = node.id === rootId;
        const newParentId = isRoot
          ? (override !== undefined && 'parentId' in override ? override.parentId ?? null : rootNode.parentId)
          : (idMap.get(node.parentId!) ?? null);

        const created = await tx.auenNode.create({
          data: {
            code: codeMap.get(node.id) ?? null,
            description: isRoot && override !== undefined ? override.description ?? node.description : node.description,
            typeId: isRoot && override?.typeId != null ? override.typeId : node.typeId,
            parentId: newParentId,
            desiredValue: '0',
            actualValue: '0',
            attributes: {
              create: node.attributes.map(a => ({
                attributeId: a.attributeId,
                value: a.value,
              })),
            },
            tags: {
              create: node.tags.map(t => ({ tagId: t.tagId })),
            },
          },
        });
        idMap.set(node.id, created.id);
      }
    });

    return this.prisma.auenNode.findUniqueOrThrow({
      where: { id: idMap.get(rootId)! },
      include: NODE_INCLUDE,
    });
  }
}
