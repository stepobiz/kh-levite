import { DeviceDto } from 'src/iot/dto/device.dto';
import type { Prisma } from '@prisma/client';

export class DeviceMapper {
  static toCreateInput(dto: DeviceDto): Prisma.IotDeviceCreateInput {
    const data: Prisma.IotDeviceCreateInput = {};

    if (dto.deviceName !== undefined) data.deviceName = dto.deviceName;
    if (dto.driver !== undefined) data.driver = dto.driver;
    if (dto.params !== undefined) {
      data.params = { create: dto.params.map(p => ({ key: p.key, value: p.value })) };
    }

    return data;
  }

  static toUpdateInput(dto: Partial<DeviceDto>): Prisma.IotDeviceUpdateInput {
    const data: Prisma.IotDeviceUpdateInput = {};
    if (dto.deviceName !== undefined) data.deviceName = dto.deviceName;
    if (dto.driver !== undefined) data.driver = dto.driver;
    if (dto.params !== undefined) {
      data.params = { deleteMany: {}, create: dto.params.map(p => ({ key: p.key, value: p.value })) };
    }
    return data;
  }

  static toDto(entity: any): DeviceDto {
    return {
      id: entity.id,
      deviceName: entity.deviceName,
      driver: entity.driver,
      params: entity.params?.map((p: any) => ({ key: p.key, value: p.value })) ?? [],
    };
  }
}
