import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cfgSection.findMany({
      include: { configurations: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.cfgSection.findUnique({ where: { id }, include: { configurations: true } });
  }

  create(data: { code: string; name: string }) {
    return this.prisma.cfgSection.create({ data, include: { configurations: true } });
  }

  update(id: number, data: { code?: string; name?: string }) {
    return this.prisma.cfgSection.update({ where: { id }, data, include: { configurations: true } });
  }

  delete(id: number) {
    return this.prisma.cfgSection.delete({ where: { id } });
  }
}
