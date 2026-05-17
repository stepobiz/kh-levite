import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Missing DATABASE_URL');
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main() {
  console.log('Seeding system data...');

  // 1. Cfg Sections
  const cfgSections: { code: string; name: string }[] = [
    { code: 'sync',        name: 'SyncModule' },
    { code: 'autoengine',  name: 'AutoEngineModule' },
    { code: 'iot',         name: 'IotModule' },
    { code: 'sistema',     name: 'Sistema' },
  ];
  for (const s of cfgSections) {
    await prisma.cfgSection.upsert({
      where:  { code: s.code },
      update: { name: s.name },
      create: s,
    });
  }

  // 2. Cfg Configurations ()
  // On update: only metadata (name, description, sectionId) — val_* preserved as set by the user.
  const cfgConfigurations: {
    code: string;
    name: string;
    description?: string;
    sectionCode?: string;
    dataType: 'integer' | 'float' | 'boolean' | 'text' | 'select';
    options?: string;
    valInt?: number;
    valFloat?: number;
    valBool?: boolean;
    valText?: string;
  }[] = [
    {
      code: 'allow_node_type_edit',
      name: 'Permetti la modifica del node type',
      description: 'Se true, permette la modifica e l\'eliminazione dei node type dalla UI. Se false o assente, i pulsanti di modifica sono disabilitati. Default: false',
      dataType: 'boolean',
      valBool: true,
    },
    {
      code: 'infra.process_log_retention_hours',
      name: 'Retention log processi (ore)',
      description: 'Numero di ore per cui conservare i log di esecuzione di tutti i processi (Logic Engine, Sync Engine). I log più vecchi vengono eliminati automaticamente ogni ora. Default: 24',
      dataType: 'integer',
      valInt: 24,
    },
    {
      code: 'sync.enabled',
      name: 'Sync Engine abilitato',
      description: 'Se false il Sync Engine non avvia il loop. Nessuna sincronizzazione tra AutoEngine e IoT finché disabilitato. Default: true',
      sectionCode: 'sync',
      dataType: 'boolean',
      valBool: true,
    },
    {
      code: 'sync.cycle_min_interval_ms',
      name: 'Intervallo minimo ciclo Sync Engine',
      description: 'Intervallo minimo in millisecondi tra la fine di un ciclo del Sync Engine e l\'inizio del successivo. Default: 2000',
      sectionCode: 'sync',
      dataType: 'integer',
      valInt: 2000,
    },
    {
      code: 'sync.cycle_cooldown_ms',
      name: 'Cooldown post-ciclo Sync Engine',
      description: 'Pausa fissa in millisecondi aggiuntiva dopo ogni ciclo del Sync Engine. Default: 0',
      sectionCode: 'sync',
      dataType: 'integer',
      valInt: 0,
    },
    {
      code: 'autoengine.enabled',
      name: 'Logic Engine abilitato',
      description: 'Se false il Logic Engine non avvia il loop. Utile per manutenzione o debug. Il processo si ferma al prossimo ciclo se già in esecuzione. Default: true',
      sectionCode: 'autoengine',
      dataType: 'boolean',
      valBool: true,
    },
    {
      code: 'autoengine.cycle_min_interval_ms',
      name: 'Tempo minimo di intervallo tra un\'avvio ed un\'altro',
      description: 'Intervallo minimo tra la fine di un ciclo e l\'inizio del successivo. Se il ciclo dura più di questo valore il processo riparte immediatamente.',
      sectionCode: 'autoengine',
      dataType: 'integer',
      valInt: 1000,
    },
    {
      code: 'autoengine.cycle_cooldown_ms',
      name: 'Distanza tra fine di un processo ed inizio di un\'altro',
      description: 'Pausa fissa aggiuntiva dopo ogni ciclo, indipendente dalla durata. Si somma all\'intervallo minimo. Utile per ridurre il carico in ambienti con molti nodi.',
      sectionCode: 'autoengine',
      dataType: 'integer',
      valInt: 0,
    },
    {
      code: 'iot.enabled',
      name: 'Telemetry Processor abilitato',
      description: 'Se false il Telemetry Processor non avvia il loop. Nessuna lettura/scrittura hardware finché disabilitato. Default: true',
      sectionCode: 'iot',
      dataType: 'boolean',
      valBool: true,
    },
    {
      code: 'iot.cycle_min_interval_ms',
      name: 'Intervallo minimo ciclo IoT',
      description: 'Intervallo minimo in millisecondi tra la fine di un ciclo IoT e l\'inizio del successivo. Default: 20000',
      sectionCode: 'iot',
      dataType: 'integer',
      valInt: 20000,
    },
    {
      code: 'iot.cycle_cooldown_ms',
      name: 'Cooldown post-ciclo IoT',
      description: 'Pausa fissa in millisecondi aggiuntiva dopo ogni ciclo IoT. Default: 0',
      sectionCode: 'iot',
      dataType: 'integer',
      valInt: 0,
    },
    {
      code: 'sistema.stagione',
      name: 'Stagione impianto',
      description: 'Determina il comportamento del termostato. winter = riscaldamento, summer = raffrescamento.',
      sectionCode: 'sistema',
      dataType: 'select',
      options: JSON.stringify([
        { value: 'winter', label: 'Inverno' },
        { value: 'summer', label: 'Estate' },
        { value: 'off',    label: 'Spento'  },
      ]),
      valText: 'off',
    },
  ];
  for (const c of cfgConfigurations) {
    const sectionId = c.sectionCode
      ? (await prisma.cfgSection.findUnique({ where: { code: c.sectionCode } }))?.id ?? null
      : null;
    await prisma.cfgConfiguration.upsert({
      where:  { code: c.code },
      update: { name: c.name, description: c.description ?? null, sectionId, options: c.options ?? null },
      create: {
        code:        c.code,
        name:        c.name,
        description: c.description ?? null,
        sectionId,
        dataType:    c.dataType,
        options:     c.options    ?? null,
        valInt:      c.valInt     ?? null,
        valFloat:    c.valFloat   ?? null,
        valBool:     c.valBool    ?? null,
        valText:     c.valText    ?? null,
      },
    });
  }

  // 3. Auen Attribute Types ()
  const attributeTypes: { code: string; description?: string; dataType: string; options?: string }[] = [
    { code: 'delay_from_child',      description: 'Ritarda l\'avvio del padre almeno dopo N secondi che il figlio è aperto (in secondi)', dataType: 'number' },
    { code: 'source_node_id',        description: 'Attributo per nodi di tipo proxy. Indica il nodo da cui copiare i valori.',            dataType: 'auen_node' },
    { code: 'id_auditorium_of_mbs',  description: 'Id dell\'auditorium da interrogare su MBS',                                            dataType: 'number' },
    { code: 'hysteresis',            description: 'Isteresi del termostato in gradi. Default: 0.5',                                       dataType: 'number' },
    { code: 'setpoint_url',          description: 'URL da cui recuperare il valore setpoint (node_manual_value_by_url)',                  dataType: 'text' },
    {
      code: 'thermal_trigger',
      description: 'Filtra il contributo di un child thermal. Il parent si attiva solo se child.actual_value corrisponde a questo valore.',
      dataType: 'select',
      options: JSON.stringify([
        { value: 'heat', label: 'Heat' },
        { value: 'cool', label: 'Cool' },
        { value: 'off',  label: 'Off'  },
      ]),
    },
  ];
  for (const at of attributeTypes) {
    await prisma.auenAttributeType.upsert({
      where:  { code: at.code },
      update: { description: at.description ?? null, dataType: at.dataType, options: at.options ?? null },
      create: { code: at.code, description: at.description ?? null, dataType: at.dataType, options: at.options ?? null },
    });
  }

  // 4. Auen Node Types () + associazioni attributi
  const nodeTypes: {
    category: string;
    valueType: string;
    name: string;
    iconSlug?: string;
    attributes?: { code: string; isRequired: boolean }[];
  }[] = [
    { category: 'in_sensor',                name: 'Termometro',              iconSlug: 'thermometer', valueType: 'number',  attributes: [] },
    { category: 'in_sensor',                name: 'Sensore booleano',                                 valueType: 'boolean', attributes: [] },
    { category: 'node_manual_target',       name: 'Valore manuale bool',                              valueType: 'boolean', attributes: [] },
    { category: 'node_manual_target',       name: 'Valore manuale number',                            valueType: 'number',  attributes: [] },
    { category: 'node_manual_value_by_url', name: 'Valore da URL (number)',                           valueType: 'number',  attributes: [{ code: 'setpoint_url', isRequired: true }] },
    { category: 'proxy_mirror',             name: 'Relè copiante',                                    valueType: 'boolean', attributes: [{ code: 'source_node_id',   isRequired: true }, { code: 'delay_from_child', isRequired: false }] },
    { category: 'proxy_inverter',           name: 'Inverso',                                          valueType: 'boolean', attributes: [{ code: 'source_node_id',   isRequired: true }, { code: 'delay_from_child', isRequired: false }] },
    { category: 'out_logic_or',             name: 'Relè comandato da OR',                             valueType: 'boolean', attributes: [{ code: 'delay_from_child', isRequired: false }, { code: 'thermal_trigger', isRequired: false }] },
    { category: 'out_logic_and',            name: 'Relè comandato da AND',                            valueType: 'boolean', attributes: [{ code: 'delay_from_child', isRequired: false }, { code: 'thermal_trigger', isRequired: false }] },
    { category: 'out_thermostat',           name: 'Termostato',                                       valueType: 'thermal', attributes: [{ code: 'hysteresis',        isRequired: false }] },
    { category: 'fake',                     name: 'Raggruppatore',                                    valueType: 'boolean', attributes: [] },
  ];
  for (const nt of nodeTypes) {
    const nodeType = await prisma.auenNodeType.upsert({
      where:  { category_valueType: { category: nt.category as any, valueType: nt.valueType } },
      update: { name: nt.name, iconSlug: nt.iconSlug ?? null, },
      create: { name: nt.name, iconSlug: nt.iconSlug ?? null, category: nt.category as any, valueType: nt.valueType, },
    });
    for (const attr of nt.attributes ?? []) {
      const atEntity = await prisma.auenAttributeType.findUnique({ where: { code: attr.code } });
      if (!atEntity) continue;
      await prisma.auenNodeTypeAttribute.upsert({
        where:  { nodeTypeId_attributeId: { nodeTypeId: nodeType.id, attributeId: atEntity.id } },
        update: { isRequired: attr.isRequired },
        create: { nodeTypeId: nodeType.id, attributeId: atEntity.id, isRequired: attr.isRequired },
      });
    }
  }

  console.log('Seed completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
