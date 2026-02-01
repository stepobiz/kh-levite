import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';
import { DeviceMapper } from 'src/iot/mapper/device.mapper';
import type { Prisma } from '@prisma/client';

export class DeviceComponentMapper {
  static toCreateInput(dto: DeviceComponentDto): Prisma.IotDeviceComponentCreateInput {
    const data: Prisma.IotDeviceComponentCreateInput = {
      device: { connect: { id: dto.deviceId } },
      hardwareIndex: dto.hardwareIndex,
    };

    if (dto.componentName !== undefined) data.componentName = dto.componentName;
    if (dto.hardwareAddress !== undefined) data.hardwareAddress = dto.hardwareAddress;

    return data;
  }

  static toUpdateInput(dto: Partial<DeviceComponentDto>): Prisma.IotDeviceComponentUpdateInput {
    const data: Prisma.IotDeviceComponentUpdateInput = {};
    if (dto.componentName !== undefined) data.componentName = dto.componentName;
    if (dto.hardwareIndex !== undefined) data.hardwareIndex = dto.hardwareIndex;
    if (dto.hardwareAddress !== undefined) data.hardwareAddress = dto.hardwareAddress;
    return data;
  }

  static toDto(entity: any): DeviceComponentDto {
    return {
      id: entity.id,
      deviceId: entity.deviceId,
      componentName: entity.componentName,
      hardwareIndex: entity.hardwareIndex,
      hardwareAddress: entity.hardwareAddress,
      device: entity.device ? DeviceMapper.toDto(entity.device) : undefined,
    };
  }
}