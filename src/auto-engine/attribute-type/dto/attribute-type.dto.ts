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

  @ApiProperty({ description: 'Value type: string | number | boolean' })
  @IsOptional()
  @IsString()
  dataType?: string;
}
