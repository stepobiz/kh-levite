import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceDto } from './device.dto';

export class DeviceComponentDto {
	@ApiPropertyOptional({ description: 'Unique identifier of the component' })
	id?: number;

	@ApiProperty({ description: 'ID of the related device' })
	@IsInt()
	deviceId!: number;

	@ApiPropertyOptional({ type: () => DeviceDto, description: 'Parent device object (if loaded)' })
	@IsOptional()
	@ValidateNested()
	@Type(() => DeviceDto)
	device?: DeviceDto;

	@ApiPropertyOptional({ description: 'Component name' })
	@IsOptional()
	@IsString()
	componentName?: string;

	@ApiProperty({ description: 'Index of the hardware on the device' })
	@IsInt()
	hardwareIndex!: number;

	@ApiPropertyOptional({ description: 'Hardware address of the component' })
	@IsOptional()
	@IsString()
	hardwareAddress?: string;
}