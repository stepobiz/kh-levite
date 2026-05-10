# Modello dati — Modulo IoT

Il modulo IoT si basa su tre entità principali: il dispositivo fisico, i suoi componenti hardware, e il log di telemetria che ne traccia gli stati nel tempo.

## Schema DBML

```dbml
Table IotDevice {
  id          Int       [pk, increment]
  deviceName  String    [null, note: "Nome descrittivo del dispositivo"]
  macAddress  String    [unique, null, note: "MAC address del dispositivo"]
  ipAddress   String    [not null, note: "Indirizzo IP — obbligatorio per la comunicazione"]
  driver      String    [null, note: "Chiave nel driverRegistry (es. shelly-http)"]
  createdAt   DateTime  [default: `now()`]
  updatedAt   DateTime  [note: "Auto-aggiornato da Prisma"]
}

Table IotDeviceComponent {
  id                  Int       [pk, increment]
  deviceId            Int       [not null, ref: > IotDevice.id, note: "FK verso il device padre"]
  componentName       String    [null, note: "Nome descrittivo del componente"]
  hardwareIndex       Int       [not null, note: "Indice del componente sull'hardware (es. 0, 1, 2...)"]
  hardwareAddress     String    [null, note: "Indirizzo hardware del componente (es. ID switch Shelly)"]
  nextValue           String    [null, note: "CAMPO INTERNO — valore pendente da scrivere. Non esposto nei DTO. Vedi: next-value.md"]
  nextValueUpdatedAt  DateTime  [null, note: "CAMPO INTERNO — timestamp ultimo set di nextValue. Usato per il cooldown"]
  createdAt           DateTime  [default: `now()`]
  updatedAt           DateTime  [note: "Auto-aggiornato da Prisma"]
}

Table IotTelemetryLog {
  id          Int       [pk, increment]
  componentId Int       [not null, ref: > IotDeviceComponent.id, note: "FK verso il componente"]
  value       String    [not null, note: "Valore letto o scritto"]
  direction   String    [not null, note: "READ oppure WRITE"]
  createdAt   DateTime  [default: `now()`, note: "Append-only — nessun update o delete"]
}
```

## Note al modello

**IotDevice**

- `ipAddress` è l'unico campo obbligatorio — è il minimo necessario per comunicare con il dispositivo
- `driver` è opzionale: se assente il dispositivo non può essere interrogato dal cron, ma può essere registrato in anagrafica

**IotDeviceComponent**

- Ogni component appartiene a esattamente un device (`deviceId` obbligatorio)
- `hardwareIndex` identifica quale "canale" del dispositivo fisico rappresenta (es. switch 0, switch 1)
- `nextValue` e `nextValueUpdatedAt` sono campi interni del meccanismo di comando — non compaiono mai nei DTO REST. Vedi [next-value.md](next-value.md)

**IotTelemetryLog**

- La tabella è **append-only**: nessuna riga viene mai modificata o eliminata
- Ogni cambiamento di stato genera una nuova riga
- `direction` indica se il valore è stato letto dall'hardware (`READ`) o scritto su di esso (`WRITE`)
- Index composto su `(componentId, createdAt)` per ottimizzare le query per component

## Indici

| Tabella | Indice | Motivazione |
| --- | --- | --- |
| `IotDeviceComponent` | `@@index([deviceId])` | Query per device nei list endpoint |
| `IotTelemetryLog` | `@@index([componentId, createdAt])` | Query telemetria per component ordinata per data |
