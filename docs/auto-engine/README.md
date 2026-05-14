# KH Levite — Modulo AutoEngine

AutoEngine è il modulo di KH Levite che implementa la logica di automazione dell'impianto. Funziona come un **PLC software**: riceve valori da sensori e sistemi esterni, applica logiche configurabili, e produce output che altri moduli attuano sull'hardware.

Ha tre responsabilità principali:

**1. Configurazione della rete di automazione**
L'amministratore definisce tramite UI una rete di nodi interconnessi. Ogni nodo rappresenta un'entità logica o fisica dell'impianto (sensore, valvola, pompa, termostato, relay...). I nodi sono organizzati in un albero e classificati in 5 gruppi: `in_`, `out_`, `node_`, `proxy_`, `fake`.

**2. Esecuzione della logica**
Un processo continuo (Logic Engine) scorre tutti i nodi in ordine topologico e per ognuno applica la Strategy corrispondente alla sua category. La Strategy calcola `desired_value` e determina quando questo diventa `actual_value`, gestendo delay, isteresi e logiche differenziali.

**3. Produzione degli output**
AutoEngine non comunica direttamente con l'hardware. Scrive i propri output in `actual_value` — il processo `LogicEngineActuatorBusiness` (interno ad AutoEngineModule) propaga questi valori al modulo IoT per l'attuazione fisica. Analogamente, l'Actuator aggiorna AutoEngine con i valori letti dall'hardware.

## Classificazione dei nodi

| Gruppo | Esempi | Ruolo |
| --- | --- | --- |
| `in_` | `in_sensor` | Legge valori dall'hardware tramite SyncEngine |
| `out_` | `out_logic_or`, `out_thermostat` | Produce output verso l'hardware tramite SyncEngine |
| `node_` | `node_manual_target`, `node_manual_value_by_url` | Input da utente o sistemi esterni — nessun hardware |
| `proxy_` | `proxy_mirror`, `proxy_inverter` | Copia/trasforma il valore di un altro nodo — può avere hardware |
| `fake` | `fake` | Placeholder strutturale senza logica |

## Principio architetturale

> AutoEngine è **pura logica** — non conosce l'hardware e non lo comanda direttamente. È il cervello del sistema; IoT è il corpo; l'Actuator interno è il sistema nervoso che li collega.

## Posizione nel sistema KH Levite

```
[ Sistemi esterni ]          [ Hardware fisico ]
  (Google Calendar,            (Shelly, sensori...)
   API setpoint, ...)                 │
         │                            │
         ▼                            ▼
  ┌─── AutoEngineModule ──────────────────────┐
  │  LogicEngineSolverBusiness (logica nodi)  │
  │  LogicEngineActuatorBusiness (sync)  ◄────┼──►  [ IoT ]
  └───────────────────────────────────────────┘     (I/O hw)
```

I nodi `in_sensor` ricevono `actual_value` dall'Actuator (READ da IoT).
I nodi `out_*` e `proxy_*` con `iotComponentId` scrivono verso l'Actuator (WRITE su IoT).

## Documentazione

- [Modello dati](data-model.md)
- [Grafo dei nodi e dipendenze](node-graph.md)
- [Strategy pattern e categorie](strategy-pattern.md)
- [Strategy catalog — implementazioni](strategy-catalog.md)
- [Logic Engine — ciclo di esecuzione](logic-engine.md)
- [Actuator — sincronizzazione AutoEngine ↔ IoT](actuator.md)
- [REST API](rest-api.md)
