import { DeviceComponentDto } from '../dto/device-component.dto';

export interface IotProtocolDriver {
  readonly protocol: string;

  read(component: DeviceComponentDto): Promise<string>;

  write(
    component: DeviceComponentDto,
    value: string,
  ): Promise<void>;
}