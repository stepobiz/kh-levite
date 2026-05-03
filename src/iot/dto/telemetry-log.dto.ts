import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';

export class TelemetryLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: number;

  @ApiProperty({ description: 'ID of the related device component' })
  @IsInt()
  componentId!: number;

  @ApiProperty({ description: 'Logged value' })
  @IsString()
  value!: string;

  @ApiProperty({ enum: ['READ', 'WRITE'], description: 'Direction of data' })
  @IsIn(['READ', 'WRITE'])
  direction!: 'READ' | 'WRITE';

  @ApiPropertyOptional({ description: 'Date and time of the log' })
  @IsOptional()
  createdAt?: Date;
}