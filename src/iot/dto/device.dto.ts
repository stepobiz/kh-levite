import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DeviceParamDto {
  @ApiProperty({ description: 'Chiave del parametro, definita dal driver (es. ipAddress)' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'Valore inserito dall\'utente' })
  @IsString()
  value!: string;
}

export class DeviceDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiPropertyOptional({ description: 'Device name' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ description: 'Driver identifier of the device' })
  @IsOptional()
  @IsString()
  driver?: string;

  @ApiPropertyOptional({
    type: [DeviceParamDto],
    description: 'Parametri specifici del driver scelto (es. ipAddress, macAddress) — vedi GET /api/iot/drivers per sapere quali sono richiesti',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceParamDto)
  params?: DeviceParamDto[];
}
