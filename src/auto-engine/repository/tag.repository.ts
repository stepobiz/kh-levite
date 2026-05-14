import { Injectable } from '@nestjs/common';
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

  create(name: string) {
    return this.prisma.auenTag.create({ data: { name } });
  }

  update(id: number, name: string) {
    return this.prisma.auenTag.update({ where: { id }, data: { name } });
  }

  delete(id: number) {
    return this.prisma.auenTag.delete({ where: { id } });
  }
}
