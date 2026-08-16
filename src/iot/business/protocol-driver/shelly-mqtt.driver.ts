import { DeviceParamDef, IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../../dto/device-component.dto';

export class ShellyMqttDriver implements IotProtocolDriver {
  readonly protocol = 'shelly-mqtt';
  readonly pollable = false;
  readonly deviceParams: DeviceParamDef[] = [
    { key: 'server', label: 'Server MQTT', required: true, type: 'mqtt-server' },
    { key: 'mainTopic', label: 'Topic principale device', required: true, type: 'string' },
  ];

  async read(component: DeviceComponentDto): Promise<string> {
    if (!component.device) throw new Error('Device not loaded in component');
    throw new Error('Shelly MQTT is push-based — la telemetria arriva da MqttIngestionProcess, non da polling');
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    if (!component.device) throw new Error('Device not loaded in component');
    throw new Error('Shelly MQTT write not implemented');
  }
}