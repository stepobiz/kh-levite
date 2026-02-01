import { DeviceDto } from 'src/iot/dto/device.dto';
import type { Prisma } from '@prisma/client';

export class DeviceMapper {
  static toCreateInput(dto: DeviceDto): Prisma.IotDeviceCreateInput {
    const data: Prisma.IotDeviceCreateInput = {
      ipAddress: dto.ipAddress,
    };

    if (dto.deviceName !== undefined) data.deviceName = dto.deviceName;
    if (dto.macAddress !== undefined) data.macAddress = dto.macAddress;
    if (dto.driver !== undefined) data.driver = dto.driver;

    if (dto.components && dto.components.length > 0) {
      const newComponents = dto.components
        .filter(c => c.id === undefined)
        .map(c => ({
          componentName: c.componentName,
          hardwareIndex: c.hardwareIndex,
          hardwareAddress: c.hardwareAddress,
        }));

      if (newComponents.length > 0) {
        data.components = { create: newComponents };
      }
    }

    return data;
  }

  static toUpdateInput(dto: Partial<DeviceDto>): Prisma.IotDeviceUpdateInput {
    const data: Prisma.IotDeviceUpdateInput = {};
    if (dto.deviceName !== undefined) data.deviceName = dto.deviceName;
    if (dto.macAddress !== undefined) data.macAddress = dto.macAddress;
    if (dto.ipAddress !== undefined) data.ipAddress = dto.ipAddress;
    if (dto.driver !== undefined) data.driver = dto.driver;
    return data;
  }

  static toDto(entity: any): DeviceDto {
    return {
      id: entity.id,
      deviceName: entity.deviceName,
      macAddress: entity.macAddress,
      ipAddress: entity.ipAddress,
      driver: entity.driver,
    };
  }
}