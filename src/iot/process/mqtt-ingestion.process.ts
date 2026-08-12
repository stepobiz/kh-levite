import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeviceComponentBusiness } from '../business/entity/device-component.business';
import { TelemetryLogBusiness } from '../business/entity/telemetry-log.business';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

interface MqttServerConfig {
  host: string;
  port: number;
  mainTopic: string;
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
 * hardwareAddress dei componenti con driver shelly-mqtt: "<topic>" oppure
 * "<topic>|<campo>" se il payload è un oggetto JSON da cui estrarre un campo
 * (es. "shellyhtg3-AABBCCDDEEFF/status/temperature:0|tC").
 */
@Injectable()
export class MqttIngestionProcess implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttIngestionProcess.name);
  private clients: mqtt.MqttClient[] = [];
  private topicMap = new Map<string, TopicTarget[]>();
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
      } catch (err) {
        this.logger.error('MQTT reconcile error', err);
      }
      await sleep(RECHECK_INTERVAL_MS);
    }
  }

  private async reconcile() {
    await this.refreshTopicMap();

    const enabled = (await this.getCfgBool('iot.mqtt.enabled')) ?? false;
    const serversJson = (await this.getCfgText('iot.mqtt.servers')) ?? '[]';

    if (!enabled) {
      if (this.currentEnabled) this.disconnectAll();
      this.currentEnabled = false;
      return;
    }

    if (!this.currentEnabled || serversJson !== this.currentServersJson) {
      this.disconnectAll();
      this.connectAll(serversJson);
      this.currentEnabled = true;
      this.currentServersJson = serversJson;
    }
  }

  private connectAll(serversJson: string) {
    let servers: MqttServerConfig[];
    try {
      servers = JSON.parse(serversJson);
    } catch {
      this.logger.error('iot.mqtt.servers non è JSON valido');
      return;
    }
    for (const server of servers) {
      this.connectOne(server);
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
      this.logger.log(`Connesso al broker MQTT ${url}`);
      const topic = server.mainTopic ? `${server.mainTopic}/#` : '#';
      client.subscribe(topic, err => {
        if (err) this.logger.error(`Subscribe fallita per ${topic}`, err);
      });
    });
    client.on('reconnect', () => this.logger.warn(`Riconnessione a ${url}...`));
    client.on('error', err => this.logger.error(`Errore client MQTT (${url})`, err));
    client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload).catch(err =>
        this.logger.error(`Errore gestione messaggio ${topic}`, err),
      );
    });

    this.clients.push(client);
  }

  private disconnectAll() {
    this.clients.forEach(c => c.end(true));
    this.clients = [];
  }

  private async handleMessage(topic: string, payload: Buffer) {
    const targets = this.topicMap.get(topic);
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

  private async refreshTopicMap() {
    const components = await this.componentBusiness.findAllForProcessor();
    const map = new Map<string, TopicTarget[]>();
    for (const c of components) {
      if (c.device?.driver !== DRIVER || !c.hardwareAddress || c.id == null) continue;
      const sep = c.hardwareAddress.indexOf('|');
      const topic = sep === -1 ? c.hardwareAddress : c.hardwareAddress.slice(0, sep);
      const field = sep === -1 ? undefined : c.hardwareAddress.slice(sep + 1);
      if (!map.has(topic)) map.set(topic, []);
      map.get(topic)!.push({ componentId: c.id, field });
    }
    this.topicMap = map;
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
