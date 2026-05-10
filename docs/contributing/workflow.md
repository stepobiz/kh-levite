# Workflow — Git Flow

Il progetto usa **git-flow** per la gestione dei branch.

## Branch principali

| Branch | Scopo |
| --- | --- |
| `main` | Codice in produzione. Ogni merge su main trigga il build Docker su Docker Hub. |
| `develop` | Branch di integrazione. Qui si mergia tutto il lavoro prima del rilascio. |

## Branch temporanei

| Prefisso | Creato da | Mergiato in | Scopo |
| --- | --- | --- | --- |
| `feature/` | `develop` | `develop` | Nuove funzionalità |
| `release/` | `develop` | `main` + `develop` | Preparazione al rilascio (bump version, fix minori) |
| `hotfix/` | `main` | `main` + `develop` | Fix urgenti in produzione |
| `bugfix/` | `develop` | `develop` | Fix di bug non urgenti |

## Comandi base

### Iniziare una feature

```bash
git flow feature start nome-feature
# lavora...
git flow feature finish nome-feature
```

### Fare un rilascio

```bash
git flow release start 1.2.0
# bump version, fix minori...
git flow release finish 1.2.0
# crea tag v1.2.0 su main, mergia in develop
git push origin main develop --tags
```

Il push su `main` con il tag numerico trigga il build Docker che pubblica l'immagine con il tag versione su Docker Hub.

### Hotfix urgente

```bash
git flow hotfix start fix-descrizione
# fix...
git flow hotfix finish fix-descrizione
git push origin main develop --tags
```

## Tag di versione

I tag seguono il formato `MAJOR.MINOR` o `MAJOR.MINOR.PATCH` (es. `0.3`, `1.0.0`).

Il workflow CI/CD pubblica su Docker Hub:
- `latest` — ad ogni push su `main`
- `X.Y` o `X.Y.Z` — quando il push include un tag numerico

## Configurazione git-flow locale

```bash
git flow init -d
```

Usa le impostazioni predefinite (`main` come branch di produzione, `develop` come branch di integrazione, prefissi standard).
