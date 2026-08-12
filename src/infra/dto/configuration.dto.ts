import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum CfgValueType {
  integer = 'integer',
  float = 'float',
  boolean = 'boolean',
  text = 'text',
  select = 'select',
  json = 'json',
}

export class ConfigurationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() code?: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sectionId?: number;
  @ApiProperty({ enum: CfgValueType }) @IsEnum(CfgValueType) dataType: CfgValueType;
  @ApiPropertyOptional() @IsOptional() @IsString() options?: string;
  @ApiPropertyOptional({ description: 'Solo per dataType=json: array JSON [{key,type,required}] che descrive la forma attesa degli oggetti nell\'array.' })
  @IsOptional() @IsString() pattern?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() valInt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valFloat?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() valBool?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() valText?: string;
}
