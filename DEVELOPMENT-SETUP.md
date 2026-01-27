# Development Environment Setup - catalog-api-mcp

Complete guide for setting up the "Vercel-like" K3s development environment with automatic deployment from GitHub.

## Architecture Overview

```
GitHub Push (main branch)
    ↓
GitHub Actions: Build Docker image
    ↓
Push to GHCR (ghcr.io/pulse-quantum-ai/catalog-api-mcp:latest)
    ↓
Deploy to K3s (catalog-mcp-dev namespace)
    ↓
ngrok Operator creates tunnel
    ↓
Access at: https://unjestingly-unfoaled-donita.ngrok-free.dev
```

## Components

1. **K3s Cluster** (Munich Datacenter - Proxmox)
   - Master: pillar05 (10.108.111.115:6443)
   - Traefik ingress controller
   - Local-path storage provisioner

2. **ngrok Kubernetes Operator**
   - Manages tunnel lifecycle automatically
   - Ingress integration
   - Reserved domain: `unjestingly-unfoaled-donita.ngrok-free.dev`

3. **GitHub Actions**
   - Builds Docker image on push
   - Deploys to K3s automatically
   - Updates secrets and applies manifests

4. **Kubernetes Resources**
   - Namespace: `catalog-mcp-dev`
   - Deployment, Service, Ingress, PVC
   - Isolated from production

## ONE-TIME SETUP (Administrator)

### Step 1: Install ngrok Operator in K3s

**Option A: Using Ansible Playbook**

```bash
cd /Users/mihai/Documents/tech_workspace/clienti/gonkar/code/muc-dc/playbooks/k3s
ansible-playbook ngrok-operator-install.yml
```

**Option B: Manual Installation (if SSH to K3s is available)**

```bash
# SSH to K3s master
ssh -i /Users/mihai/Documents/tech_workspace/clienti/skylite/skylitestudios/siguranta/mihai_at_skylinestudios.pem root@10.108.111.115

# Run installation script
cd /tmp
# Copy ngrok-operator-install-manual.sh to server
# Or run directly:

export NGROK_API_KEY="38qy7Cjy4aft2lD1dD6mYMLcSvk_3Ht3TEP3QTN2T9hXPqYqi"
export NGROK_AUTHTOKEN="38qrwZLjX4KpX3tx6Jy4Ucfh0gq_5otuKc4cAjJEcHTNUo9Z4"

helm repo add ngrok https://charts.ngrok.com
helm repo update

helm install ngrok-operator ngrok/ngrok-operator \
  --namespace ngrok-operator \
  --create-namespace \
  --set credentials.apiKey=$NGROK_API_KEY \
  --set credentials.authtoken=$NGROK_AUTHTOKEN \
  --wait

# Verify
kubectl get pods -n ngrok-operator
kubectl get crd | grep ngrok
```

**Verification:**
```bash
kubectl get pods -n ngrok-operator
# Expected output: ngrok-operator-manager pod in Running state

kubectl get crd | grep ngrok
# Expected: Multiple CRDs (agentendpoints.ngrok.k8s.ngrok.com, domains.ngrok.k8s.ngrok.com, etc.)
```

### Step 2: Configure GitHub Secrets

Navigate to: https://github.com/pulse-quantum-ai/catalog-api-mcp/settings/secrets/actions

Add the following secrets:

1. **KUBECONFIG_K3S_DEV**
   ```bash
   # Extract kubeconfig and encode it
   ssh -i /Users/mihai/Documents/tech_workspace/clienti/skylite/skylitestudios/siguranta/mihai_at_skylinestudios.pem root@10.108.111.115 "cat /etc/rancher/k3s/k3s.yaml" | sed 's/127.0.0.1:6443/10.108.111.115:6443/' | base64
   ```
   Copy the entire base64 output and paste it as the secret value.

2. **MIDOCEAN_TEST_API_KEY**
   - Get from: `/Users/mihai/Documents/tech_workspace/clienti/mihai/misc/credentials.txt`
   - Or from existing infrastructure configuration

3. **MIDOCEAN_PROD_API_KEY**
   - Get from: `/Users/mihai/Documents/tech_workspace/clienti/mihai/misc/credentials.txt`
   - Or from existing infrastructure configuration

4. **XD_CONNECTS_PRODUCT_DATA_URL**
   - Get from: Existing infrastructure configuration
   - Or from bmac-mcp-server configuration

