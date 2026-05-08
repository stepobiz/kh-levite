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

---

## Note tecniche

### `prisma db push` vs `migrate deploy`

Lo startup usa `prisma db push` invece di `prisma migrate deploy` perché alcune modifiche di schema sono state applicate con `db push` in sviluppo senza una migration corrispondente. `db push` sincronizza sempre lo schema completo da `schema.prisma` senza perdita di dati su database esistenti.

### Path `dist/src/main.js`

NestJS compila in `dist/src/main.js` (non `dist/main.js`) perché `prisma.config.ts` nella root del progetto fa inferire a TypeScript un `rootDir` più alto di `src/`.

### `better-sqlite3` (binario nativo)

`better-sqlite3` è una libreria C++ compilata in un file `.node` specifico per OS + architettura + versione Node. Il Dockerfile ricompila il binario nel production stage per garantire compatibilità con Alpine Linux.

### Build dell'immagine (per maintainer)

```bash
docker build -t stepobiz/kh-levite:X.Y -t stepobiz/kh-levite:latest .
docker push stepobiz/kh-levite:X.Y
docker push stepobiz/kh-levite:latest
```
