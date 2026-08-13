import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeviceComponentBusiness } from '../business/entity/device-component.business';
import { TelemetryLogBusiness } from '../business/entity/telemetry-log.business';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { getDeviceParam } from '../business/protocol-driver/iot-protocol-driver';

interface MqttServerConfig {
  name: string;
  host: string;
  port: number;
  mainTopic?: string;
  username?: string;
  password?: string;
}

interface TopicTarget {
  componentId: number;
  field?: string;
}

const RECHECK_INTERVAL_MS = 30000;
const DRIVER = 'shelly-mqtt';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A differenza di TelemetryCronService (pull), questo processo è push-driven:
 * i device MQTT (es. Shelly H&T Gen3) pubblicano da soli quando si svegliano,
 * KH Levite resta sottoscritto e registra la telemetria quando arriva.
 *
 * Gerarchia dei topic, a 3 livelli, tutti opzionali tranne il subtopic:
 *   {server.mainTopic}/{device.mainTopic}/{subtopic componente}
 *
 * - server.mainTopic: config globale iot.mqtt.servers[].mainTopic
 * - device.mainTopic: deviceParams del driver shelly-mqtt (insieme a "server",
 *   il nome del server in iot.mqtt.servers a cui il device è collegato)
 * - subtopic componente: hardwareAddress, "<subtopic>" oppure "<subtopic>|<campo>"
 *   se il payload è un oggetto JSON da cui estrarre un campo
 *   (es. "status/temperature:0|tC")
 */
@Injectable()
export class MqttIngestionProcess implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttIngestionProcess.name);
  private clients = new Map<string, mqtt.MqttClient>();
  private topicMapByServer = new Map<string, Map<string, TopicTarget[]>>();
  private currentEnabled = false;
  private currentServersJson = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly componentBusiness: DeviceComponentBusiness,
    private readonly telemetryBusiness: TelemetryLogBusiness,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.loop().catch(err => this.logger.error('MqttIngestionProcess loop crashed', err));
  }

  onModuleDestroy() {
    this.disconnectAll();
  }

  private async loop() {
    while (true) {
      try {
        await this.reconcile();
      } catch (err: any) {
        this.logger.error(`MQTT reconcile error: ${err?.message ?? err}`);
      }
      await sleep(RECHECK_INTERVAL_MS);
    }
  }

  private async reconcile() {
    const enabled = (await this.getCfgBool('iot.mqtt.enabled')) ?? false;
    const serversJson = (await this.getCfgText('iot.mqtt.servers')) ?? '[]';
    const servers = this.parseServers(serversJson);

    await this.refreshTopicMap(servers);

    if (!enabled) {
      if (this.currentEnabled) this.disconnectAll();
      this.currentEnabled = false;
      return;
    }

    if (!this.currentEnabled || serversJson !== this.currentServersJson) {
      this.disconnectAll();
      for (const server of servers) this.connectOne(server);
      this.currentEnabled = true;
      this.currentServersJson = serversJson;
    }
  }

  private parseServers(serversJson: string): MqttServerConfig[] {
    try {
      return JSON.parse(serversJson);
    } catch {
      this.logger.error('iot.mqtt.servers non è JSON valido');
      return [];
    }
  }

  private connectOne(server: MqttServerConfig) {
    const url = `mqtt://${server.host}:${server.port}`;
    const client = mqtt.connect(url, {
      username: server.username || undefined,
      password: server.password || undefined,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      this.logger.log(`Connesso al broker MQTT ${url} (${server.name})`);
      const topic = server.mainTopic ? `${server.mainTopic}/#` : '#';
      client.subscribe(topic, err => {
        if (err) this.logger.error(`Subscribe fallita per ${topic}: ${err.message}`);
      });
    });
    client.on('reconnect', () => this.logger.warn(`Riconnessione a ${url}...`));
    client.on('error', (err: any) => this.logger.error(`Errore client MQTT (${url}): ${err?.message ?? err}`));
    client.on('message', (topic, payload) => {
      this.handleMessage(server.name, topic, payload).catch((err: any) =>
        this.logger.error(`Errore gestione messaggio ${topic}: ${err?.message ?? err}`),
      );
    });

    this.clients.set(server.name, client);
  }

  private disconnectAll() {
    this.clients.forEach(c => c.end(true));
    this.clients.clear();
  }

  private async handleMessage(serverName: string, topic: string, payload: Buffer) {
    const targets = this.topicMapByServer.get(serverName)?.get(topic);
    if (!targets || targets.length === 0) return;

    const raw = payload.toString();
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    for (const { componentId, field } of targets) {
      let value: string;
      if (field && parsed && typeof parsed === 'object') {
        const fieldValue = parsed[field];
        if (fieldValue === undefined) continue;
        value = String(fieldValue);
      } else {
        value = raw;
      }
      await this.recordValue(componentId, value);
    }
  }

  private async recordValue(componentId: number, value: string) {
    const lastLog = await this.telemetryBusiness.findLatestByComponentId(componentId);
    if (lastLog && lastLog.value === value) return;

    const log = await this.telemetryBusiness.create({ componentId, value, direction: 'READ' });
    this.realtimeGateway.emitTelemetryUpdate({
      id: log.id!,
      componentId,
      value,
      direction: 'READ',
      createdAt: log.createdAt!,
    });
  }

  private async refreshTopicMap(servers: MqttServerConfig[]) {
    const serversByName = new Map(servers.map(s => [s.name, s]));
    const components = await this.componentBusiness.findAllForProcessor();
    const map = new Map<string, Map<string, TopicTarget[]>>();

    for (const c of components) {
      if (c.device?.driver !== DRIVER || !c.hardwareAddress || c.id == null) continue;

      const serverName = getDeviceParam(c.device, 'server');
      const server = serverName ? serversByName.get(serverName) : undefined;
      if (!server) {
        this.logger.warn(`Componente ${c.id}: server MQTT "${serverName}" non trovato in iot.mqtt.servers`);
        continue;
      }
      const deviceMainTopic = getDeviceParam(c.device, 'mainTopic');

      const sep = c.hardwareAddress.indexOf('|');
      const subtopic = sep === -1 ? c.hardwareAddress : c.hardwareAddress.slice(0, sep);
      const field = sep === -1 ? undefined : c.hardwareAddress.slice(sep + 1);
      const topic = [server.mainTopic, deviceMainTopic, subtopic].filter(Boolean).join('/');

      if (!map.has(server.name)) map.set(server.name, new Map());
      const serverMap = map.get(server.name)!;
      if (!serverMap.has(topic)) serverMap.set(topic, []);
      serverMap.get(topic)!.push({ componentId: c.id, field });
    }

    this.topicMapByServer = map;
  }

  private async getCfgBool(code: string): Promise<boolean | null> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({ where: { code } });
      return cfg?.valBool ?? null;
    } catch {
      return null;
    }
  }

  private async getCfgText(code: string): Promise<string | null> {
    try {
      const cfg = await this.prisma.cfgConfiguration.findUnique({ where: { code } });
      return cfg?.valText ?? null;
    } catch {
      return null;
    }
  }
}
