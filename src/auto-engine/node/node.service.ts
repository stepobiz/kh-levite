import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuenNodeCategory } from '@prisma/client';
import { NodeRepository } from './node.repository';
import { NodeDto } from './dto/node.dto';

@Injectable()
export class NodeService {
  constructor(private readonly repository: NodeRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(`Node ${id} not found`);
    return entity;
  }

  create(dto: NodeDto) {
    return this.repository.create({
      code: dto.code!,
      description: dto.description,
      typeId: dto.typeId!,
      parentId: dto.parentId,
    });
  }

  async update(id: number, dto: NodeDto) {
    await this.findById(id);
    return this.repository.update(id, {
      code: dto.code,
      description: dto.description,
      typeId: dto.typeId,
      parentId: dto.parentId,
    });
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }

  async setParent(id: number, parentId: number) {
    await this.findById(id);
    return this.repository.setParent(id, parentId);
  }

  async removeParent(id: number) {
    await this.findById(id);
    return this.repository.removeParent(id);
  }

  async setManualValue(id: number, value: string) {
    const node = await this.findById(id);
    if (node.type.category !== AuenNodeCategory.in_manual_target) {
      throw new BadRequestException(`Node ${id} is not of category in_manual_target`);
    }
    return this.repository.setManualValue(id, value);
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
}
