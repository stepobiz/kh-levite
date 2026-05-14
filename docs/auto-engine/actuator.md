# LogicEngineActuator — sincronizzazione AutoEngine ↔ IoT

## Panoramica

`LogicEngineActuatorBusiness` è il processo che sincronizza lo stato tra AutoEngine e IoT.
Vive dentro AutoEngineModule insieme a `LogicEngineSolverBusiness` — sono i due processi gemelli dell'automazione.

Non contiene logica di automazione — quella appartiene a `LogicEngineSolverBusiness`. Si limita a propagare i valori nei due sensi: AutoEngine → IoT (WRITE) e IoT → AutoEngine (READ).

## Ciclo di esecuzione

```
Per ogni nodo in auen_node che ha iot_component_id valorizzato:

  strategy = StrategyFactory.get(node.type.category)
  mode = strategy.syncHardware()

  if mode === 'NONE' → skip

  lastLog = TelemetryLogBusiness.findLatestByComponent(iotComponentId)

  if mode === 'WRITE':
    if node.actual_value !== lastLog?.value:
      if node.iotComponent.nextValue !== node.actual_value:
        → DeviceComponentBusiness.setNextValue(iotComponentId, node.actual_value)
        → TelemetryCronService attuazione fisica al prossimo ciclo

  if mode === 'READ':
    if lastLog?.value !== node.actual_value:
      → NodeBusiness.setDesiredFromHardware(node.id, lastLog.value)
```

## Logica WRITE — dettaglio

Il confronto `node.actual_value !== lastLog?.value` verifica se l'hardware riflette già il valore desiderato. Se no, imposta `next_value` sul component IoT come "casella postale" — il `TelemetryCronService` lo leggerà e lo scriverà fisicamente sul dispositivo.

Il doppio controllo `nextValue !== node.actual_value` evita scritture ridondanti se `next_value` è già impostato correttamente.

## Logica READ — dettaglio

Legge l'ultimo log di telemetria (indipendentemente dalla direzione READ/WRITE) e lo confronta con `actual_value` del nodo. Se diverso, aggiorna il nodo tramite `NodeBusiness.setDesiredFromHardware()` — che aggiorna `desired_value` e `actual_value` insieme.

## Loop continuo

`LogicEngineActuatorProcess` avvia il loop in `onModuleInit()`. Delega tutta la logica a `LogicEngineActuatorBusiness`, scrive su `ProcessLog` con `processName = 'sync_engine'`, e emette aggiornamenti realtime.

## Configurazioni

| code | default | Descrizione |
| --- | --- | --- |
| `sync.enabled` | true | Se false il processo si mette in pausa (controlla ogni 5s) |
| `sync.cycle_min_interval_ms` | 2000 | Intervallo minimo tra cicli (ms) |
| `sync.cycle_cooldown_ms` | 0 | Pausa fissa post-ciclo (ms) |

## Cosa NON fa

- Non calcola logica — quella appartiene a `LogicEngineSolverBusiness`
- Non scrive direttamente sull'hardware — usa `setNextValue` sul component IoT, il `TelemetryCronService` si occupa dell'attuazione fisica
- Non gestisce errori di comunicazione hardware — quelli sono responsabilità del `TelemetryCronService`
