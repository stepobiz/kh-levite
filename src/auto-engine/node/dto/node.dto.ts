import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class NodeAttributeTypeDto {
  @ApiPropertyOptional() id?: number;
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() dataType?: string;
}

export class NodeAttributeResponseDto {
  @ApiPropertyOptional() nodeId?: number;
  @ApiPropertyOptional() attributeId?: number;
  @ApiProperty() value!: string;
  @ApiPropertyOptional({ type: NodeAttributeTypeDto }) attribute?: NodeAttributeTypeDto;
}

export class NodeDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty({ description: 'Unique readable code (e.g. pompa_stradale_auditorium)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ description: 'FK → auen_node_type' })
  @IsOptional()
  @IsInt()
  typeId?: number;

  @ApiPropertyOptional({ description: 'FK → parent auen_node. Null for root nodes.' })
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({ description: 'FK → iot_device_component. Only allowed for in_*, out_*, proxy_* categories (and only if isLogical=false).' })
  @IsOptional()
  @IsInt()
  iotComponentId?: number | null;

  @ApiPropertyOptional({ description: 'If true, the node has no hardware counterpart — iotComponentId cannot be set.' })
  @IsOptional()
  isLogical?: boolean;

  @ApiPropertyOptional({ description: 'Ordering among siblings (nodes with same parent_id). Managed by PATCH /order.' })
  @IsOptional()
  @IsInt()
  order?: number;

  // output only — managed by Logic Engine / Sync
  @ApiPropertyOptional() desiredValue?: string;
  @ApiPropertyOptional() desiredValueUpdatedAt?: Date | null;
  @ApiPropertyOptional() actualValue?: string;
  @ApiPropertyOptional() actualValueUpdatedAt?: Date | null;

  // relations — output only
  @ApiPropertyOptional() type?: Record<string, unknown>;
  @ApiPropertyOptional({ type: () => NodeDto }) parent?: NodeDto | null;
  @ApiPropertyOptional({ type: () => [NodeDto] }) children?: NodeDto[];
  @ApiPropertyOptional({ type: [NodeAttributeResponseDto] }) attributes?: NodeAttributeResponseDto[];
}

export class SetParentDto {
  @ApiProperty()
  @IsInt()
  parentId!: number;
}

export class NodeAttributeDto {
  @ApiProperty()
  @IsString()
  value!: string;
}

export class NodeValueDto {
  @ApiProperty()
  @IsString()
  value!: string;
}

export class NodeReorderDto {
  @ApiProperty({ enum: ['up', 'down'], description: '"up" moves left (lower order), "down" moves right (higher order)' })
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}
