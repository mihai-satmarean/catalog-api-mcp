# Git Synchronization Setup - catalog-api-mcp

## Overview

Repository-ul este sincronizat intre GitHub si GitLab:
- **GitHub**: github.com/mihai-satmarean/catalog-api-mcp (pentru obot.ai catalog)
- **GitLab**: gitlab.com/pulse-quantum-ai/catalog-api-mcp (repository principal)

## Configuratie Actuala

### Remote-uri Configure

```bash
origin (fetch): git@github.com:mihai-satmarean/catalog-api-mcp.git
origin (push):  git@github.com:mihai-satmarean/catalog-api-mcp.git
origin (push):  git@gitlab.com:pulse-quantum-ai/catalog-api-mcp.git
gitlab (fetch): git@gitlab.com:pulse-quantum-ai/catalog-api-mcp.git
gitlab (push):  git@gitlab.com:pulse-quantum-ai/catalog-api-mcp.git
```

## Workflow

### Push Automat la Ambele Remote-uri

Cand faci push la origin, codul va merge automat la ambele repository-uri:

```bash
git push origin main
# Push-uieste la:
# - GitHub: github.com/mihai-satmarean/catalog-api-mcp
# - GitLab: gitlab.com/pulse-quantum-ai/catalog-api-mcp
```

### Push Explicit la un Singur Remote

Daca vrei sa push-uiesti doar la unul:

```bash
# Doar la GitHub
git push git@github.com:mihai-satmarean/catalog-api-mcp.git main

# Doar la GitLab
git push gitlab main
```

## Branches Sincronizate

- **main**: Branch principal cu cod stabil
- **mihais_progress_bmac**: Branch de dezvoltare
- **sync-from-github**: Branch temporar pentru sincronizare initiala

## Merge Request Initial

Un merge request a fost creat pentru sincronizarea initiala:
- **URL**: https://gitlab.com/pulse-quantum-ai/catalog-api-mcp/-/merge_requests/1
- **Status**: Waiting for approval
- **Action Required**: Accepta merge request-ul pentru a sincroniza main branch-ul

### Acceptare Merge Request

1. Acceseaza: https://gitlab.com/pulse-quantum-ai/catalog-api-mcp/-/merge_requests/1
2. Review changes
3. Click "Merge" pentru a accepta

Dupa merge, branch-ul main de pe GitLab va fi complet sincronizat cu GitHub.

## Comenzi Utile

### Verifica Status Remote-uri

```bash
git remote -v
```

### Verifica Status Branches

```bash
git branch -a
```

### Fetch de la Toate Remote-urile

```bash
git fetch --all
```

### Pull de la GitHub

```bash
git pull origin main
```

### Pull de la GitLab

```bash
git pull gitlab main
```

## Protected Branch pe GitLab

Branch-ul main este protected pe GitLab. Pentru modificari directe:

1. Creeaza un branch nou
2. Push la GitLab
3. Creeaza merge request
4. Accepta merge request

Sau:

1. Disable protected branch temporar (Project Settings > Repository > Protected Branches)
2. Push direct
3. Re-enable protected branch

## Troubleshooting

### Force Push Rejected

Daca primesti eroare la force push:

```bash
# Branch-ul este protected pe GitLab
# Solutie: Push pe un branch nou si fa merge request
git push gitlab main:feature-branch
```

### Push Fails la Unul din Remote-uri

Daca push-ul esueaza la unul din remote-uri, poti push manual:

```bash
# Verifica ce a esuat
git push origin main -v

# Push separat la cel care a esuat
git push gitlab main
```

### Verificare Sincronizare

```bash
# Compara branches
git log origin/main..gitlab/main
git log gitlab/main..origin/main
```

## Why Two Repositories?

- **GitHub**: Necesar pentru obot.ai catalog (obot.ai ia MCP servers din GitHub)
- **GitLab**: Repository principal pentru dezvoltare (pulse-quantum-ai organization)

## Auto-Sync Configuration

Repository-ul este configurat pentru auto-sync la ambele remote-uri:

```bash
# Verificare configuratie
git config --local --get-all remote.origin.url

# Output:
# git@github.com:mihai-satmarean/catalog-api-mcp.git (fetch)
# git@github.com:mihai-satmarean/catalog-api-mcp.git (push)
# git@gitlab.com:pulse-quantum-ai/catalog-api-mcp.git (push)
```

## Maintenance

### Rotire Credentiale SSH

Daca schimbi SSH keys, actualizeaza:
1. GitHub SSH keys
2. GitLab SSH keys
3. Local SSH agent

### Verificare Periodica

```bash
# Lunar: Verifica sincronizarea
git fetch --all
git log --all --decorate --oneline --graph
```

## Contact

- Setup by: Mihai Satmarean
- Date: 2026-01-26
- GitLab Organization: pulse-quantum-ai
- GitHub User: mihai-satmarean
