# Deploy con Docker Compose

Guida passo-passo per mettere in produzione kh-levite su qualsiasi macchina con Docker.

---

## Prerequisiti

- Docker Engine installato sull'host
- Porta `3000` aperta nella rete locale

---

## 1. Crea la cartella di lavoro

```bash
mkdir -p ~/kh-levite/data
cd ~/kh-levite
```

Il database SQLite viene mantenuto nel volume `./data` — non viene mai toccato dagli aggiornamenti dell'immagine.

---

## 2. Crea il file docker-compose.yml

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

---

## 3. (Opzionale) Importa un database esistente

Se vuoi portare i dati da un altro ambiente (es. sviluppo → produzione):

```bash
cp /percorso/sorgente/dev.db ~/kh-levite/data/kh-levite.db
```

Se la cartella `data/` è vuota, il container crea automaticamente un database vuoto al primo avvio.

---

## 4. Avvia

```bash
docker compose pull && docker compose up -d
```

L'app è raggiungibile su `http://IP-HOST:3000`.
La documentazione API Swagger è su `http://IP-HOST:3000/api`.

---

## Aggiornare a una nuova versione

```bash
docker compose pull && docker compose up -d
```

Docker scarica la nuova immagine `latest`, ricrea il container e riavvia il servizio.
Il database nel volume `./data` non viene toccato.

---

## Versioni disponibili

Le versioni stabili sono taggate su Docker Hub come `stepobiz/kh-levite:X.Y`.
Il tag `latest` punta sempre all'ultima versione stabile.
