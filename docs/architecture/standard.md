# Standard Architetturale — KH Levite

> Autore: Catello Stefano Cavallaro
> Derivato da esperienza Spring Boot / JHipster, adattato a NestJS.
> Verificato su codice reale nel branch `newstandard`.

---

## Filosofia

Ogni modulo NestJS è piccolo, concentrato su un solo dominio, e potenzialmente estraibile
come microservizio autonomo. La struttura a layer orizzontali rende espliciti i confini
e le regole di dipendenza — la cartella stessa comunica il contratto.

---

## Struttura di un modulo

```
modulo/
  dto/              ← contratti pubblici del modulo (input/output verso l'esterno)
  repository/       ← accesso al dato, solo logiche sul dato (Prisma)
  business/         ← logica applicativa, orchestrazione, regole di dominio
  mapper/           ← conversione entity (Prisma) ↔ DTO
  web/
    rest/           ← controller HTTP
    ws/             ← gateway WebSocket (se presente)
    graphql/        ← resolver GraphQL (se presente)
  process/          ← cron job, worker, processor background
  modulo.module.ts
```

La cartella `web/` è fissa anche se si implementa solo REST — garantisce uniformità
tra tutti gli applicativi e lascia spazio a futuri canali senza ristrutturare.

---

## Regole di dipendenza

```
Controller / Process / Altri moduli
        ↓  (solo DTO)
    Business
        ↓  (entity Prisma via Mapper)
    Repository
        ↓
      Prisma
```

### Repository
- Conosce solo Prisma. Riceve e restituisce entity Prisma o tipi `Prisma.*Input`.
- Può contenere validazioni/correzioni sul dato (es. impostare `updatedAt`, normalizzare valori).
- Non contiene logica applicativa.

### Mapper
- Converte entity Prisma → DTO (per restituire dati al business).
- Converte DTO → `Prisma.*Input` (per passare dati al repository).
- Non contiene logica applicativa.
- Il business non conosce la struttura Prisma direttamente — passa sempre dal mapper.

### Business
- Riceve e restituisce **solo DTO**.
- Conosce la struttura Prisma **tramite il mapper** — non istanzia mai oggetti Prisma direttamente.
- Contiene tutta la logica applicativa: orchestrazione, regole di dominio, validazioni di business.
- È l'unico layer che può chiamare altri moduli (tramite i loro Business, via DTO).

### Controller (web/rest)
- Riceve request HTTP, chiama Business, restituisce DTO.
- Può contenere logiche di accesso/autenticazione/autorizzazione.
- Non contiene logica applicativa.

### Process (cron / worker)
- Chiama **sempre** Business, mai Repository direttamente.
- Lavora solo con DTO.

---

## Comunicazione tra moduli

I moduli comunicano tra loro esclusivamente tramite i rispettivi **Business** e **DTO**.
Un modulo non importa mai il Repository o il Mapper di un altro modulo.

---

## Eccezioni documentate

| Punto | Eccezione | Motivazione |
|---|---|---|
| *(nessuna ancora)* | | |

Le eccezioni vanno aggiunte qui man mano che emergono durante il refactor,
con motivazione esplicita. Se un'eccezione si ripete diventa regola.
