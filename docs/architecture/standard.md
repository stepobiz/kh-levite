# Standard Architetturale — KH Levite

> Autore: Catello Stefano Cavallaro
> Derivato da esperienza Spring Boot / JHipster, adattato a NestJS.

---

## Filosofia

Ogni modulo NestJS è piccolo, concentrato su un solo dominio, e potenzialmente estraibile
come microservizio autonomo. La struttura a layer rende espliciti i confini e le regole di
dipendenza — la cartella stessa comunica il contratto.

---

## Struttura di un modulo

```
modulo/
  dto/                    ← contratti pubblici del modulo (input/output)
  business/
    entity/               ← per ogni entità: business + repository + mapper (se presente)
      foo.business.ts
      foo.repository.ts
      foo.mapper.ts
    <dominio>/            ← subfolder per gruppi di file correlati (es. node-strategy/, protocol-driver/)
    foo-process.business.ts  ← business di processo (flat in business/)
  web/
    rest/                 ← controller HTTP
  process/                ← loop runner (OnModuleInit + while true)
  modulo.module.ts
```

### Regole sulla struttura

- `business/entity/` raccoglie sempre: il business, il repository e il mapper (se esiste) di ogni entità.
  Sono co-locati perché il business possiede il proprio repository — separati fisicamente non aggiunge valore.
- I business di processo (logic engine, polling, attuazione) stanno **flat** in `business/` con nome verboso
  (es. `logic-engine-solver.business.ts`).
- Subfolders tematici in `business/` (es. `node-strategy/`, `protocol-driver/`) raccolgono
  pattern tecnici riutilizzati da più business dello stesso modulo.
- `web/` è fissa anche se si implementa solo REST — garantisce uniformità e lascia spazio a
  futuri canali senza ristrutturare.
- `process/` contiene solo i loop runner — non contengono logica, chiamano sempre Business.

---

## Layer e dipendenze

```
web/rest (Controller)
    ↓
process (Loop Runner)
    ↓
Business (entity o processo)
    ↓
Repository  +  Mapper
    ↓
  Prisma
```

### Repository
- Conosce solo Prisma. Riceve e restituisce entity Prisma o tipi `Prisma.*Input`.
- Nessuna logica applicativa.

### Mapper
- Converte entity Prisma ↔ DTO.
- Nessuna logica applicativa.

### Business
- Riceve e restituisce **solo DTO**.
- Contiene tutta la logica: orchestrazione, regole di dominio, validazioni.
- Inietta solo Repository e Mapper del proprio modulo (o Business di altri moduli per dipendenze cross-module).
- **Mai** inietta Repository di altri moduli.

### Controller (`web/rest`)
- Riceve request HTTP, chiama Business, restituisce DTO.
- Nessuna logica applicativa.

### Process (loop runner)
- Avvia un loop continuo in `onModuleInit()`.
- Chiama Business, scrive ProcessLog, emette eventi realtime.
- **Non contiene logica** — delega tutto al Business corrispondente.
- Legge configurazioni (intervallo ciclo, enabled) tramite PrismaService direttamente
  (eccezione documentata — vedi sotto).

---

## Comunicazione tra moduli

I moduli comunicano esclusivamente tramite i rispettivi **Business** esportati e i **DTO**.
Un modulo non importa mai il Repository, il Mapper o i file interni di un altro modulo.

### Grafo delle dipendenze (attuale)

```
auto-engine ──→ infra
auto-engine ──→ iot
iot         ──→ infra
infra       ──→ (nessun modulo di dominio)
```

Nessuna dipendenza circolare. `infra` è pura infrastruttura trasversale.

### Exports dei moduli

| Modulo | Esporta |
|---|---|
| `AutoEngineModule` | `NodeBusiness` |
| `IotModule` | `DeviceComponentBusiness`, `TelemetryLogBusiness` |
| `InfraModule` | `ProcessLogBusiness`, `ConfigurationBusiness` |

---

## Eccezioni documentate

| Punto | Eccezione | Motivazione |
|---|---|---|
| Process runner | Inietta `PrismaService` direttamente per leggere `cfg_configuration` | Evita dipendenza circolare infra↔modulo per un'operazione di sola lettura su una tabella di configurazione. Accettabile finché non si crea un servizio di configurazione globale. |
