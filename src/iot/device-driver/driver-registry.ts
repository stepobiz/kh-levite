import { IotProtocolDriver } from './iot-protocol-driver';
import { ShellyHttpDriver } from './shelly-http.driver';
import { ShellyMqttDriver } from './shelly-mqtt.driver';
import { SonoffDiyDriver } from './sonoff-diy.driver';

const shellyHttp = new ShellyHttpDriver();
const shellyMqtt = new ShellyMqttDriver();
const sonoffDiy = new SonoffDiyDriver();

export const driverRegistry: Record<string, IotProtocolDriver> = {
  [shellyHttp.protocol]: shellyHttp,
  [shellyMqtt.protocol]: shellyMqtt,
  [sonoffDiy.protocol]: sonoffDiy,
};