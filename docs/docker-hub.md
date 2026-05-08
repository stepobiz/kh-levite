# kh-levite

Backend per la gestione e automazione di impianti IoT in ambienti locali.
Progettato per il deploy containerizzato su rete locale, senza dipendenze da cloud esterni.

**GitHub:** https://github.com/stepobiz/kh-levite
**Licenza:** MIT — Catello Stefano Cavallaro

---

## Stack

- NestJS · TypeScript
- Prisma ORM + SQLite
- WebSocket (real-time)
- Swagger/OpenAPI (`/api`)

## Funzionalità

- Gestione dispositivi IoT e componenti hardware
- Driver modulari per protocolli eterogenei (Shelly HTTP, Sonoff DIY, MQTT...)
- Engine di automazione basato su nodi logici configurabili
- Log di telemetria con aggiornamenti real-time

---

## Quick start

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

```bash
docker compose pull && docker compose up -d
```

Guida completa → https://github.com/stepobiz/kh-levite/blob/main/docs/deployment/docker-compose.md

---

## Aggiornare

```bash
docker compose pull && docker compose up -d
```

Il database nel volume `./data` non viene toccato.

---

## Contribuire — Nuovi driver IoT

Guida per aggiungere driver e inviare Pull Request:
https://github.com/stepobiz/kh-levite/blob/main/docs/contributing/new-driver.md
