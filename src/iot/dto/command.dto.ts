import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CommandDto {
  @ApiProperty({ description: 'Value to set as pending command on the component' })
  @IsString()
  value!: string;
}
