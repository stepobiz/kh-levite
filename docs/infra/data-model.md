# Modello dati — Modulo InfraModule

Il modulo InfraModule si basa su tre tabelle con prefissi `cfg_` e `sys_`.

## Schema DBML

```dbml
// --- CONFIGURATION ---

Enum cfg_value_type {
  integer
  float
  boolean
  text
}

Table cfg_section {
  id    integer   [pk, increment]
  code  varchar   [unique, not null, note: "Chiave leggibile (es. 'autoengine', 'sync', 'sistema')"]
  name  varchar   [not null]
}

Table cfg_configuration {
  code        varchar          [pk, note: "Chiave usata nel codice (es. 'autoengine.cycle_min_interval_ms')"]
  name        varchar          [not null]
  description text
  section_id  integer          [null, ref: > cfg_section.id]
  data_type   cfg_value_type   [not null]
  val_int     integer          [null]
  val_float   float            [null]
  val_bool    boolean          [null]
  val_text    text             [null]
}

// --- PROCESS LOG ---

Table sys_process_log {
  id              integer   [pk, increment]
  process_name    varchar   [not null, note: "logic_engine | sync_engine (estendibile)"]
  started_at      timestamp [not null]
  ended_at        timestamp [not null]
  duration_ms     integer   [not null]
  items_processed integer   [not null]
  status          varchar   [not null, note: "success | error"]
  error_msg       text      [null]
}
```

## Note al modello

**cfg_configuration**

- `code` è la chiave primaria leggibile — convention: `modulo.nome_config` (es. `autoengine.cycle_min_interval_ms`)
- Solo uno dei campi `val_*` sarà valorizzato, in base al `data_type`
- Due form di modifica nella UI: **form user** (solo valore) e **form admin** (tutti i campi)

**sys_process_log**

- Tabella append-only — nessun update o delete manuale
- La retention è gestita automaticamente dal `RetentionService` in base alla config `infra.process_log_retention_days`
- `process_name` è una stringa libera estendibile — ogni nuovo processo aggiunge il proprio nome

## Configurazioni standard

| code | section | data_type | default | Descrizione |
| --- | --- | --- | --- | --- |
| `autoengine.cycle_min_interval_ms` | autoengine | integer | 1000 | Intervallo minimo tra cicli Logic Engine (ms) |
| `autoengine.cycle_cooldown_ms` | autoengine | integer | 0 | Pausa fissa post-ciclo Logic Engine (ms) |
| `sync.cycle_min_interval_ms` | sync | integer | 2000 | Intervallo minimo tra cicli Sync Engine (ms) |
| `sync.cycle_cooldown_ms` | sync | integer | 0 | Pausa fissa post-ciclo Sync Engine (ms) |
| `infra.process_log_retention_days` | infra | integer | 7 | Giorni di retention dei log di processo |
| `allow_node_type_edit` | sistema | boolean | false | Abilita modifica node type dalla UI |

## Indici

| Tabella | Indice | Motivazione |
| --- | --- | --- |
| `cfg_section` | `code` unique | Lookup per codice |
| `sys_process_log` | `process_name` | Filtro per processo nelle statistiche |
| `sys_process_log` | `started_at` | Filtro per data nelle query di retention e statistiche |
