import { IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../dto/device-component.dto';
import axios from 'axios';

interface JsonRpcRequest {
  id: number;
  method: string;
  params?: Record<string, any>;
}

interface JsonRpcResponse<T = any> {
  id: number;
  src: string;
  result?: T;
  error?: { code: number; message: string };
}

export class ShellyHttpDriver implements IotProtocolDriver {
  readonly protocol = 'shelly-http';

  private async rpc<T = any>(component: DeviceComponentDto, method: string, params?: any): Promise<T> {
    if (!component.device) throw new Error('Device not loaded in component');

    const url = `http://${component.device.ipAddress}/rpc`;
    const body: JsonRpcRequest = {
      id: Date.now(),
      method,
      params,
    };

    const response = await axios.post<JsonRpcResponse<T>>(url, body, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data.error) {
      throw new Error(`Shelly RPC error: ${JSON.stringify(response.data.error)}`);
    }
    return response.data.result as T;
  }

  async read(component: DeviceComponentDto): Promise<string> {
    const result = await this.rpc<{ output: boolean }>(component, 'Switch.GetStatus', {
      id: Number(component.hardwareAddress),
    });
    return result?.output?.toString() ?? '';
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    const on = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on';
    await this.rpc(component, 'Switch.Set', {
      id: Number(component.hardwareAddress),
      on,
    });
  }
}