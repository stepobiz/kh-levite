# Processo di telemetria

## Ciclo di polling

Un cron job (`TelemetryCronService`) esegue `TelemetryProcessor.process()` in loop continuo.
L'intervallo minimo tra i cicli è configurabile tramite `iot.cycle_min_interval_ms` (default: 20000 ms).

Per ogni componente attivo:

1. Recupera il driver dalla registry in base a `device.driver`
2. Chiama `driver.read(component)` → valore hardware attuale
3. Se il valore è diverso dall'ultimo log READ → inserisce nuova riga `IotTelemetryLog { direction: 'READ' }`
4. Se `nextValue` è impostato → esegue la logica di comando (vedi sotto)

## Logica comando (nextValue)

Quando un componente ha `nextValue !== null`:

1. **Cooldown check:** se `nextValueUpdatedAt` è stato impostato da meno di **5 secondi**, il ciclo viene saltato
2. Se il valore hardware coincide già con `nextValue` → `setNextValue(id, null)` (già applicato)
3. Altrimenti → `driver.write(component, nextValue)`
   - Successo: inserisce log `{ direction: 'WRITE' }` e chiama `setNextValue(id, null)`
   - Errore: logga l'errore, **nextValue rimane impostato** per essere ritentato al ciclo successivo

## Configurazioni

| Config | Default | Descrizione |
|---|---|---|
| `iot.enabled` | true | Se false il processo si mette in pausa (controlla ogni 5s) |
| `iot.cycle_min_interval_ms` | 20000 | Intervallo minimo tra cicli in ms |
| `iot.cycle_cooldown_ms` | 0 | Pausa fissa aggiuntiva post-ciclo in ms |

## Riferimenti

- [next-value.md](next-value.md) — dettaglio sul campo `nextValue` e perché non è esposto nei DTO
- [../contributing/new-driver.md](../contributing/new-driver.md) — come aggiungere un nuovo driver
