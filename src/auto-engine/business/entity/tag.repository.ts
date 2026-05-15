import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auenTag.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: number) {
    return this.prisma.auenTag.findUnique({ where: { id } });
  }

  create(data: Prisma.AuenTagCreateInput) {
    return this.prisma.auenTag.create({ data });
  }

  update(id: number, data: Prisma.AuenTagUpdateInput) {
    return this.prisma.auenTag.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.auenTag.delete({ where: { id } });
  }
}
