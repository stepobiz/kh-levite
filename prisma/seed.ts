import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding system data...');

  // 1. Cfg Sections
  const cfgSections: { code: string; name: string }[] = [
    // { code: 'example_section', name: 'Example Section' },
  ];
  for (const s of cfgSections) {
    await prisma.cfgSection.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: s,
    });
  }

  // 2. Cfg Configurations (isSystem: true)
  const cfgConfigurations: {
    code: string;
    name: string;
    description?: string;
    sectionCode?: string;
    dataType: 'integer' | 'float' | 'boolean' | 'text';
    valInt?: number;
    valFloat?: number;
    valBool?: boolean;
    valText?: string;
  }[] = [
    // {
    //   code: 'allow_node_type_edit',
    //   name: 'Abilita modifica node types',
    //   sectionCode: 'example_section',
    //   dataType: 'boolean',
    //   valBool: true,
    // },
  ];
  for (const c of cfgConfigurations) {
    const sectionId = c.sectionCode
      ? (await prisma.cfgSection.findUnique({ where: { code: c.sectionCode } }))?.id ?? null
      : null;
    await prisma.cfgConfiguration.upsert({
      where: { code: c.code },
      update: { valInt: c.valInt ?? null, valFloat: c.valFloat ?? null, valBool: c.valBool ?? null, valText: c.valText ?? null },
      create: {
        code: c.code,
        name: c.name,
        description: c.description ?? null,
        sectionId,
        dataType: c.dataType,
        isSystem: true,
        valInt: c.valInt ?? null,
        valFloat: c.valFloat ?? null,
        valBool: c.valBool ?? null,
        valText: c.valText ?? null,
      },
    });
  }

  // 3. Auen Attribute Types (isSystem: true)
  const attributeTypes: { code: string; description?: string; dataType: string }[] = [
    // { code: 'delay_from_child', description: 'Ritardo attivazione da figlio (secondi)', dataType: 'number' },
  ];
  for (const at of attributeTypes) {
    await prisma.auenAttributeType.upsert({
      where: { code: at.code },
      update: { description: at.description ?? null, dataType: at.dataType },
      create: { code: at.code, description: at.description ?? null, dataType: at.dataType, isSystem: true },
    });
  }

  // 4. Auen Node Types (isSystem: true) + associazioni attributi
  const nodeTypes: {
    name: string;
    iconSlug?: string;
    category: string;
    valueType: string;
    attributes?: { code: string; isRequired: boolean }[];
  }[] = [
    // {
    //   name: 'Termostato',
    //   iconSlug: 'thermostat',
    //   category: 'out_thermostat',
    //   valueType: 'boolean',
    //   attributes: [{ code: 'delay_from_child', isRequired: true }],
    // },
  ];
  for (const nt of nodeTypes) {
    let existing = await prisma.auenNodeType.findFirst({ where: { name: nt.name } });
    if (!existing) {
      existing = await prisma.auenNodeType.create({
        data: {
          name: nt.name,
          iconSlug: nt.iconSlug ?? null,
          category: nt.category as any,
          valueType: nt.valueType,
          isSystem: true,
        },
      });
    }
    for (const attr of nt.attributes ?? []) {
      const atEntity = await prisma.auenAttributeType.findUnique({ where: { code: attr.code } });
      if (!atEntity) continue;
      await prisma.auenNodeTypeAttribute.upsert({
        where: { nodeTypeId_attributeId: { nodeTypeId: existing.id, attributeId: atEntity.id } },
        update: { isRequired: attr.isRequired },
        create: { nodeTypeId: existing.id, attributeId: atEntity.id, isRequired: attr.isRequired },
      });
    }
  }

  console.log('Seed completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
