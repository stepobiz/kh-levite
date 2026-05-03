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

  async cloneSubtree(
    rootId: number,
    override?: { code?: string; description?: string | null; typeId?: number; parentId?: number | null },
  ) {
    const allNodes = await this.prisma.auenNode.findMany({
      include: { attributes: true },
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

    // Reserve unique codes up-front
    const existingCodes = new Set(allNodes.map(n => n.code));
    const uniqueCode = (base: string): string => {
      let candidate = `${base}_copy`;
      let i = 2;
      while (existingCodes.has(candidate)) candidate = `${base}_copy_${i++}`;
      existingCodes.add(candidate);
      return candidate;
    };

    // Pre-compute codes; root uses caller-supplied code if provided
    const codeMap = new Map<number, string>();
    subtree.forEach(n => {
      if (n.id === rootId && override?.code) {
        existingCodes.add(override.code);
        codeMap.set(n.id, override.code);
      } else {
        codeMap.set(n.id, uniqueCode(n.code));
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
            code: codeMap.get(node.id)!,
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
