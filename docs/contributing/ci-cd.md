# CI/CD — GitHub Actions + Docker Hub

## Panoramica

Il progetto usa GitHub Actions per il build e la pubblicazione automatica dell'immagine Docker su Docker Hub.

Il workflow si trova in [`.github/workflows/docker.yml`](../../.github/workflows/docker.yml).

## Trigger

| Evento | Condizione | Cosa pubblica |
| --- | --- | --- |
| Push su `main` | Sempre | `latest` |
| Push di un tag | Tag numerico (es. `0.3`, `1.0.0`) | `latest` + tag versione |
| `workflow_dispatch` | Manuale da GitHub UI | `latest` |

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

```bash
git flow release start X.Y
# eventuale bump version
git flow release finish X.Y
git push origin main develop --tags
```

Il push del tag su `main` fa partire automaticamente il build con il tag versione.
