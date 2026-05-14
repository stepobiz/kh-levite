# kh-levite — Contesto per Claude Code

## Cos'è questo progetto

Backend IoT e automazione per ambienti locali. NestJS · Prisma (SQLite) · WebSocket · Docker.
Autore: Catello Stefano Cavallaro. Licenza: MIT.
GitHub: https://github.com/stepobiz/kh-levite
Docker Hub: stepobiz/kh-levite

## Documentazione completa

Tutta la documentazione è in `docs/`. Leggila prima di rispondere a domande architetturali.

| Modulo | Dove |
| --- | --- |
| IoT | `docs/iot/` — README, data-model, rest-api, telemetry-process, next-value |
| AutoEngine | `docs/auto-engine/` — README, data-model, node-graph, strategy-pattern, strategy-catalog, logic-engine, actuator, rest-api |
| InfraModule | `docs/infra/` — README, data-model |
| Architettura | `docs/architecture/standard.md` — regole layer, dipendenze |
| Deploy | `docs/deployment/docker-compose.md` |
| Contributing | `docs/contributing/` — new-driver, workflow (git-flow), ci-cd |

## Stack

- NestJS + TypeScript
- Prisma ORM + SQLite (`prisma/schema.prisma`)
- WebSocket (realtime)
- Swagger su `/api`
- Docker — immagine `stepobiz/kh-levite`

## Regole architetturali — CRITICHE

Leggi `docs/architecture/standard.md` per il dettaglio completo. Regole da non violare mai:

**Layer order:** `web/rest` → `Business` → `Repository` → `Prisma`

**Business (entity):**
- Inietta solo Repository e Mapper del proprio modulo — MAI Repository di altri moduli
- Riceve e restituisce solo DTO
- È l'unico layer che orchestra più repository (es. delete in cascade)

**Business (process):**
- Può iniettare Business (entity o process) di altri moduli per dipendenze cross-module
- MAI inietta Repository di altri moduli

**Repository:**
- Non importa altri Repository
- Conosce solo Prisma — entity e `Prisma.*Input`

**Module exports:**
- I moduli esportano solo i Business, mai i Repository

**DTO:**
- `nextValue` e `nextValueUpdatedAt` non compaiono MAI nei DTO pubblici
- Vedi `docs/iot/next-value.md` e `src/iot/dto/processor-component-view.ts`

## Struttura di un modulo

```
modulo/
  dto/
  business/
    entity/         ← business + repository + mapper per entità (co-locati)
    <dominio>/      ← subfolders tematici (node-strategy/, protocol-driver/)
    foo-process.business.ts   ← process businesses flat in business/
  web/rest/
  process/          ← loop runners (OnModuleInit + while true)
  modulo.module.ts
```

## Git workflow

Usa **git-flow**. Branch principali: `main` (produzione) e `develop` (integrazione).

```bash
git flow feature start nome-feature   # nuova feature
git flow feature finish nome-feature  # merge in develop

git flow release start X.Y            # rilascio
git flow release finish X.Y
git push origin main develop --tags   # trigga build Docker Hub
```

Vedi `docs/contributing/workflow.md` per il dettaglio completo.

## CI/CD

Push su `main` → build automatico su Docker Hub (`stepobiz/kh-levite:latest`).
Push di un tag numerico → pubblica anche il tag versione (es. `0.3`).
Secrets richiesti su GitHub: `DOCKER_USERNAME`, `DOCKER_PASSWORD` (token Read/Write/Delete).
Vedi `docs/contributing/ci-cd.md`.

## Sviluppo locale

```bash
npm install
npx prisma db push
npm run start:dev
```

## Convenzioni di codice

- Nessun commento salvo motivazioni non ovvie
- Nessun `console.log` — usa `Logger` di NestJS
- Lingua: italiano per comunicazione, inglese per codice e nomi
- Nessuna feature in più rispetto a quanto richiesto
