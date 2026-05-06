import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuenNodeCategory } from '@prisma/client';
import { NodeRepository } from './node.repository';
import { NodeDto } from './dto/node.dto';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

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
export class NodeService {
  constructor(
    private readonly repository: NodeRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  findAll(tagId?: number) {
    return this.repository.findAll(tagId);
  }

  async findById(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`Node ${id} not found`);
    return entity;
  }

  async create(dto: NodeDto) {
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
    return this.repository.create({
      code: dto.code ?? null,
      description: dto.description,
      typeId: dto.typeId!,
      parentId: dto.parentId,
      iotComponentId: resolvedIotComponentId,
      isLogical: resolvedIsLogical,
    });
  }

  async update(id: number, dto: NodeDto) {
    const existing = await this.findById(id);
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
    return this.repository.update(id, {
      code: dto.code,
      description: dto.description,
      typeId: dto.typeId,
      parentId: dto.parentId,
      iotComponentId: isFake ? null : dto.iotComponentId,
      isLogical: resolvedIsLogical,
    });
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }

  async setParent(id: number, parentId: number) {
    await this.findById(id);
    await this._assertParentCanHaveChildren(parentId);
    return this.repository.setParent(id, parentId);
  }

  async removeParent(id: number) {
    await this.findById(id);
    return this.repository.removeParent(id);
  }

  async setManualValue(id: number, value: string) {
    const node = await this.findById(id);
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
    return updated;
  }

  findAttributes(nodeId: number) {
    return this.repository.findAttributes(nodeId);
  }

  async upsertAttribute(nodeId: number, attributeId: number, value: string) {
    await this.findById(nodeId);
    return this.repository.upsertAttribute(nodeId, attributeId, value);
  }

  async deleteAttribute(nodeId: number, attributeId: number) {
    await this.findById(nodeId);
    return this.repository.deleteAttribute(nodeId, attributeId);
  }

  async clone(id: number, override: NodeDto) {
    await this.findById(id);
    return this.repository.cloneSubtree(id, override);
  }

  async reorder(id: number, direction: 'up' | 'down') {
    await this.findById(id);
    return this.repository.reorder(id, direction);
  }

  async addTag(nodeId: number, tagId: number) {
    await this.findById(nodeId);
    return this.repository.addTag(nodeId, tagId);
  }

  async removeTag(nodeId: number, tagId: number) {
    await this.findById(nodeId);
    return this.repository.removeTag(nodeId, tagId);
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
