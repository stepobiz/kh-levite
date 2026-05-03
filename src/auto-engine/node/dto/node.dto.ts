import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

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
  description?: string;

  @ApiProperty({ description: 'FK → auen_node_type' })
  @IsOptional()
  @IsInt()
  typeId?: number;

  @ApiPropertyOptional({ description: 'FK → parent auen_node. Null for root nodes.' })
  @IsOptional()
  @IsInt()
  parentId?: number | null;

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
