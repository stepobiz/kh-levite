import { NodeDto, NodeAttributeResponseDto } from '../../dto/node.dto';

export class NodeMapper {
  static toDto(entity: any): NodeDto {
    if (!entity) return entity;
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      typeId: entity.typeId,
      parentId: entity.parentId,
      iotComponentId: entity.iotComponentId,
      isLogical: entity.isLogical,
      order: entity.order,
      desiredValue: entity.desiredValue,
      desiredValueUpdatedAt: entity.desiredValueUpdatedAt,
      actualValue: entity.actualValue,
      actualValueUpdatedAt: entity.actualValueUpdatedAt,
      type: entity.type,
      parent: entity.parent != null ? NodeMapper.toDto(entity.parent) : entity.parent,
      children: entity.children?.map((c: any) => NodeMapper.toDto(c)),
      attributes: entity.attributes?.map(NodeMapper.toAttributeDto),
      tags: entity.tags,
    };
  }

  static toAttributeDto(entity: any): NodeAttributeResponseDto {
    return {
      nodeId: entity.nodeId,
      attributeId: entity.attributeId,
      value: entity.value,
      attribute: entity.attribute
        ? {
            id: entity.attribute.id,
            code: entity.attribute.code,
            description: entity.attribute.description,
            dataType: entity.attribute.dataType,
          }
        : undefined,
    };
  }
}
