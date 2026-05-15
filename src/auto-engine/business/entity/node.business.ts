import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuenNodeCategory, Prisma } from '@prisma/client';
import { NodeRepository } from './node.repository';
import { NodeMapper } from './node.mapper';
import { NodeDto, NodeAttributeResponseDto } from '../../dto/node.dto';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { AuenNodeWithAttributes, DefaultChildSpec, NodeCreationContext } from '../node-strategy/node-strategy.interface';
import { StrategyFactory } from '../node-strategy/strategy.factory';

const CAN_HAVE_CHILDREN = new Set<AuenNodeCategory>([
  AuenNodeCategory.out_logic_or,
  AuenNodeCategory.out_logic_and,
  AuenNodeCategory.out_thermostat,
  AuenNodeCategory.fake,
]);

const CAN_HAVE_COMPONENT = new Set<AuenNodeCategory>([
  AuenNodeCategory.in_sensor,
  AuenNodeCategory.out_logic_or,
  AuenNodeCategory.out_logic_and,
  AuenNodeCategory.out_thermostat,
  AuenNodeCategory.proxy_mirror,
  AuenNodeCategory.proxy_inverter,
]);

@Injectable()
export class NodeBusiness {
  constructor(
    private readonly repository: NodeRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async findAll(tagId?: number): Promise<NodeDto[]> {
    const list = await this.repository.findAll(tagId);
    return list.map(NodeMapper.toDto);
  }

  async findById(id: number): Promise<NodeDto> {
    const entity = await this._findNodeEntity(id);
    return NodeMapper.toDto(entity);
  }

  findAllWithAttributes(): Promise<AuenNodeWithAttributes[]> {
    return this.repository.findAllWithAttributes() as unknown as Promise<AuenNodeWithAttributes[]>;
  }

  setDesiredFromHardware(id: number, value: string) {
    return this.repository.setDesiredFromHardware(id, value);
  }

  async create(dto: NodeDto): Promise<NodeDto> {
    const nodeType = await this.repository.findTypeById(dto.typeId!);
    const isFake = nodeType?.category === AuenNodeCategory.fake;
    const resolvedIsLogical = isFake ? true : (dto.isLogical ?? false);
    const resolvedIotComponentId = isFake ? null : (dto.iotComponentId ?? null);

    if (resolvedIsLogical && resolvedIotComponentId != null) {
      throw new BadRequestException('A logical node (isLogical=true) cannot have an IoT component');
    }
    if (resolvedIotComponentId != null) {
      await this._assertIotComponentAllowed(dto.typeId!);
      await this._assertComponentNotUsed(resolvedIotComponentId);
    }
    if (dto.parentId != null) {
      await this._assertParentCanHaveChildren(dto.parentId);
    }

    const inputAttributes = (dto.attributes ?? []).filter(a => a.attributeId != null) as Array<{ attributeId: number; value: string }>;
    await this._assertRequiredAttributes(dto.typeId!, inputAttributes);

    const strategy = nodeType ? StrategyFactory.getStrategy(nodeType.category) : null;

    const newNodeId = await this.repository.transaction(async (tx) => {
      const node = await this.repository.create({
        code: dto.code ?? null,
        description: dto.description,
        typeId: dto.typeId!,
        parentId: dto.parentId,
        iotComponentId: resolvedIotComponentId,
        isLogical: resolvedIsLogical,
        attributes: inputAttributes,
      }, tx);

      if (strategy?.onCreate) {
        const ctx: NodeCreationContext = {
          nodeId: node.id,
          createChild: (spec) => this._createAutoChild(spec, node.id, tx),
        };
        await strategy.onCreate(ctx);
      }

      return node.id;
    });

    return NodeMapper.toDto((await this.repository.findById(newNodeId))!);
  }

  async update(id: number, dto: NodeDto): Promise<NodeDto> {
    const existing = await this._findNodeEntity(id);
    const typeId = dto.typeId ?? existing.typeId;
    const nodeType = await this.repository.findTypeById(typeId);
    const isFake = nodeType?.category === AuenNodeCategory.fake;

    if (isFake && dto.isLogical === false) {
      throw new BadRequestException('Nodes of type "fake" are always logical');
    }
    const resolvedIsLogical = isFake ? true : (dto.isLogical ?? existing.isLogical);
    const resolvedIotComponentId = isFake
      ? null
      : ('iotComponentId' in dto ? dto.iotComponentId : existing.iotComponentId);

    if (resolvedIsLogical && resolvedIotComponentId != null) {
      throw new BadRequestException('A logical node (isLogical=true) cannot have an IoT component');
    }
    if (resolvedIotComponentId != null && resolvedIotComponentId !== existing.iotComponentId) {
      await this._assertIotComponentAllowed(typeId);
      await this._assertComponentNotUsed(resolvedIotComponentId, id);
    }
    if (dto.parentId != null && dto.parentId !== existing.parentId) {
      await this._assertParentCanHaveChildren(dto.parentId);
    }

    let inputAttributes: Array<{ attributeId: number; value: string }> | undefined;
    if (dto.attributes !== undefined) {
      inputAttributes = (dto.attributes).filter(a => a.attributeId != null) as Array<{ attributeId: number; value: string }>;
      await this._assertRequiredAttributes(typeId, inputAttributes);
    }

    const entity = await this.repository.update(id, {
      code: dto.code,
      description: dto.description,
      typeId: dto.typeId,
      parentId: dto.parentId,
      iotComponentId: isFake ? null : dto.iotComponentId,
      isLogical: resolvedIsLogical,
      attributes: inputAttributes,
    });
    return NodeMapper.toDto(entity);
  }

  async delete(id: number): Promise<void> {
    await this._findNodeEntity(id);
    await this.repository.delete(id);
  }

  async setParent(id: number, parentId: number): Promise<NodeDto> {
    await this._findNodeEntity(id);
    await this._assertParentCanHaveChildren(parentId);
    const entity = await this.repository.setParent(id, parentId);
    return NodeMapper.toDto(entity);
  }

  async removeParent(id: number): Promise<NodeDto> {
    await this._findNodeEntity(id);
    const entity = await this.repository.removeParent(id);
    return NodeMapper.toDto(entity);
  }

  async setManualValue(id: number, value: string): Promise<NodeDto> {
    const node = await this._findNodeEntity(id);
    if (node.type.category !== AuenNodeCategory.node_manual_target) {
      throw new BadRequestException(`Node ${id} is not of category node_manual_target`);
    }
    const updated = await this.repository.setManualValue(id, value);
    this.realtimeGateway.emitNodeUpdate({
      nodeId: updated.id,
      desiredValue: updated.desiredValue,
      actualValue: updated.actualValue,
      desiredValueUpdatedAt: updated.desiredValueUpdatedAt,
      actualValueUpdatedAt: updated.actualValueUpdatedAt,
    });
    return NodeMapper.toDto(updated);
  }

  async findAttributes(nodeId: number): Promise<NodeAttributeResponseDto[]> {
    const rows = await this.repository.findAttributes(nodeId);
    return rows.map(NodeMapper.toAttributeDto);
  }

  async upsertAttribute(nodeId: number, attributeId: number, value: string): Promise<NodeAttributeResponseDto> {
    await this._findNodeEntity(nodeId);
    const row = await this.repository.upsertAttribute(nodeId, attributeId, value);
    return NodeMapper.toAttributeDto(row);
  }

  async deleteAttribute(nodeId: number, attributeId: number): Promise<void> {
    await this._findNodeEntity(nodeId);
    await this.repository.deleteAttribute(nodeId, attributeId);
  }

  async clone(id: number, override: NodeDto): Promise<NodeDto> {
    const allNodes = await this.repository.findAllRaw();
    const rootNode = allNodes.find(n => n.id === id);
    if (!rootNode) throw new NotFoundException(`Node ${id} not found`);

    const childrenMap = new Map<number, typeof allNodes>();
    allNodes.forEach(n => {
      if (n.parentId != null) {
        if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
        childrenMap.get(n.parentId)!.push(n);
      }
    });

    const subtree: typeof allNodes = [];
    const collectDfs = (nodeId: number) => {
      const node = allNodes.find(n => n.id === nodeId);
      if (!node) return;
      subtree.push(node);
      (childrenMap.get(nodeId) ?? []).forEach(c => collectDfs(c.id));
    };
    collectDfs(id);

    const idMap = new Map<number, number>();
    await this.repository.transaction(async (tx) => {
      for (const node of subtree) {
        const isRoot = node.id === id;
        const newParentId = isRoot
          ? ('parentId' in override ? override.parentId ?? null : rootNode.parentId)
          : (idMap.get(node.parentId!) ?? null);
        const created = await this.repository.createRaw({
          code: isRoot && override.code ? override.code : node.code ?? null,
          description: isRoot ? override.description ?? node.description : node.description,
          typeId: isRoot && override.typeId != null ? override.typeId : node.typeId,
          parentId: newParentId,
          isLogical: node.isLogical,
          attributes: node.attributes.map(a => ({ attributeId: a.attributeId, value: a.value })),
          tags: node.tags.map(t => ({ tagId: t.tagId })),
        }, tx);
        idMap.set(node.id, created.id);
      }
    });

    return NodeMapper.toDto((await this.repository.findById(idMap.get(id)!))!);
  }

  async reorder(id: number, direction: 'up' | 'down'): Promise<NodeDto> {
    await this._findNodeEntity(id);
    const entity = await this.repository.reorder(id, direction);
    return NodeMapper.toDto(entity!);
  }

  async addTag(nodeId: number, tagId: number) {
    await this._findNodeEntity(nodeId);
    return this.repository.addTag(nodeId, tagId);
  }

  async removeTag(nodeId: number, tagId: number) {
    await this._findNodeEntity(nodeId);
    return this.repository.removeTag(nodeId, tagId);
  }

  private async _findNodeEntity(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`Node ${id} not found`);
    return entity;
  }

