# Logic Engine — ciclo di esecuzione

## Panoramica

Il Logic Engine è un **processo continuo** (loop while) che scorre tutti i nodi della rete e applica la Strategy corrispondente. Parte con `onModuleInit` e gira indefinitamente. Tra un ciclo e l'altro rispetta l'intervallo configurato in `autoengine.cycle_min_interval_ms`.

## Ciclo di esecuzione

```
Per ogni nodo in auen_node (con relations: type, parent, children, attributes)
ordinati in ordine topologico (foglie prima, radici ultime):

  strategy = StrategyFactory.get(node.type.category)

  ┌─ FASE 1: Calcolo del desired ────────────────────────────────┐
  │  nextDesired = strategy.calculateDesired(node)               │
  │  if nextDesired !== node.desired_value:                      │
  │      aggiorna desired_value e desired_value_updated_at       │
  └──────────────────────────────────────────────────────────────┘

  ┌─ FASE 2: Transizione a actual ───────────────────────────────┐
  │  if node.actual_value !== node.desired_value:                │
  │      nextActual = strategy.updateActual(node)                │
  │      if nextActual !== undefined:                            │
  │          aggiorna actual_value e actual_value_updated_at     │
  └──────────────────────────────────────────────────────────────┘
```

## Fase 1 — calculateDesired

La Strategy calcola cosa il nodo "vorrebbe" essere in base ai suoi child, parent, sorgente (proxy) o sistemi esterni. Il controllo `nextDesired !== node.desired_value` evita scritture inutili su DB e aggiorna `desired_value_updated_at` — necessario per i calcoli di delay nella fase 2.

## Fase 2 — updateActual

Il controllo `actual !== desired` è centralizzato nel Logic Engine. Le Strategy decidono solo se e quando la transizione può avvenire:

- **Transizione immediata** → `updateActual` ritorna `node.desired_value`
- **Transizione con delay** → controlla `desired_value_updated_at` vs `delay_from_child`: se il tempo trascorso è inferiore al delay, ritorna `undefined`
- **Transizione bloccata** → ritorna `undefined`

## Gestione del delay — delay_from_child

Il delay si applica su **entrambe le transizioni** — sia verso `'1'` (ON) che verso `'0'` (OFF).
Disponibile per: `out_logic_or`, `out_logic_and`, `proxy_mirror`, `proxy_inverter`.

```typescript
updateActual(node: AuenNode): string | undefined {
  const delayAttr = node.attributes.find(a => a.code === 'delay_from_child');
  if (delayAttr && node.desired_value_updated_at) {
    const waitMs = parseInt(delayAttr.value) * 1000;
    const elapsed = Date.now() - new Date(node.desired_value_updated_at).getTime();
    if (elapsed < waitMs) return undefined;
  }
  return node.desired_value;
}
```

**Esempio:** pompa `proxy_mirror` con `delay_from_child = 10` — aspetta 10 secondi sia per accendersi che per spegnersi dopo che il nodo sorgente cambia stato.

## Aggiornamento manuale — node_manual_target

L'unico punto fuori dal ciclo in cui `actual_value` viene aggiornato è `setManualValue` — usato da `POST /api/auen/nodes/:id/value` per i nodi `node_manual_target`.

> `desired_value` e `actual_value` vengono sempre aggiornati insieme nella stessa operazione Prisma.

```typescript
setManualValue(id: number, value: string) {
  const now = new Date();
  return this.prisma.auenNode.update({
    where: { id },
    data: {
      desiredValue: value,
      desiredValueUpdatedAt: now,
      actualValue: value,
      actualValueUpdatedAt: now,
    },
    include: NODE_INCLUDE,
  });
}
```

## Ordine di esecuzione — ordinamento topologico

I nodi vengono processati dalle foglie verso la radice. Le foglie (`in_sensor`, `node_manual_target`, `node_manual_value_by_url`, `proxy_*` senza figli) vengono elaborate per prime, così quando un nodo `out_*` viene processato i valori dei suoi child sono già aggiornati nel ciclo corrente.

## Configurazioni

| Config | Default | Descrizione |
|---|---|---|
| `autoengine.enabled` | true | Se false il processo si mette in pausa (controlla ogni 5s) |
| `autoengine.cycle_min_interval_ms` | 1000 | Intervallo minimo tra cicli in ms |
| `autoengine.cycle_cooldown_ms` | 0 | Pausa fissa aggiuntiva post-ciclo in ms |

## Cosa NON fa il Logic Engine

- Non comunica con l'hardware — quello è compito di SyncEngine + IoT
- Non scrive `actual_value` sui nodi `in_sensor` — quei valori arrivano da SyncEngine
- Non gestisce errori di comunicazione hardware
