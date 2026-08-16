import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

	@ApiPropertyOptional({ description: 'AutoEngine nodes linked to this component (0..N — exclusive-category nodes are limited to 1, in_sensor can share)' })
	linkedNodes?: { id: number; code?: string | null }[];

	@ApiPropertyOptional({ description: 'Component name' })
	@IsOptional()
	@IsString()
	componentName?: string;

	@ApiPropertyOptional({ description: 'Hardware address of the component' })
	@IsOptional()
	@IsString()
	hardwareAddress?: string;

	@ApiPropertyOptional()
	@IsOptional()
	createdAt?: Date;
}
