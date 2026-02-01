import { IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../dto/device-component.dto';

export class ShellyMqttDriver implements IotProtocolDriver {
  readonly protocol = 'shelly-mqtt';

  async read(component: DeviceComponentDto): Promise<string> {
    if (!component.device) throw new Error('Device not loaded in component');
    throw new Error('Shelly MQTT read not implemented');
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    if (!component.device) throw new Error('Device not loaded in component');
    throw new Error('Shelly MQTT write not implemented');
  }
}