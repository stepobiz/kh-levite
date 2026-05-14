# Todo — Refactor sospesi

Elementi identificati ma non ancora corretti. Da affrontare in sessioni future.

*(Nessun debito tecnico aperto al momento)*

---

## Risolti

| Item | Risolto in |
|---|---|
| `iot.module.ts` esportava `DeviceComponentRepository`, `TelemetryLogRepository` | refactor-process-business-split |
| `auto-engine.module.ts` esportava `NodeRepository`, `NodeService` | refactor-module-structure |
| `infra/sync` iniettava repository IoT direttamente | refactor-business-naming-and-sync-relocation |
| AutoEngine strutturato per feature-folder invece che per layer | refactor-module-structure |
| Process runner con logica mista (loop + logica di dominio) | refactor-process-business-split |
