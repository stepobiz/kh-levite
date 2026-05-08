import { IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../dto/device-component.dto';
import axios from 'axios';

interface SonoffDiyResponse {
  seq: number;
  error: number;
  data?: {
    switch?: string;
    [key: string]: any;
  };
}

export class SonoffDiyDriver implements IotProtocolDriver {
  readonly protocol = 'sonoff-diy';
  private readonly port = 8081;

  private baseUrl(component: DeviceComponentDto): string {
    if (!component.device) throw new Error('Device not loaded in component');
    return `http://${component.device.ipAddress}:${this.port}/zeroconf`;
  }

  async read(component: DeviceComponentDto): Promise<string> {
    const res = await axios.post<SonoffDiyResponse>(
      `${this.baseUrl(component)}/info`,
      { deviceid: '', data: {} },
    );
    if (res.data.error !== 0) throw new Error(`Sonoff DIY error code: ${res.data.error}`);
    return res.data.data?.switch === 'on' ? '1' : '0';
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    const on = value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'on';
    const res = await axios.post<SonoffDiyResponse>(
      `${this.baseUrl(component)}/switch`,
      { deviceid: '', data: { switch: on ? 'on' : 'off' } },
    );
    if (res.data.error !== 0) throw new Error(`Sonoff DIY error code: ${res.data.error}`);
  }
}
