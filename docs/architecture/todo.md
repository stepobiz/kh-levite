# Todo — Refactor sospesi

Elementi identificati ma non ancora corretti. Da affrontare in sessioni future.

---

## [STANDARD] I moduli non devono esportare Repository

**Regola:** un modulo NestJS deve esportare solo i suoi Business (o Service di processo).
I Repository sono un dettaglio implementativo interno — nessun modulo esterno deve poterli iniettare direttamente.

**Violazioni attive:**
- `iot.module.ts` → `exports: [DeviceComponentRepository, TelemetryLogRepository]`
  *(dipende da `infra/sync` — vedi todo dedicato sotto)*
- `auto-engine.module.ts` → `exports: [NodeRepository, NodeService]`
  *(da analizzare chi consuma `NodeRepository` dall'esterno e perché)*

**Soluzione generale:** per ciascuna violazione, identificare il consumatore, farlo passare dal Business corrispondente, poi rimuovere l'export del Repository.

---

## [IOT] TelemetryCronService accede a PrismaService direttamente per la configurazione

**File:** `src/iot/process/telemetry-cron.service.ts`
**Metodi:** `getCfg()` e `getCfgBool()`
**Problema:** il cron service legge `cfg_configuration` tramite `PrismaService` direttamente,
bypassando il modulo `infra/cfg` e il suo service.
**Soluzione:** iniettare `ConfigurationService` (o equivalente) dal modulo infra e delegare a lui.
**Dipendenza:** verificare che `InfraModule` esporti un service per la configurazione accessibile da IoT.

---

## [IOT] infra/sync bypassa il Business e usa Repository direttamente

**File:** `src/infra/sync/sync.service.ts`
**Problema:** inietta `DeviceComponentRepository` e `TelemetryLogRepository` direttamente
dal modulo IoT, bypassando `DeviceComponentBusiness` e `TelemetryLogBusiness`.
Per questo motivo `iot.module.ts` esporta ancora i repository — export che viola lo standard
(un modulo dovrebbe esportare solo i suoi Business, non i Repository).
**Soluzione:** `sync.service.ts` deve usare i Business. Poi rimuovere l'export dei repository da `iot.module.ts`.
**Dipendenza:** da fare dopo aver analizzato sync.service.ts per capire cosa fa esattamente.

---

## [AUTO-ENGINE] Ristrutturazione da feature-folders a layer orizzontali

**Modulo:** `src/auto-engine/`
**Problema:** struttura organizzata per feature (node/, node-type/, attribute-type/, tag/, logic-engine/)
invece che per layer (business/, repository/, dto/, mapper/, web/rest/, process/).
**Soluzione:** riorganizzare seguendo lo stesso schema del modulo `iot/`.
**Nota:** verificare che logic-engine/ (strategies, cron) trovi una collocazione coerente nel nuovo schema.
**Dipendenza:** da fare dopo aver finalizzato e validato il refactor di IoT.
