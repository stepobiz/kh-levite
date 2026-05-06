import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { DeviceDto } from './device.dto';

export class DeviceComponentDto {
	@ApiPropertyOptional({ description: 'Unique identifier of the component' })
	id?: number;

	@ApiPropertyOptional({ description: 'ID of the related device' })
	@IsOptional()
	@IsInt()
	deviceId?: number;

	@ApiHideProperty()
	device?: DeviceDto;

	@ApiPropertyOptional({ description: 'Linked AutoEngine node (at most one)' })
	linkedNode?: { id: number; code?: string | null };

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

	@ApiPropertyOptional()
	@IsOptional()
	createdAt?: Date;
}
