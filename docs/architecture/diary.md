# Diario di lavoro — Architettura

---

## Sessione 2026-05-06

### Contesto
Confronto tra struttura del modulo `iot/` (layer orizzontali) e `auto-engine/` (feature folders).
Stefano preferisce la struttura a layer del modulo IoT, derivata dalla sua esperienza
con Spring Boot / JHipster. La scelta è stata verificata e validata come coerente.

### Decisioni prese

**La struttura di riferimento è `iot/`.**
Il modulo `auto-engine/` va ristrutturato per seguire lo stesso schema.

**I process passano sempre dal Business, mai dai Repository.**
`TelemetryProcessor` viola questo principio (vedi debiti tecnici).

**Il mapper è un layer esplicito**, non inline nel business.
Motivo: il business non deve conoscere la struttura Prisma direttamente.
Il mapper è l'unico punto di traduzione entity ↔ DTO.

**`web/rest/` è intenzionale anche se ridondante.**
Struttura fissa per uniformità tra tutti gli applicativi di Stefano.
In alcuni moduli esisteranno anche `web/ws/` e `web/graphql/`.

### Debiti tecnici trovati e corretti

#### `TelemetryProcessor` bypassa il Business — CORRETTO
- **File:** `src/iot/process/telemetry-processor.ts`
- **Problema:** chiamava `DeviceComponentRepository` e `TelemetryLogRepository` direttamente.
  Accedeva a campi Prisma entity crudi. Non era `@Injectable()`, veniva istanziato con `new`.
- **Soluzione applicata:**
  - Aggiunto `@Injectable()`, inserito in `providers` di `IotModule`
  - Inietta `DeviceComponentBusiness` e `TelemetryLogBusiness` via DI
  - Lavora esclusivamente con DTO
  - `DeviceComponentDto` ampliato con `nextValue` e `nextValueUpdatedAt` (con `@ApiHideProperty()`)
  - `DeviceComponentMapper.toDto()` mappa i due nuovi campi

#### `device.controller.ts` — `ParseIntPipe` mancante — CORRETTO
- Aggiunto `ParseIntPipe` su `findById`, `update`, `delete`

#### `device.repository.ts` — import inutilizzato — CORRETTO
- Rimosso import di `IotDevice` non usato

### Debiti tecnici sospesi (→ `todo.md`)

- `TelemetryCronService.getCfg/getCfgBool` usa `PrismaService` direttamente invece di `ConfigurationService`
- `infra/sync/sync.service.ts` inietta repository IoT direttamente bypassando il Business
- `auto-engine/` va ristrutturato da feature-folders a layer orizzontali

### Verifica compilazione

`npx tsc --noEmit` — unico errore in `app.controller.spec.ts` (file di test, non codice applicativo). Il codice del modulo IoT compila senza errori.

### Prossimi passi

1. Risolvere i debiti sospesi in `todo.md` (da fare in sessioni future)
2. Ristrutturare `auto-engine/` seguendo lo stesso schema di `iot/`
3. Portare `standard.md` su Confluence come ADR ufficiale
