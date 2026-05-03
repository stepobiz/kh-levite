import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMACAddress, IsIP } from 'class-validator';

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
}