### Step 3: Verify ngrok Domain Reservation

1. Login to: https://dashboard.ngrok.com
2. Navigate to: **Domains**
3. Verify that `unjestingly-unfoaled-donita.ngrok-free.dev` appears in the list
4. If not present:
   - Click **New Domain**
   - Choose **Free Static Domain**
   - Reserve: `unjestingly-unfoaled-donita`
   - Select `.ngrok-free.dev` TLD

## DEVELOPER WORKFLOW (Sorin)

### Daily Development

1. **Make code changes** in `bmac-mcp-server/`
2. **Commit and push** to `main` branch
3. **GitHub Actions automatically:**
   - Builds Docker image
   - Pushes to GHCR
   - Deploys to K3s
   - ngrok operator creates tunnel
4. **Test immediately** at: https://unjestingly-unfoaled-donita.ngrok-free.dev

### Manual Deployment (if needed)

```bash
# Configure kubectl locally
export KUBECONFIG=/path/to/k3s-kubeconfig

# Apply manifests
kubectl apply -f k8s/dev/

# Force update
kubectl rollout restart deployment/catalog-mcp-dev -n catalog-mcp-dev

# Watch progress
kubectl rollout status deployment/catalog-mcp-dev -n catalog-mcp-dev
```

## TESTING AND VERIFICATION

### Health Check
```bash
curl https://unjestingly-unfoaled-donita.ngrok-free.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T..."
}
```

### MCP Endpoint Test
```bash
curl https://unjestingly-unfoaled-donita.ngrok-free.dev/mcp
```

### View Live Logs
```bash
# Real-time logs
kubectl logs -f deployment/catalog-mcp-dev -n catalog-mcp-dev

# Last 100 lines
kubectl logs deployment/catalog-mcp-dev -n catalog-mcp-dev --tail=100

# Pod events
kubectl get events -n catalog-mcp-dev --sort-by='.lastTimestamp'
```

### Check Deployment Status
```bash
# All resources
kubectl get all -n catalog-mcp-dev

# Specific deployment
kubectl describe deployment catalog-mcp-dev -n catalog-mcp-dev

# Ingress details
kubectl describe ingress catalog-mcp-dev-ingress -n catalog-mcp-dev

# Check ngrok operator logs
kubectl logs -n ngrok-operator deployment/ngrok-operator-manager --tail=50
```

### Monitor in ngrok Dashboard
1. Visit: https://dashboard.ngrok.com
2. Navigate to: **Endpoints** (to see active tunnels)
3. Navigate to: **Traffic Inspector** (to see live requests)

## TROUBLESHOOTING

### Issue: Deployment not updating after push

**Check GitHub Actions:**
```bash
# Visit: https://github.com/pulse-quantum-ai/catalog-api-mcp/actions
# Look for workflow run status
```

**Manual trigger:**
- Go to Actions tab
- Select "Build and Push MCP Server Docker Image"
- Click "Run workflow"

### Issue: Pod in CrashLoopBackOff

```bash
# Check pod logs
kubectl logs deployment/catalog-mcp-dev -n catalog-mcp-dev

# Check pod describe for events
kubectl describe pod -l app=catalog-mcp-dev -n catalog-mcp-dev

# Common fixes:
# 1. Check secrets are configured
kubectl get secret catalog-mcp-secrets -n catalog-mcp-dev

# 2. Check PVC is bound
kubectl get pvc -n catalog-mcp-dev

# 3. Check image pull
kubectl get events -n catalog-mcp-dev | grep -i pull
```

### Issue: ngrok tunnel not working

```bash
# Check ingress status
kubectl get ingress -n catalog-mcp-dev
kubectl describe ingress catalog-mcp-dev-ingress -n catalog-mcp-dev

# Check ngrok operator
kubectl get pods -n ngrok-operator
kubectl logs -n ngrok-operator deployment/ngrok-operator-manager

# Verify domain in ngrok dashboard
# Visit: https://dashboard.ngrok.com/domains
```

### Issue: Service not accessible

```bash
# Test service internally (from cluster)
kubectl run -it --rm debug --image=alpine --restart=Never -- \
  wget -O- http://catalog-mcp-dev-service.catalog-mcp-dev.svc.cluster.local:3000/health

# Check service endpoints
kubectl get endpoints catalog-mcp-dev-service -n catalog-mcp-dev

# Should show pod IPs
```

