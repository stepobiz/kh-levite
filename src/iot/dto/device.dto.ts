import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsMACAddress, IsIP, ValidateNested } from 'class-validator';
import { DeviceComponentDto } from './device-component.dto';

export class DeviceDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiPropertyOptional({ description: 'Device name' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ description: 'MAC address of the device' })
  @IsOptional()
  @IsMACAddress()
  macAddress?: string;

  @ApiProperty({ description: 'IP address of the device' })
  @IsIP()
  ipAddress!: string;

  @ApiPropertyOptional({ description: 'Driver identifier of the device' })
  @IsOptional()
  @IsString()
  driver?: string;

  @ApiPropertyOptional({ type: [DeviceComponentDto], description: 'List of device components' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DeviceComponentDto)
  components?: DeviceComponentDto[];
}