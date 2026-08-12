# Contribuire — Aggiungere un nuovo driver IoT

Ogni dispositivo IoT è supportato da un **driver**: una classe che sa come leggere lo stato attuale
del componente hardware e come inviargli un comando.

I driver sono completamente disaccoppiati dal resto del sistema: basta implementare un'interfaccia,
registrare il driver, e il ciclo di telemetria lo userà automaticamente.

---

## Interfaccia da implementare

```typescript
// src/iot/business/protocol-driver/iot-protocol-driver.ts
export interface DeviceParamDef {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'ip' | 'mac' | 'number';
}

export interface IotProtocolDriver {
  readonly protocol: string;
  readonly pollable?: boolean;
  readonly deviceParams: DeviceParamDef[];
  read(component: DeviceComponentDto): Promise<string>;
  write(component: DeviceComponentDto, value: string): Promise<void>;
}
```

| Metodo | Descrizione |
|---|---|
| `protocol` | Identificatore univoco del driver (es. `shelly-http`, `sonoff-diy`). Viene usato nel campo `driver` del device. |
| `pollable` | `false` per i driver push-based (il device chiama fuori lui, es. MQTT/webhook) — `TelemetryCronService` salta i loro componenti. Omesso o `true` = polling normale. |
| `deviceParams` | Parametri richiesti a livello device (es. `ipAddress`) — guida il form dinamico "Nuovo Device" in UI e viene esposto via `GET /api/iot/drivers`. Vuoto se il driver non ha bisogno di nulla a livello device (es. `shelly-mqtt`, dove tutto è nel `hardwareAddress` del componente + config globale). |
| `read(component)` | Legge lo stato attuale dall'hardware. Ritorna `'1'`/`'0'` per valori binari, stringa libera per analogici. Se `pollable: false`, può lanciare — non viene mai chiamato dal cron. |
| `write(component, value)` | Invia un comando all'hardware. `value` è la stringa passata dal comando. |

### Driver push-based (es. MQTT)

Se il device non è interrogabile ma pubblica lui i dati (sleepy sensor, webhook, MQTT), imposta `pollable = false` sul driver e implementa l'ingestion in un processo dedicato (vedi [`MqttIngestionProcess`](../../src/iot/process/mqtt-ingestion.process.ts) come esempio) invece che in `read()`.

---

## Dati disponibili nel componente

Il parametro `component: DeviceComponentDto` contiene tutto il necessario per comunicare con il dispositivo:

| Campo | Descrizione |
|---|---|
| `component.device.params` | Array `{key, value}[]` dei parametri device dichiarati dal driver (es. `ipAddress`) — usa `getDeviceParam(component.device, 'ipAddress')` da `iot-protocol-driver.ts` per leggerli |
| `component.device.driver` | Identificatore del driver (uguale a `protocol`) |
| `component.hardwareAddress` | Indirizzo hardware libero (es. topic MQTT, pin GPIO, ID canale) |

---

## Passi per aggiungere un driver

### 1. Crea il file del driver

```
src/iot/business/protocol-driver/{nome-protocollo}.driver.ts
```

Implementa `IotProtocolDriver`. Esempio minimo:

```typescript
import { getDeviceParam, IotProtocolDriver, DeviceParamDef } from './iot-protocol-driver';
import { DeviceComponentDto } from '../dto/device-component.dto';

export class MioDriver implements IotProtocolDriver {
  readonly protocol = 'mio-protocollo';
  readonly deviceParams: DeviceParamDef[] = [
    { key: 'ipAddress', label: 'Indirizzo IP', required: true, type: 'ip' },
  ];

  async read(component: DeviceComponentDto): Promise<string> {
    if (!component.device) throw new Error('Device not loaded');
    const ipAddress = getDeviceParam(component.device, 'ipAddress');
    // leggi dallo hardware e ritorna '1' o '0'
    return '0';
  }

  async write(component: DeviceComponentDto, value: string): Promise<void> {
    if (!component.device) throw new Error('Device not loaded');
    const on = value === '1' || value.toLowerCase() === 'on' || value.toLowerCase() === 'true';
    // invia il comando allo hardware
  }
}
```

### 2. Registra il driver

Apri `src/iot/business/protocol-driver/driver-registry.ts` e aggiungi il tuo driver:

```typescript
import { MioDriver } from './mio.driver';

const mioDriver = new MioDriver();

export const driverRegistry: Record<string, IotProtocolDriver> = {
  // ... driver esistenti ...
  [mioDriver.protocol]: mioDriver,
};
```

### 3. Configura un device nel sistema

Nel pannello di gestione, crea un device scegliendo il tuo driver dalla select — il form mostra automaticamente i campi dichiarati in `deviceParams` (via `GET /api/iot/drivers`), niente da modificare in UI per un nuovo driver.

Poi aggiungi i componenti con `hardwareAddress` secondo le specifiche del tuo dispositivo.

---

## Esempio reale — Sonoff DIY

Il driver [`sonoff-diy.driver.ts`](../../src/iot/business/protocol-driver/sonoff-diy.driver.ts) è un buon esempio:
comunica con il Sonoff Basic R2 via HTTP locale (porta 8081, API DIY nativa del firmware stock ≥ 3.3.0).

---

## Pull Request

1. Crea un branch: `git checkout -b driver/nome-dispositivo`
2. Implementa il driver seguendo i passi sopra
3. Documenta le specifiche del dispositivo supportato in un commento nella classe o in un file `docs/contributing/driver-{nome}.md`
4. Apri una Pull Request con una breve descrizione del dispositivo e del protocollo usato
