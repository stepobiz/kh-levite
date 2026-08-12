import { IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../../dto/device-component.dto';
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

/**
 * hardwareAddress convention: "<kind>:<id>" (es. "temperature:0") oppure "<kind>:<id>:<field>"
 * per i componenti con più valori letti dalla stessa RPC (es. "thermostat:0:current", "thermostat:0:target").
 * Senza prefisso, per retrocompatibilità con i device già configurati, si assume "switch:<hardwareAddress>".
 */
function parseAddress(hardwareAddress: string | null | undefined): { kind: string; id: number; field?: string } {
  const addr = hardwareAddress ?? '';
  const parts = addr.split(':');
  if (parts.length >= 3) {
    return { kind: parts[0], id: Number(parts[1]), field: parts[2] };
  }
  if (parts.length === 2) {
    return { kind: parts[0], id: Number(parts[1]) };
  }
  return { kind: 'switch', id: Number(addr) };
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
    const { kind, id, field } = parseAddress(component.hardwareAddress);

    if (kind === 'temperature') {
      const result = await this.rpc<{ tC: number | null }>(component, 'Temperature.GetStatus', { id });
      return result?.tC != null ? String(result.tC) : '';
    }

    if (kind === 'thermostat') {
      const result = await this.rpc<{ current_C: number | null; target_C: number | null }>(
        component,
        'Thermostat.GetStatus',
        { id },
      );
      const value = field === 'target' ? result?.target_C : result?.current_C;
      return value != null ? String(value) : '';
    }

    const result = await this.rpc<{ output: boolean }>(component, 'Switch.GetStatus', { id });
    const raw = result?.output?.toString() ?? '';
    return raw === 'true' || raw === '1' || raw === 'on' ? '1' : '0';
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    const { kind, id, field } = parseAddress(component.hardwareAddress);

    if (kind === 'temperature') {
      throw new Error('Temperature component is read-only');
    }

    if (kind === 'thermostat') {
      if (field !== 'target') {
        throw new Error('Only thermostat target_C is writable');
      }
      await this.rpc(component, 'Thermostat.SetConfig', { id, config: { target_C: Number(value) } });
      return;
    }

    const on = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on';
    await this.rpc(component, 'Switch.Set', { id, on });
  }
}