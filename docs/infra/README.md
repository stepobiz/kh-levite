# KH Levite — Modulo InfraModule

InfraModule è il modulo infrastrutturale di KH Levite. Non appartiene a un dominio funzionale specifico — raccoglie i servizi trasversali che supportano tutti gli altri moduli.

Contiene tre componenti:

**1. Configuration**
Gestione delle configurazioni globali dell'applicativo. Permette di configurare parametri di sistema (intervalli di ciclo, retention, flag di comportamento) senza modificare il codice. Le configurazioni sono raggruppate per sezione e tipizzate (`boolean`, `integer`, `float`, `text`).

**2. ProcessLog**
Registrazione e monitoraggio dei log di esecuzione dei processi continui (Logic Engine, Sync Engine). Fornisce statistiche aggregate (media durata, success rate, ciclo più lento) e gestisce la retention automatica dei log vecchi.

**3. SyncEngine**
Processo continuo che sincronizza lo stato tra il modulo AutoEngine e il modulo IoT. Legge `actual_value` dai nodi AutoEngine e lo propaga verso i component IoT (WRITE), e legge i valori hardware dai log di telemetria IoT e li aggiorna sui nodi AutoEngine (READ).

## Principio architetturale

> InfraModule è il collante tra i moduli dominio. Non contiene logica di business — fornisce infrastruttura condivisa.

## Dipendenze

InfraModule dipende da:

- **AutoEngineModule** — per leggere/scrivere `actual_value` dei nodi
- **IoTModule** — per leggere telemetria e scrivere `next_value` sui component

Tutti gli altri moduli possono dipendere da InfraModule per leggere le configurazioni.

## Documentazione

- [Modello dati](data-model.md)
- [SyncEngine — processo di sincronizzazione](sync-engine.md)
