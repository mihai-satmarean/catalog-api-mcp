# Scripts

Acest folder conține script-uri helper pentru management-ul proiectului.

## set-github-secrets.sh

Script pentru setarea automată a secretelor GitHub din fișierul `.env`.

### Prerequisite

1. **GitHub CLI** trebuie instalat și autentificat:
   ```bash
   # Instalare GitHub CLI (macOS)
   brew install gh
   
   # Sau pe Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh
   
   # Autentificare
   gh auth login
   ```

2. **Fișierul .env** trebuie creat și completat:
   ```bash
   cp .env.example .env
   # Editează .env cu valorile reale
   ```

### Utilizare

```bash
# Din root-ul proiectului
./scripts/set-github-secrets.sh
```

Script-ul va:
1. Verifica dacă `gh` CLI este instalat
2. Detecta automat repository-ul GitHub curent
3. Citi secretele din `.env`
4. Seta fiecare secret în GitHub Actions

### Secretele setate

- `NGROK_AUTHTOKEN` - Token de autentificare Ngrok
- `NGROK_DOMAIN` - Domeniu custom Ngrok
- `KUBECONFIG_K3S_DEV` - Kubeconfig K3s (base64 encoded)
- `MIDOCEAN_TEST_API_KEY` - API key MidOcean (test)
- `MIDOCEAN_PROD_API_KEY` - API key MidOcean (production)
- `XD_CONNECTS_PRODUCT_DATA_URL` - URL pentru date XD Connects

### Verificare

După rulare, verifică secretele la:
```
https://github.com/mihai-satmarean/catalog-api-mcp/settings/secrets/actions
```
