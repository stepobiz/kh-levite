import { Injectable } from '@nestjs/common';
import { Prisma, IotDeviceComponent } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeviceComponentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.IotDeviceComponentCreateInput) {
    return this.prisma.iotDeviceComponent.create({ data });
  }

  findAll() {
    return this.prisma.iotDeviceComponent.findMany({
      include: { device: true },
    });
  }

  findAllByDevice(deviceId: number) {
    return this.prisma.iotDeviceComponent.findMany({
      where: { deviceId },
      include: { device: true },
    });
  }

  findById(id: number) {
    return this.prisma.iotDeviceComponent.findUnique({
      where: { id },
      include: { device: true },
    });
  }

  update(id: number, data: Prisma.IotDeviceComponentUpdateInput) {
    return this.prisma.iotDeviceComponent.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.iotDeviceComponent.delete({ where: { id } });
  }
}