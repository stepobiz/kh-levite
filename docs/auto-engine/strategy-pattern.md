# Strategy pattern e categorie

## Il pattern Strategy

Ogni nodo ha un tipo (`auen_node_type`) con una `category`. La category determina quale **Strategy** il Logic Engine applica a quel nodo durante il ciclo di esecuzione.

```typescript
interface NodeStrategy {
  calculateDesired(node: AuenNode): string;
  updateActual(node: AuenNode): string | undefined;
  syncHardware(node?: AuenNode, allNodes?: AuenNode[]): 'READ' | 'WRITE' | 'NONE';
}
```

## Classificazione a 5 gruppi

| Gruppo | Category | Figli | iotComponentId | syncHardware | Colore UI |
| --- | --- | --- | --- | --- | --- |
| `in_` | `in_sensor` | ❌ | ✅ (se non logico) | `READ` | Verde |
| `out_` | `out_logic_or`, `out_logic_and`, `out_thermostat` | ✅ | ✅ (se non logico) | `WRITE` | Blu |
| `node_` | `node_manual_target`, `node_manual_value_by_url` | ❌ | ❌ | `NONE` | Grigio |
| `proxy_` | `proxy_mirror`, `proxy_inverter` | ❌ | ✅ (se non logico) | Dinamico dal sorgente | Arancione |
| `fake` | `fake` | ✅ | ❌ | `NONE` | Grigio chiaro |

> **Nota:** `iotComponentId` è bloccato se `is_logical = true` — indipendentemente dalla category.

## Regole sui figli

**Possono avere figli:** `out_logic_or`, `out_logic_and`, `out_thermostat`, `fake`
**Non possono avere figli:** `in_sensor`, `proxy_mirror`, `proxy_inverter`, `node_manual_target`, `node_manual_value_by_url`

Il backend risponde `400 Bad Request` se si tenta di impostare come parent un nodo che non può avere figli.

## Categorie — dettaglio

### `in_sensor`

Sensore fisico. `actual_value` aggiornato da SyncEngine (READ da IoT).

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Passthrough — desired = actual |
| `updateActual` | Passthrough immediato |
| `syncHardware` | `READ` |

### `node_manual_target`

Valore impostato manualmente via `POST /api/auen/nodes/:id/value`. Aggiorna desired e actual insieme.

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Passthrough |
| `updateActual` | Passthrough immediato |
| `syncHardware` | `NONE` |

### `node_manual_value_by_url`

Legge valore da URL esterno ad ogni ciclo. **Attributo richiesto:** `setpoint_url`.

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Chiama `setpoint_url`. Se errore: conservativo |
| `updateActual` | Passthrough immediato |
| `syncHardware` | `NONE` |

### `proxy_mirror`

Copia `actual_value` dal nodo sorgente. Può avere `delay_from_child`. **Attributo richiesto:** `source_node_id`.

**Caso d'uso:** pompa che copia lo stato di "linea sale stradali" ma parte 10 secondi dopo (delay_from_child = 10).

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Copia `actual_value` del sorgente. Se non trovato: conservativo |
| `updateActual` | Passthrough con delay opzionale (`delay_from_child`) su entrambe le transizioni ON e OFF |
| `syncHardware` | Dinamico — delega al sorgente |

### `proxy_inverter`

Come `proxy_mirror` ma inverte il valore. **Solo per sorgenti** `value_type = 'boolean'`. **Attributo richiesto:** `source_node_id`.

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Copia e inverte `'1'`↔`'0'`. Se sorgente non boolean: conservativo |
| `updateActual` | Passthrough con delay opzionale |
| `syncHardware` | Dinamico — delega al sorgente |

### `out_logic_or`

Attivo se almeno uno dei child ha `actual_value = '1'`. Supporta `delay_from_child` su ON e OFF.

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | `'1'` se almeno un child ha actual = '1' |
| `updateActual` | Passthrough con delay opzionale su entrambe le transizioni |
| `syncHardware` | `WRITE` |

### `out_logic_and`

Attivo solo se tutti i child hanno `actual_value = '1'`. Supporta `delay_from_child` su ON e OFF.

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | `'1'` solo se tutti i child hanno actual = '1' |
| `updateActual` | Passthrough con delay opzionale su entrambe le transizioni |
| `syncHardware` | `WRITE` |

### `out_thermostat`

Confronta child sensore con child setpoint. Produce on/off con isteresi. **Attributo opzionale:** `hysteresis` (default `0.5`).

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Confronta sensore e setpoint con isteresi |
| `updateActual` | Passthrough immediato |
| `syncHardware` | `WRITE` |

### `fake`

Placeholder senza logica. Può avere figli — utile per strutturare l'albero.

| Metodo | Comportamento |
| --- | --- |
| `calculateDesired` | Ritorna `actual_value` invariato |
| `updateActual` | Passthrough immediato |
| `syncHardware` | `NONE` |

## Attributi standard per category

| Attributo (`code`) | Category | data_type | Obbligatorio | Note |
| --- | --- | --- | --- | --- |
| `setpoint_url` | `node_manual_value_by_url` | string | **Sì** | URL che risponde con `{ "value": "..." }` |
| `source_node_id` | `proxy_mirror`, `proxy_inverter` | auen_node | **Sì** | ID del nodo sorgente |
| `delay_from_child` | `out_logic_or`, `out_logic_and`, `proxy_mirror`, `proxy_inverter` | number | No | Secondi di attesa prima di cambiare stato (ON e OFF) |
| `hysteresis` | `out_thermostat` | number | No | Soglia differenziale in gradi, default `0.5` |

## Aggiungere una nuova category

1. Aggiungere il valore all'enum `AuenNodeCategory` in `schema.prisma`
2. Eseguire `prisma migrate dev` e `prisma generate`
3. Implementare la nuova classe che implementa `NodeStrategy` in `src/auto-engine/business/node-strategy/strategies/`
4. Registrarla nella `StrategyFactory` (`src/auto-engine/business/node-strategy/strategy.factory.ts`)
5. Decidere il gruppo di appartenenza e aggiornare le regole sui figli e `iotComponentId`
