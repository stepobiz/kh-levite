# nextValue — campo interno

## Cos'è

`nextValue` è un campo interno del modello `IotDeviceComponent` usato come buffer di comando.
Rappresenta il valore che il cron job di telemetria dovrà scrivere sull'hardware al prossimo ciclo utile.

Insieme a `nextValue` esiste `nextValueUpdatedAt`, che registra il timestamp dell'ultimo set — usato per il cooldown (vedi [telemetry-process.md](telemetry-process.md)).

## Regola fondamentale

> `nextValue` e `nextValueUpdatedAt` **non compaiono mai nei DTO** — né in input né in output.

Non sono esposti nelle API REST perché:

- Non rappresentano lo stato reale del componente hardware (quello è nel log di telemetria)
- Sono un dettaglio implementativo del ciclo di polling — non devono essere modificati direttamente dall'esterno
- Esporli creerebbe ambiguità: un client potrebbe credere che settare `nextValue` via PATCH sia equivalente a inviare un comando, il che non è corretto (mancherebbe il cooldown, il retry logic, ecc.)

## Come si usa (API pubblica)

| Obiettivo | Endpoint |
|---|---|
| Conoscere lo stato attuale del component | `GET /api/iot/devices/:deviceId/components/:id/telemetry/latest` |
| Impostare un comando sul component | `POST /api/iot/devices/:deviceId/components/:id/command` con `{ "value": "true" }` |
| Vedere la storia dei valori | `GET /api/iot/devices/:deviceId/components/:id/telemetry?limit=N` |

## Ciclo di vita interno

```
POST /command { value: "true" }
        │
        ▼
nextValue = "true"
nextValueUpdatedAt = now()
        │
        ▼ (dopo cooldown di 5s)
TelemetryCronService → driver.write(component, "true")
        │
        ├─ successo → nextValue = null, log WRITE inserito
        └─ errore   → nextValue rimane, verrà ritentato al ciclo successivo
```

## Nel codice

`nextValue` viene letto solo da `TelemetryProcessor` tramite `DeviceComponentBusiness.findAllForProcessor()`
che ritorna un `ProcessorComponentView` — un tipo interno non esposto all'esterno del process layer.

Nessun controller o repository esterno legge o scrive `nextValue` direttamente.
L'unico punto di scrittura è il metodo `DeviceComponentBusiness.setNextValue(id, value)`.
