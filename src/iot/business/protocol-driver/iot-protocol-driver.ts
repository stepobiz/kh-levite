import { DeviceComponentDto } from '../../dto/device-component.dto';
import { DeviceDto } from '../../dto/device.dto';

export type DeviceParamValueType = 'string' | 'ip' | 'mac' | 'number';

export interface DeviceParamDef {
  key: string;
  label: string;
  required: boolean;
  type: DeviceParamValueType;
}

export interface IotProtocolDriver {
  readonly protocol: string;

  /**
   * false per i driver push-based (es. shelly-mqtt), i cui componenti sono
   * alimentati da un processo di ingestion dedicato invece che da TelemetryCronService.
   * Default true se omesso.
   */
  readonly pollable?: boolean;

  /** Parametri richiesti a livello device (es. ipAddress) — guidano il form di creazione device. */
  readonly deviceParams: DeviceParamDef[];

  read(component: DeviceComponentDto): Promise<string>;

  write(
    component: DeviceComponentDto,
    value: string,
  ): Promise<void>;
}

export function getDeviceParam(device: DeviceDto | undefined, key: string): string | undefined {
  return device?.params?.find(p => p.key === key)?.value;
}
