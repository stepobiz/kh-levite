# REST API — Modulo IoT

## 4.1 Dispositivi — /api/iot/devices

| Metodo | Path | Request Body | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/iot/devices` | — | Lista tutti i dispositivi |
| GET | `/api/iot/devices/:id` | — | Singolo dispositivo |
| POST | `/api/iot/devices` | `DeviceDto` | Crea dispositivo |
| PATCH | `/api/iot/devices/:id` | `DeviceDto` | Aggiornamento parziale |
| DELETE | `/api/iot/devices/:id` | — | Elimina dispositivo (cascade: componenti e telemetria) |

## 4.2 Componenti — /api/iot/devices/:deviceId/components

Tutte le operazioni sui component sono scoped sotto il device. Non esiste nessun path `/api/iot/components`.

| Metodo | Path | Request Body | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/iot/devices/:deviceId/components` | — | Lista componenti del device |
| POST | `/api/iot/devices/:deviceId/components` | `DeviceComponentDto` | Crea componente nel device |
| GET | `/api/iot/devices/:deviceId/components/:id` | — | Singolo componente |
| PATCH | `/api/iot/devices/:deviceId/components/:id` | `DeviceComponentDto` | Aggiornamento parziale |
| DELETE | `/api/iot/devices/:deviceId/components/:id` | — | Elimina componente (cascade: telemetria) |
| GET | `/api/iot/devices/:deviceId/components/:id/telemetry?limit=N` | — | Log telemetria (default 100, `createdAt DESC`) |
| GET | `/api/iot/devices/:deviceId/components/:id/telemetry/latest` | — | Ultimo log — usare per conoscere lo stato attuale del component |
| POST | `/api/iot/devices/:deviceId/components/:id/command` | `CommandDto` | Imposta un comando pendente sul component |

## 4.3 Telemetria globale — /api/iot/telemetry-logs

| Metodo | Path | Descrizione |
| --- | --- | --- |
| GET | `/api/iot/telemetry-logs` | Tutti i log (ordinati `createdAt DESC`) |

## 4.4 DTO

### DeviceDto

Usato sia per POST (creazione) che per PATCH (aggiornamento parziale).

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `deviceName` | string | No | |
| `ipAddress` | string | **Sì** | |
| `macAddress` | string | No | Unique |
| `driver` | string | No | Chiave nel driverRegistry (es. `shelly-http`, `sonoff-diy`) |

### DeviceComponentDto

Usato sia per POST che per PATCH. Il `deviceId` non è nel DTO — viene ricavato dal path.

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `componentName` | string | No | |
| `hardwareIndex` | number | **Sì** | Indice HW sul dispositivo |
| `hardwareAddress` | string | No | Es. ID switch Shelly |

> `nextValue` e `nextValueUpdatedAt` sono campi interni — non compaiono mai nei DTO. Vedi [next-value.md](next-value.md).

### TelemetryLogDto

Solo output — mai usato come input.

| Campo | Tipo | Note |
| --- | --- | --- |
| `id` | number | |
| `componentId` | number | FK → IotDeviceComponent |
| `value` | string | Valore letto o scritto |
| `direction` | string | `READ` oppure `WRITE` |
| `createdAt` | datetime | |

### CommandDto

Solo input — usato per `POST /command`.

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `value` | string | **Sì** | Valore da impostare come comando pendente |
