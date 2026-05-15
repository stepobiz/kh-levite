import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AuenNodeCategory } from '@prisma/client';

export class NodeTypeAttributeDto {
  @ApiProperty() nodeTypeId!: number;
  @ApiProperty() attributeId!: number;
  @ApiProperty() isRequired!: boolean;
  @ApiPropertyOptional() attribute?: { id: number; code: string; description?: string | null; dataType: string };
}

export class NodeTypeAttributeInputDto {
  @ApiProperty() @IsBoolean() isRequired!: boolean;
}

export class NodeTypeDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty({ description: 'Readable name (e.g. Termostato)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Icon identifier for UI' })
  @IsOptional()
  @IsString()
  iconSlug?: string;

  @ApiProperty({ enum: AuenNodeCategory, description: 'Determines the Logic Engine strategy' })
  @IsOptional()
  @IsEnum(AuenNodeCategory)
  category?: AuenNodeCategory;

  @ApiPropertyOptional({ description: 'Value type: boolean | number | string' })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional()
  isSystem?: boolean;
}
