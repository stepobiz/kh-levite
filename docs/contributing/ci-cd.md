# CI/CD — GitHub Actions + Docker Hub

## Panoramica

Il progetto usa GitHub Actions per il build e la pubblicazione automatica dell'immagine Docker su Docker Hub.

Il workflow si trova in [`.github/workflows/docker.yml`](../../.github/workflows/docker.yml).

## Trigger

| Evento | Condizione | Cosa pubblica |
| --- | --- | --- |
| Push di un tag | Tag numerico stabile (es. `0.3`, `1.0.0`) | `latest` + tag versione |
| Push di un tag | Tag release candidate (es. `0.10.0-rc1`) | solo tag versione, **non** tocca `latest` |
| `workflow_dispatch` | Manuale da GitHub UI | `latest` |

Il pattern del trigger (`tags: ['[0-9]+.[0-9]+*']`) matcha già qualsiasi suffisso, incluse le RC — non richiede modifiche per pubblicare release candidate.

## Immagine Docker

Repository: [`stepobiz/kh-levite`](https://hub.docker.com/r/stepobiz/kh-levite)

## Secrets richiesti

Configurati in **GitHub → Repository → Settings → Secrets → Repository secrets**:

| Secret | Contenuto |
| --- | --- |
| `DOCKER_USERNAME` | Username Docker Hub (es. `stepobiz`) |
| `DOCKER_PASSWORD` | Token Docker Hub con scope **Read / Write / Delete** |

> Usare un **Access Token** Docker Hub, non la password dell'account. Il token deve avere i permessi Read, Write e Delete — il permesso Delete è necessario per l'aggiornamento della descrizione Docker Hub tramite API.

## Step del workflow

1. **Checkout** del codice
2. **Docker metadata** — genera i tag dell'immagine in base al branch/tag git
3. **Login** a Docker Hub con le credenziali da secret
4. **Build and push** — costruisce l'immagine e la pubblica
5. **Update Docker Hub description** — aggiorna la pagina Docker Hub con il contenuto di `docs/docker-hub.md`

## Aggiungere un nuovo trigger

Per triggerare manualmente un build senza fare un commit, usare **GitHub → Actions → Docker Build & Push → Run workflow**.

## Rilasciare una nuova versione

Per rilasci diretti senza fase di test (fix minori, hotfix già validati):

```bash
git flow release start X.Y
# eventuale bump version
git flow release finish X.Y
git push origin main develop --tags
```

Il push del tag su `main` fa partire automaticamente il build con il tag versione e aggiorna `latest`.

## Release candidate (RC)

Per rilasci che richiedono un giro di test su stage prima di andare in produzione:

```bash
git flow release start X.Y.Z
# bump package.json → "X.Y.Z-rc1"
git add package.json && git commit -m "chore: bump version to X.Y.Z-rc1"
git tag X.Y.Z-rc1
git push origin release/X.Y.Z X.Y.Z-rc1
```

Il push del tag `X.Y.Z-rc1` fa partire il build e pubblica `stepobiz/kh-levite:X.Y.Z-rc1` **senza** toccare `latest`. Si punta temporaneamente il `docker-compose.yml` di stage a quel tag per il test. Se serve un altro giro, si ripete con `X.Y.Z-rc2` sullo stesso branch di release.

Quando la RC è validata, si chiude il rilascio normalmente:

```bash
# bump package.json → "X.Y.Z" (rimuovere suffisso -rcN)
git add package.json && git commit -m "chore: bump version to X.Y.Z"
git flow release finish X.Y.Z
git push origin main develop --tags
```

Questo mergia in `main`+`develop`, tagga `X.Y.Z` e aggiorna `latest`.
