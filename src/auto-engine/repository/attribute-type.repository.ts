import { Injectable } from '@nestjs/common';
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

  create(data: { code: string; description?: string | null; dataType: string }) {
    return this.prisma.auenAttributeType.create({ data: data as any });
  }

  update(id: number, data: Record<string, unknown>) {
    return this.prisma.auenAttributeType.update({ where: { id }, data: data as any });
  }

  delete(id: number) {
    return this.prisma.auenAttributeType.delete({ where: { id } });
  }
}
