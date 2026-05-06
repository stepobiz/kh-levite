import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TagDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;
}