### Issue: Database permissions or data loss

```bash
# Check PVC status
kubectl get pvc catalog-mcp-dev-storage -n catalog-mcp-dev

# List files in data volume (requires pod to be running)
kubectl exec -it deployment/catalog-mcp-dev -n catalog-mcp-dev -- ls -la /app/data

# If data is lost, PVC might have been deleted
# Recreate and redeploy:
kubectl delete pvc catalog-mcp-dev-storage -n catalog-mcp-dev
kubectl apply -f k8s/dev/pvc.yaml
kubectl rollout restart deployment/catalog-mcp-dev -n catalog-mcp-dev
```

## CLEANUP

### Remove development environment
```bash
# Delete entire namespace (includes all resources)
kubectl delete namespace catalog-mcp-dev

# This removes:
# - Deployment
# - Service
# - Ingress (ngrok tunnel auto-closed)
# - PVC and data
# - Secrets
```

### Uninstall ngrok operator (if needed)
```bash
helm uninstall ngrok-operator -n ngrok-operator
kubectl delete namespace ngrok-operator
kubectl delete crd -l app.kubernetes.io/name=ngrok-operator
```

## SIDE-BY-SIDE TESTING

### Development (K3s)
```bash
curl https://unjestingly-unfoaled-donita.ngrok-free.dev/health
```

### Production (Digital Ocean)
```bash
curl https://obot-production.example.com/api/mcp/health
```

### Compare Responses
Use tools like `diff`, `jq`, or Postman collections to compare API responses.

## MONITORING AND OBSERVABILITY

### ngrok Dashboard
- **URL:** https://dashboard.ngrok.com
- **Traffic Inspector:** Real-time request monitoring with headers, body, response
- **Endpoints:** View tunnel status and configuration

### K3s Monitoring
```bash
# Resource usage (requires metrics-server)
kubectl top pods -n catalog-mcp-dev

# Watch deployment changes
kubectl get pods -n catalog-mcp-dev -w

# Continuous log streaming
kubectl logs -f deployment/catalog-mcp-dev -n catalog-mcp-dev
```

### GitHub Actions Monitoring
- **Workflow runs:** https://github.com/pulse-quantum-ai/catalog-api-mcp/actions
- **Email notifications:** Configure in repository settings
- **Slack integration:** Add webhook for deployment notifications (optional)

## SECURITY NOTES

### Secrets Management
- Never commit secrets to repository
- Use GitHub Secrets for all sensitive data
- Rotate ngrok authtoken/API key periodically
- Use RBAC in K3s to limit access

### Network Security
- ngrok free tier has rate limits
- Consider upgrading for production use
- Monitor Traffic Inspector for suspicious activity
- Use ngrok IP restrictions (optional, paid feature)

### Access Control
- K3s kubeconfig should be protected
- Limit GitHub Actions permissions
- Use separate credentials for dev vs prod

## COST CONSIDERATIONS

### ngrok Free Tier
- Limited to 1 reserved domain
- Rate limits apply
- No custom domains (requires paid plan)
- Traffic Inspector available

### K3s Resources
- Minimal: 100m CPU, 256Mi memory (requests)
- Maximum: 500m CPU, 512Mi memory (limits)
- Storage: 2Gi PVC

### Recommendations
- Monitor ngrok usage in dashboard
- Consider paid plan if limits are reached
- Optimize Docker image size for faster deployments

## CONTACTS AND SUPPORT

### Infrastructure Access
- Credentials: `/Users/mihai/Documents/tech_workspace/clienti/gonkar/code/muc-dc/inventory/infrastructure-credentials.txt`
- Inventory: `/Users/mihai/Documents/tech_workspace/clienti/gonkar/code/muc-dc/inventory/inventory.yml`

### ngrok Support
- Dashboard: https://dashboard.ngrok.com
- Documentation: https://ngrok.com/docs/k8s
- GitHub Issues: https://github.com/ngrok/ngrok-operator

### Repository
- GitLab (primary): https://gitlab.com/pulse-quantum-ai/catalog-api-mcp
- GitHub (mirror): https://github.com/pulse-quantum-ai/catalog-api-mcp
- Issue tracker: GitLab Issues

---

Last updated: 2026-01-27
