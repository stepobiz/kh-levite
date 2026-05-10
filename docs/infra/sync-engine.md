# SyncEngine — processo di sincronizzazione

## Panoramica

Il SyncEngine è un processo continuo che sincronizza lo stato tra AutoEngine e IoT. Gira in loop continuo come il LogicEngine — quando finisce un ciclo aspetta l'intervallo configurato e riparte.

Non contiene logica di automazione — quella appartiene ad AutoEngine. Si limita a propagare i valori nei due sensi: AutoEngine → IoT (WRITE) e IoT → AutoEngine (READ).

## Ciclo di esecuzione

```
Per ogni nodo in auen_node che ha iot_component_id valorizzato:

  strategy = StrategyFactory.get(node.type.category)
  mode = strategy.syncHardware()

  if mode === 'NONE' → skip

  lastLog = GET /api/iot/devices/:deviceId/components/:id/telemetry/latest
            (l'ultimo log hardware, READ o WRITE)

  if mode === 'WRITE':
    if node.actual_value !== lastLog?.value:
      if node.iotComponent.nextValue !== node.actual_value:
        → IotComponentService.setNextValue(iotComponentId, node.actual_value)
        → il cron IoT si occuperà di attuarlo fisicamente

  if mode === 'READ':
    if lastLog?.value !== node.actual_value:
      → NodeService.setManualValue(node.id, lastLog.value)
        (aggiorna desired_value e actual_value insieme)
```

## Logica WRITE — dettaglio

Il confronto `node.actual_value !== lastLog?.value` verifica se l'hardware riflette già il valore desiderato. Se no, imposta `next_value` sul component IoT come "casella postale" — il cron di TelemetryProcessor lo leggerà e lo scriverà fisicamente sul dispositivo.

Il doppio controllo `nextValue !== node.actual_value` evita scritture ridondanti se `next_value` è già impostato correttamente.

## Logica READ — dettaglio

Legge l'ultimo log di telemetria (indipendentemente dalla direzione READ/WRITE) e lo confronta con `actual_value` del nodo. Se diverso, aggiorna il nodo tramite `setManualValue` — che aggiorna `desired_value` e `actual_value` insieme nella stessa operazione Prisma.

## Loop continuo

```typescript
async start() {
  while (true) {
    const startedAt = new Date();
    let status = 'success';
    let errorMsg: string | undefined;
    let itemsProcessed = 0;

    try {
      itemsProcessed = await this.process();
    } catch (err) {
      status = 'error';
      errorMsg = err.message;
    }

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - startedAt.getTime();

    await this.processLogService.log({
      processName: 'sync_engine',
      startedAt, endedAt, durationMs,
      itemsProcessed, status, errorMsg
    });

    const minInterval = await this.getCfg('sync.cycle_min_interval_ms') ?? 2000;
    const cooldown = await this.getCfg('sync.cycle_cooldown_ms') ?? 0;
    const wait = Math.max(0, minInterval - durationMs) + cooldown;
    if (wait > 0) await sleep(wait);
  }
}
```

## Configurazioni

| code | default | Descrizione |
| --- | --- | --- |
| `sync.cycle_min_interval_ms` | 2000 | Intervallo minimo tra cicli (ms) |
| `sync.cycle_cooldown_ms` | 0 | Pausa fissa post-ciclo (ms) |

## Cosa NON fa il SyncEngine

- Non calcola logica — quella appartiene al LogicEngine
- Non scrive direttamente sull'hardware — usa `setNextValue` sul component IoT, il TelemetryProcessor si occupa dell'attuazione fisica
- Non gestisce errori di comunicazione hardware — quelli sono responsabilità del TelemetryProcessor
