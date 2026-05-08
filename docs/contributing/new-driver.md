# Contribuire — Aggiungere un nuovo driver IoT

Ogni dispositivo IoT è supportato da un **driver**: una classe che sa come leggere lo stato attuale
del componente hardware e come inviargli un comando.

I driver sono completamente disaccoppiati dal resto del sistema: basta implementare un'interfaccia,
registrare il driver, e il ciclo di telemetria lo userà automaticamente.

---

## Interfaccia da implementare

```typescript
// src/iot/device-driver/iot-protocol-driver.ts
export interface IotProtocolDriver {
  readonly protocol: string;
  read(component: DeviceComponentDto): Promise<string>;
  write(component: DeviceComponentDto, value: string): Promise<void>;
}
```

| Metodo | Descrizione |
|---|---|
| `protocol` | Identificatore univoco del driver (es. `shelly-http`, `sonoff-diy`). Viene usato nel campo `driver` del device. |
| `read(component)` | Legge lo stato attuale dall'hardware. Ritorna `'1'`/`'0'` per valori binari, stringa libera per analogici. |
| `write(component, value)` | Invia un comando all'hardware. `value` è la stringa passata dal comando. |

---

## Dati disponibili nel componente

Il parametro `component: DeviceComponentDto` contiene tutto il necessario per comunicare con il dispositivo:

| Campo | Descrizione |
|---|---|
| `component.device.ipAddress` | IP del dispositivo nella rete locale |
| `component.device.driver` | Identificatore del driver (uguale a `protocol`) |
| `component.hardwareIndex` | Indice numerico del componente sul dispositivo (es. relay 0, relay 1) |
| `component.hardwareAddress` | Indirizzo hardware libero (es. topic MQTT, pin GPIO, ID canale) |

---

## Passi per aggiungere un driver

### 1. Crea il file del driver

```
src/iot/device-driver/{nome-protocollo}.driver.ts
```

Implementa `IotProtocolDriver`. Esempio minimo:

```typescript
import { IotProtocolDriver } from './iot-protocol-driver';
import { DeviceComponentDto } from '../dto/device-component.dto';

export class MioDriver implements IotProtocolDriver {
  readonly protocol = 'mio-protocollo';

  async read(component: DeviceComponentDto): Promise<string> {
    if (!component.device) throw new Error('Device not loaded');
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

Apri `src/iot/device-driver/driver-registry.ts` e aggiungi il tuo driver:

```typescript
import { MioDriver } from './mio.driver';

const mioDriver = new MioDriver();

export const driverRegistry: Record<string, IotProtocolDriver> = {
  // ... driver esistenti ...
  [mioDriver.protocol]: mioDriver,
};
```

### 3. Configura un device nel sistema

Nel pannello di gestione, crea un device con:
- **Driver**: il valore di `protocol` del tuo driver (es. `mio-protocollo`)
- **IP Address**: l'indirizzo IP del dispositivo

Poi aggiungi i componenti con `hardwareIndex` e `hardwareAddress` secondo le specifiche del tuo dispositivo.

---

## Esempio reale — Sonoff DIY

Il driver [`sonoff-diy.driver.ts`](../../src/iot/device-driver/sonoff-diy.driver.ts) è un buon esempio:
comunica con il Sonoff Basic R2 via HTTP locale (porta 8081, API DIY nativa del firmware stock ≥ 3.3.0).

---

## Pull Request

1. Crea un branch: `git checkout -b driver/nome-dispositivo`
2. Implementa il driver seguendo i passi sopra
3. Documenta le specifiche del dispositivo supportato in un commento nella classe o in un file `docs/contributing/driver-{nome}.md`
4. Apri una Pull Request con una breve descrizione del dispositivo e del protocollo usato
