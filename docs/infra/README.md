# KH Levite — Modulo InfraModule

InfraModule è il modulo infrastrutturale di KH Levite. Non appartiene a un dominio funzionale
specifico — raccoglie i servizi trasversali che supportano tutti gli altri moduli.

Contiene due componenti:

**1. Configuration**
Gestione delle configurazioni globali dell'applicativo. Permette di configurare parametri di
sistema (intervalli di ciclo, retention, flag di comportamento) senza modificare il codice.
Le configurazioni sono raggruppate per sezione e tipizzate (`boolean`, `integer`, `float`, `text`).

**2. ProcessLog**
Registrazione e monitoraggio dei log di esecuzione dei processi continui (LogicEngine, Actuator,
TelemetryPolling). Fornisce statistiche aggregate (media durata, success rate, ciclo più lento)
e gestisce la retention automatica dei log vecchi.

## Principio architetturale

> InfraModule è pura infrastruttura trasversale. Non dipende da nessun modulo di dominio —
> è gli altri moduli che dipendono da lui.

## Dipendenze

InfraModule **non dipende** da AutoEngineModule né da IotModule.

Tutti gli altri moduli importano InfraModule per accedere a `ProcessLogBusiness` e `ConfigurationBusiness`.

## Documentazione

- [Modello dati](data-model.md)
