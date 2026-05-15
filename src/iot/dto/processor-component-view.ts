import { DeviceComponentDto } from 'src/iot/dto/device-component.dto';

export interface ProcessorComponentView extends DeviceComponentDto {
  nextValue: string | null;
  nextValueUpdatedAt: Date | null;
}
