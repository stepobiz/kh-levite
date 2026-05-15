import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum CfgValueType {
  integer = 'integer',
  float = 'float',
  boolean = 'boolean',
  text = 'text',
}

export class ConfigurationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() code?: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sectionId?: number;
  @ApiProperty({ enum: CfgValueType }) @IsEnum(CfgValueType) dataType: CfgValueType;
  @ApiPropertyOptional() @IsOptional() @IsInt() valInt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valFloat?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() valBool?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() valText?: string;

}
