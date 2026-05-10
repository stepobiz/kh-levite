# Modello dati — Modulo AutoEngine

Il modulo AutoEngine si basa su sette tabelle. Il prefisso di tutte le tabelle è `auen_`.

## Schema DBML

```dbml
Enum auen_node_category {
  // Gruppo in_ — sensori hardware
  in_sensor                [note: "Legge un valore dall'hardware tramite SyncEngine. syncHardware: READ"]

  // Gruppo out_ — attuatori hardware
  out_logic_or             [note: "Attivo se almeno un child è attivo. syncHardware: WRITE"]
  out_logic_and            [note: "Attivo solo se tutti i child sono attivi. syncHardware: WRITE"]
  out_thermostat           [note: "Confronta sensore (child) con setpoint (child) e produce on/off. syncHardware: WRITE"]

  // Gruppo node_ — input senza hardware
  node_manual_target       [note: "Valore impostato manualmente dall'utente via /value. syncHardware: NONE"]
  node_manual_value_by_url [note: "Legge valore da URL esterno. Attributo richiesto: setpoint_url. syncHardware: NONE"]

  // Gruppo proxy_ — proxy con logiche proprie
  proxy_mirror             [note: "Copia actual_value da nodo sorgente. Supporta delay_from_child. syncHardware: dinamico dal sorgente. Attributo richiesto: source_node_id"]
  proxy_inverter           [note: "Come proxy_mirror ma inverte il valore. Solo per boolean. Attributo richiesto: source_node_id"]

  // fake — placeholder strutturale
  fake                     [note: "Nodo placeholder. Può avere figli. is_logical sempre true. syncHardware: NONE"]
}

Table auen_node_type {
  id          integer              [pk, increment]
  name        varchar              [not null]
  icon_slug   varchar
  category    auen_node_category   [not null]
  value_type  varchar              [not null, default: 'boolean', note: "boolean | number | string"]
}

Table auen_node {
  id                        integer   [pk, increment]
  code                      varchar   [null, note: "Identificatore leggibile opzionale — NON unique"]
  description               text
  type_id                   integer   [not null, ref: > auen_node_type.id, note: "Non modificabile dopo la creazione"]
  parent_id                 integer   [null, ref: > auen_node.id]
  order                     integer   [default: 0, note: "Ordinamento tra i siblings (stessa parent_id). Gestito dal backend via PATCH /order"]
  is_logical                boolean   [default: false, note: "Se true il nodo non ha corrispondenza hardware. Sempre true per category fake"]
  iot_component_id          integer   [null, ref: > IotDeviceComponent.id, note: "FK verso component IoT. Disponibile per in_*, out_*, proxy_*. Bloccato se is_logical=true o category=fake"]
  desired_value             varchar   [default: '0']
  desired_value_updated_at  timestamp
  actual_value              varchar   [default: '0']
  actual_value_updated_at   timestamp
}

Table auen_attribute_type {
  id          integer   [pk, increment]
  code        varchar   [unique, not null]
  description text
  data_type   varchar   [note: "string | number | boolean | auen_node"]
}

Table auen_node_attribute {
  node_id       integer   [not null, ref: > auen_node.id]
  attribute_id  integer   [not null, ref: > auen_attribute_type.id]
  value         text      [not null]
  indexes { (node_id, attribute_id) [pk] }
}

Table auen_tag {
  id    integer   [pk, increment]
  name  varchar   [unique, not null]
}

Table auen_node_tag {
  node_id  integer   [not null, ref: > auen_node.id]
  tag_id   integer   [not null, ref: > auen_tag.id]
  indexes { (node_id, tag_id) [pk] }
}
```

## Classificazione a 5 gruppi

| Gruppo | Category | Figli | iotComponentId | syncHardware | is_logical | Colore UI |
| --- | --- | --- | --- | --- | --- | --- |
| `in_` | `in_sensor` | ❌ | ✅ (se non logico) | `READ` | configurabile | Verde |
| `out_` | `out_logic_or`, `out_logic_and`, `out_thermostat` | ✅ | ✅ (se non logico) | `WRITE` | configurabile | Blu |
| `node_` | `node_manual_target`, `node_manual_value_by_url` | ❌ | ❌ | `NONE` | configurabile | Grigio |
| `proxy_` | `proxy_mirror`, `proxy_inverter` | ❌ | ✅ (se non logico) | Dinamico | configurabile | Arancione |
| `fake` | `fake` | ✅ | ❌ | `NONE` | **sempre true** | Grigio chiaro |

> `is_logical = true` → bordo tratteggiato blu in topologia, `iotComponentId` bloccato.
> Per `fake`: `is_logical` è sempre `true` e non modificabile — checkbox nascosta in UI.

## Note al modello

**auen_node.order**

- Indica la posizione del nodo tra i suoi siblings (nodi con stesso `parent_id`)
- Modificabile tramite `PATCH /api/auen/nodes/:id/order` con `{ "direction": "up" | "down" }`
- Il backend normalizza gli order dei siblings come `0, 1, 2...` dopo ogni modifica
- La topologia e la lista nodi ordinano i child per `order ASC`

**auen_node.is_logical**

- Se `true`: nodo senza corrispondenza hardware, bordo tratteggiato blu in topologia
- Per `fake`: sempre `true`, immutabile — non viene mostrata la checkbox in UI

## Attributi standard per category

| Attributo (`code`) | Category | data_type | Obbligatorio | Note |
| --- | --- | --- | --- | --- |
| `setpoint_url` | `node_manual_value_by_url` | string | **Sì** | URL che risponde con `{ "value": "..." }` |
| `source_node_id` | `proxy_mirror`, `proxy_inverter` | auen_node | **Sì** | ID del nodo sorgente |
| `delay_from_child` | `out_logic_or`, `out_logic_and`, `proxy_mirror`, `proxy_inverter` | number | No | Secondi di attesa su entrambe le transizioni ON e OFF |
| `hysteresis` | `out_thermostat` | number | No | Soglia differenziale in gradi, default `0.5` |

## Regole sui figli

**Possono avere figli:** `out_logic_or`, `out_logic_and`, `out_thermostat`, `fake`
**Non possono avere figli:** `in_sensor`, `proxy_mirror`, `proxy_inverter`, `node_manual_target`, `node_manual_value_by_url`

## Indici

| Tabella | Indice | Motivazione |
| --- | --- | --- |
| `auen_node` | `parent_id` | Navigazione albero e recupero siblings per ordinamento |
| `auen_node` | `iot_component_id` | Lookup per SyncEngine |
| `auen_node_attribute` | `(node_id, attribute_id)` PK | Lookup attributi |
| `auen_attribute_type` | `code` unique | Lookup per codice |
| `auen_node_tag` | `(node_id, tag_id)` PK | Lookup tag |
| `auen_tag` | `name` unique | Lookup per nome |
