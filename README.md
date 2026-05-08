# kh-levite

Backend per la gestione e automazione di impianti IoT in ambienti locali.
Progettato per il deploy containerizzato su rete locale, senza dipendenze da cloud esterni.

Costruito con **NestJS**, **Prisma** (SQLite), **WebSocket** e **Docker**.

---

## Funzionalità

- Gestione dispositivi IoT e componenti hardware
- Driver modulari per protocolli eterogenei (Shelly HTTP, Sonoff DIY, MQTT...)
- Engine di automazione basato su nodi logici configurabili
- Log di telemetria con storico e aggiornamenti real-time via WebSocket
- API REST completamente documentata con Swagger (`/api`)

---

## Quick start — Deploy con Docker

Crea la cartella di lavoro sulla macchina host:

```bash
mkdir -p ~/kh-levite/data
cd ~/kh-levite
```

Crea il file `docker-compose.yml`:

```yaml
services:
  kh-levite:
    image: stepobiz/kh-levite:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      DATABASE_URL: file:/app/data/kh-levite.db
      NODE_ENV: production
    restart: unless-stopped
```

Avvia:

```bash
docker compose pull && docker compose up -d
```

L'app è raggiungibile su `http://IP-HOST:3000`.

> Per aggiornare a una nuova versione: `docker compose pull && docker compose up -d`

Guida completa → [docs/deployment/docker-compose.md](docs/deployment/docker-compose.md)

---

## Sviluppo locale

```bash
npm install
npx prisma db push
npm run start:dev
```

---

## Architettura

Il progetto segue una struttura a layer orizzontali (ispirata a Spring Boot / JHipster):

```
web/rest/     → Controller HTTP
process/      → Cron e processi asincroni
business/     → Logica applicativa, orchestrazione di più repository
repository/   → Accesso dati via Prisma
mapper/       → Traduzione entity ↔ DTO
dto/          → Oggetti di trasferimento dati (boundary pubblico del modulo)
```

Documentazione completa → [docs/architecture/standard.md](docs/architecture/standard.md)

---

## Contribuire — Nuovi driver IoT

kh-levite supporta qualsiasi dispositivo tramite driver intercambiabili.
Se vuoi aggiungere il supporto per un nuovo protocollo o dispositivo, segui la guida:

→ [docs/contributing/new-driver.md](docs/contributing/new-driver.md)

I driver esistenti si trovano in `src/iot/device-driver/`.

---

## Autore

Stefano Cavallaro — contributi benvenuti tramite Pull Request.

---

## Licenza

Da definire.
