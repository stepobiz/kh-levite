import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuenNodeCategory } from '@prisma/client';

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
}
