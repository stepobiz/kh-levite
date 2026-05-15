import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AttributeTypeDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty({ description: 'Code used in logic engine (e.g. delay_from_child)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Value type: string | number | boolean | auen_node | select' })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ description: 'JSON array [{value, label}]. Only for dataType=select.' })
  @IsOptional()
  @IsString()
  options?: string;
}