  private async _assertRequiredAttributes(typeId: number, provided: Array<{ attributeId: number; value: string }>) {
    const requiredIds = await this.repository.findTypeRequiredAttributeIds(typeId);
    if (requiredIds.length === 0) return;
    const providedIds = new Set(provided.map(a => a.attributeId));
    const missing = requiredIds.filter(id => !providedIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required attributes for this node type: attributeId [${missing.join(', ')}]`);
    }
  }

  private async _createAutoChild(spec: DefaultChildSpec, parentId: number, tx?: Prisma.TransactionClient): Promise<void> {
    const childType = await this.repository.findTypeByCategory(spec.typeCategory, spec.valueType);
    if (!childType) return;
    await this.repository.create({
      description: spec.description,
      typeId: childType.id,
      parentId,
      isLogical: spec.isLogical ?? true,
      iotComponentId: null,
    }, tx);
  }

  private async _assertComponentNotUsed(componentId: number, excludeNodeId?: number) {
    const existing = await this.repository.findByIotComponentId(componentId, excludeNodeId);
    if (existing) {
      throw new BadRequestException(
        `IoT component ${componentId} is already linked to node "${existing.code ?? '#' + existing.id}"`,
      );
    }
  }

  private async _assertIotComponentAllowed(typeId: number) {
    const nodeType = await this.repository.findTypeById(typeId);
    const cat = nodeType?.category as AuenNodeCategory;
    if (!CAN_HAVE_COMPONENT.has(cat)) {
      throw new BadRequestException(`Nodes of category "${cat}" cannot be associated to an IoT component`);
    }
  }

  private async _assertParentCanHaveChildren(parentId: number) {
    const parent = await this.repository.findById(parentId);
    if (!parent) throw new BadRequestException(`Parent node ${parentId} not found`);
    const cat = parent.type.category as AuenNodeCategory;
    if (!CAN_HAVE_CHILDREN.has(cat)) {
      throw new BadRequestException(`Nodes of category "${cat}" cannot have children`);
    }
  }
}
