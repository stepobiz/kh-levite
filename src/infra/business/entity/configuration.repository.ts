import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CfgValueType } from '@prisma/client';

const CFG_INCLUDE = { section: true } as const;

@Injectable()
export class ConfigurationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(sectionId?: number) {
    return this.prisma.cfgConfiguration.findMany({
      where: sectionId != null ? { sectionId } : undefined,
      include: CFG_INCLUDE,
      orderBy: { code: 'asc' },
    });
  }

  findByCode(code: string) {
    return this.prisma.cfgConfiguration.findUnique({ where: { code }, include: CFG_INCLUDE });
  }

  create(data: {
    code: string;
    name: string;
    description?: string | null;
    sectionId?: number | null;
    dataType: CfgValueType;
    options?: string | null;
    valInt?: number | null;
    valFloat?: number | null;
    valBool?: boolean | null;
    valText?: string | null;
  }) {
    return this.prisma.cfgConfiguration.create({ data, include: CFG_INCLUDE });
  }

  update(
    code: string,
    data: {
      name?: string;
      description?: string | null;
      sectionId?: number | null;
      dataType?: CfgValueType;
      options?: string | null;
      valInt?: number | null;
      valFloat?: number | null;
      valBool?: boolean | null;
      valText?: string | null;
    },
  ) {
    const prismaData: Record<string, unknown> = {};
    if (data.name !== undefined) prismaData.name = data.name;
    if (data.description !== undefined) prismaData.description = data.description;
    if (data.sectionId !== undefined) prismaData.sectionId = data.sectionId ?? null;
    if (data.dataType !== undefined) prismaData.dataType = data.dataType;
    if (data.options !== undefined) prismaData.options = data.options ?? null;
    if ('valInt' in data) prismaData.valInt = data.valInt ?? null;
    if ('valFloat' in data) prismaData.valFloat = data.valFloat ?? null;
    if ('valBool' in data) prismaData.valBool = data.valBool ?? null;
    if ('valText' in data) prismaData.valText = data.valText ?? null;
    return this.prisma.cfgConfiguration.update({ where: { code }, data: prismaData as any, include: CFG_INCLUDE });
  }

  delete(code: string) {
    return this.prisma.cfgConfiguration.delete({ where: { code } });
  }
}
