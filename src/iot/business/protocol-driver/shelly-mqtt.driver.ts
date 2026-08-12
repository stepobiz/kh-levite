import { DeviceParamDef, IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../../dto/device-component.dto';

export class ShellyMqttDriver implements IotProtocolDriver {
  readonly protocol = 'shelly-mqtt';
  readonly pollable = false;
  // Nessun parametro a livello device: topic e broker sono in hardwareAddress del componente + config globale iot.mqtt.servers.
  readonly deviceParams: DeviceParamDef[] = [];

  async read(component: DeviceComponentDto): Promise<string> {
    if (!component.device) throw new Error('Device not loaded in component');
    throw new Error('Shelly MQTT is push-based — la telemetria arriva da MqttIngestionProcess, non da polling');
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    if (!component.device) throw new Error('Device not loaded in component');
    throw new Error('Shelly MQTT write not implemented');
  }
}