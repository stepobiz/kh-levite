import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.IotDeviceCreateInput) {
    return this.prisma.iotDevice.create({ data });
  }

  findAll() {
    return this.prisma.iotDevice.findMany();
  }

  findById(id: number) {
    return this.prisma.iotDevice.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.IotDeviceUpdateInput) {
    return this.prisma.iotDevice.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.iotDevice.delete({ where: { id } });
  }
}