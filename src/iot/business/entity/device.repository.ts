import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const DEVICE_INCLUDE = { params: true } as const;

@Injectable()
export class DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.IotDeviceCreateInput) {
    return this.prisma.iotDevice.create({ data, include: DEVICE_INCLUDE });
  }

  findAll() {
    return this.prisma.iotDevice.findMany({ include: DEVICE_INCLUDE });
  }

  findById(id: number) {
    return this.prisma.iotDevice.findUnique({ where: { id }, include: DEVICE_INCLUDE });
  }

  update(id: number, data: Prisma.IotDeviceUpdateInput) {
    return this.prisma.iotDevice.update({ where: { id }, data, include: DEVICE_INCLUDE });
  }

  delete(id: number) {
    return this.prisma.iotDevice.delete({ where: { id } });
  }
}
