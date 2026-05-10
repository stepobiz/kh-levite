# REST API — Modulo AutoEngine

Il modulo AutoEngine espone API per la gestione della configurazione della rete di nodi. Il Logic Engine e il SyncEngine girano internamente — non sono esposti via API.

## 4.1 Node Type — /api/auen/node-types

| Metodo | Path | Request Body | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/auen/node-types` | — | Lista tutti i tipi di nodo |
| GET | `/api/auen/node-types/:id` | — | Singolo tipo di nodo |
| POST | `/api/auen/node-types` | `NodeTypeDto` | Crea tipo di nodo |
| PATCH | `/api/auen/node-types/:id` | `NodeTypeDto` | Aggiornamento parziale |
| DELETE | `/api/auen/node-types/:id` | — | Elimina tipo di nodo |

> La modifica dei node type può essere bloccata dalla configurazione `allow_node_type_edit = false`.

## 4.2 Nodi — /api/auen/nodes

| Metodo | Path | Request Body | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/auen/nodes` | — | Lista tutti i nodi (con type, parent, children, attributes, tags) ordinati per `order ASC` per siblings |
| GET | `/api/auen/nodes/:id` | — | Singolo nodo |
| POST | `/api/auen/nodes` | `NodeDto` | Crea nodo |
| PATCH | `/api/auen/nodes/:id` | `NodeDto` | Aggiornamento parziale (type_id non modificabile) |
| DELETE | `/api/auen/nodes/:id` | — | Elimina nodo con tutti i suoi discendenti (cascade atomico) |
| PATCH | `/api/auen/nodes/:id/parent` | `SetParentDto` | Imposta parent del nodo |
| DELETE | `/api/auen/nodes/:id/parent` | — | Rimuove parent (nodo diventa radice) |
| PATCH | `/api/auen/nodes/:id/order` | `ReorderDto` | Sposta il nodo avanti o indietro tra i siblings |
| POST | `/api/auen/nodes/:id/clone` | — | Clona il nodo con tutti i suoi figli ricorsivamente |
| POST | `/api/auen/nodes/:id/value` | `NodeValueDto` | Imposta valore su nodo `node_manual_target` |

## 4.3 Attributi — /api/auen/attribute-types e /api/auen/nodes/:id/attributes

| Metodo | Path | Request Body | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/auen/attribute-types` | — | Lista tutti i tipi di attributo |
| POST | `/api/auen/attribute-types` | `AttributeTypeDto` | Crea tipo di attributo |
| PATCH | `/api/auen/attribute-types/:id` | `AttributeTypeDto` | Aggiornamento parziale |
| DELETE | `/api/auen/attribute-types/:id` | — | Elimina tipo di attributo |
| GET | `/api/auen/nodes/:id/attributes` | — | Lista attributi del nodo |
| PUT | `/api/auen/nodes/:id/attributes/:attributeId` | `NodeAttributeDto` | Imposta valore attributo (upsert) |
| DELETE | `/api/auen/nodes/:id/attributes/:attributeId` | — | Rimuove attributo dal nodo |

## 4.4 Tag — /api/auen/tags e /api/auen/nodes/:id/tags

| Metodo | Path | Request Body | Descrizione |
| --- | --- | --- | --- |
| GET | `/api/auen/tags` | — | Lista tutti i tag disponibili |
| POST | `/api/auen/tags` | `TagDto` | Crea tag |
| DELETE | `/api/auen/tags/:id` | — | Elimina tag |
| GET | `/api/auen/nodes/:id/tags` | — | Lista tag del nodo |
| PUT | `/api/auen/nodes/:id/tags/:tagId` | — | Aggiunge tag al nodo (upsert) |
| DELETE | `/api/auen/nodes/:id/tags/:tagId` | — | Rimuove tag dal nodo |
| GET | `/api/auen/nodes?tagId=X` | — | Filtra nodi per tag |

## 4.5 Statistiche processi — /api/infra/process-stats

| Metodo | Path | Descrizione |
| --- | --- | --- |
| GET | `/api/infra/process-stats/logic_engine` | Statistiche cicli Logic Engine |
| GET | `/api/infra/process-stats/sync_engine` | Statistiche cicli Sync Engine |
| GET | `/api/infra/process-stats/telemetry_processor` | Statistiche cicli Telemetry Processor |

## 4.6 Ordinamento — PATCH /api/auen/nodes/:id/order

Sposta il nodo avanti o indietro tra i siblings (nodi con stesso `parent_id`).

- `direction: "down"` → aumenta l'order (si sposta a destra/dopo nella topologia)
- `direction: "up"` → diminuisce l'order (si sposta a sinistra/prima)
- Se non c'è sibling nella direzione richiesta → nessuna operazione
- Dopo lo swap il backend normalizza gli order dei siblings come `0, 1, 2...`
- Atomico in transazione Prisma

## 4.7 Clone — POST /api/auen/nodes/:id/clone

- Codici non modificati — `code` non è unique
- `parent_id` del nodo radice clonato = stesso dell'originale
- Attributi clonati, `desired_value`/`actual_value` resettati a `'0'`
- `iotComponentId` resettato a `null`
- `order` impostato come ultimo tra i siblings
- Atomico — rollback completo in caso di errore

## 4.8 DTO

### NodeTypeDto

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `name` | string | **Sì** | |
| `icon_slug` | string | No | |
| `category` | auen_node_category | **Sì** | Enum fisso |
| `value_type` | string | **Sì** | `boolean`, `number`, `string` |

### NodeDto

`desired_value` e `actual_value` mai nel DTO. `type_id` non modificabile dopo la creazione.

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `code` | string | No | Opzionale — non unique |
| `description` | string | No | |
| `type_id` | number | **Sì** in POST, readonly in PATCH | |
| `parent_id` | number | No | Null per nodi radice |
| `is_logical` | boolean | No | Sempre `true` per `fake` — non modificabile. UI: nasconde checkbox per fake |
| `iot_component_id` | number | No | Solo per `in_*`, `out_*`, `proxy_*` e solo se `is_logical = false` |

### ReorderDto

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `direction` | string | **Sì** | `"up"` o `"down"` |

### SetParentDto

| Campo | Tipo | Obbligatorio |
| --- | --- | --- |
| `parentId` | number | **Sì** |

### AttributeTypeDto

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `code` | string | **Sì** | |
| `description` | string | No | |
| `data_type` | string | **Sì** | `string`, `number`, `boolean`, `auen_node` |

### NodeAttributeDto

| Campo | Tipo | Obbligatorio |
| --- | --- | --- |
| `value` | string | **Sì** |

### NodeValueDto

| Campo | Tipo | Obbligatorio | Note |
| --- | --- | --- | --- |
| `value` | string | **Sì** | Solo per `node_manual_target`. Aggiorna desired e actual insieme. |

### TagDto

| Campo | Tipo | Obbligatorio |
| --- | --- | --- |
| `name` | string | **Sì** |
