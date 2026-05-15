import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttributeTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auenAttributeType.findMany({ orderBy: { id: 'asc' } });
  }

  findById(id: number) {
    return this.prisma.auenAttributeType.findUnique({ where: { id } });
  }

  create(data: Prisma.AuenAttributeTypeCreateInput) {
    return this.prisma.auenAttributeType.create({ data });
  }

  update(id: number, data: Prisma.AuenAttributeTypeUpdateInput) {
    return this.prisma.auenAttributeType.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.auenAttributeType.delete({ where: { id } });
  }
}
