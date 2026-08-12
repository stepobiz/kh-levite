import { Injectable } from '@nestjs/common';
import { driverRegistry } from './protocol-driver/driver-registry';
import { DeviceParamDef } from './protocol-driver/iot-protocol-driver';

export interface DriverInfoDto {
  protocol: string;
  pollable: boolean;
  deviceParams: DeviceParamDef[];
}

@Injectable()
export class DriverBusiness {
  findAll(): DriverInfoDto[] {
    return Object.values(driverRegistry).map(driver => ({
      protocol: driver.protocol,
      pollable: driver.pollable !== false,
      deviceParams: driver.deviceParams,
    }));
  }
}
