# Kubernetes Development Deployment

Development environment configuration for catalog-api-mcp MCP server on K3s cluster with ngrok operator.

## Architecture

```
GitHub Push → GitHub Actions → Docker Build → GHCR Push → kubectl apply → ngrok Tunnel
                                                                ↓
                                              https://unjestingly-unfoaled-donita.ngrok-free.dev
```

## Prerequisites

1. **ngrok Operator Installed in K3s**
   - Namespace: `ngrok-operator`
   - Credentials configured (API Key + Authtoken)
   - Install script: `/path/to/muc-dc/playbooks/k3s/ngrok-operator-install-manual.sh`

2. **GitHub Secrets Configured**
   - `KUBECONFIG_K3S_DEV` - K3s kubeconfig (base64 encoded)
   - `MIDOCEAN_TEST_API_KEY`
   - `MIDOCEAN_PROD_API_KEY`
   - `XD_CONNECTS_PRODUCT_DATA_URL`

3. **Reserved Domain in ngrok**
   - Domain: `unjestingly-unfoaled-donita.ngrok-free.dev`
   - Must be reserved in ngrok dashboard

## Resources

### namespace.yaml
Creates the `catalog-mcp-dev` namespace for isolated development environment.

### pvc.yaml
Persistent storage (2Gi) for SQLite database and nanobot state.
- Storage class: `local-path` (K3s default)
- Access mode: ReadWriteOnce

### deployment.yaml
Main application deployment:
- Image: `ghcr.io/pulse-quantum-ai/catalog-api-mcp:latest`
- Container port: 3000
- Resource limits: 500m CPU, 512Mi memory
- Health checks: liveness + readiness probes
- Environment: Development mode with debug logging
- Secrets: API keys mounted from `catalog-mcp-secrets`

### service.yaml
ClusterIP service exposing the MCP server internally:
- Name: `catalog-mcp-dev-service`
- Port: 3000
- Selector: `app=catalog-mcp-dev`

### ingress.yaml
Ngrok ingress for external access:
- Ingress class: `ngrok` (managed by ngrok operator)
- Host: `unjestingly-unfoaled-donita.ngrok-free.dev`
- Backend: `catalog-mcp-dev-service:3000`
- Path: `/` (all traffic)

## Deployment

### Automatic (via GitHub Actions)
Push to `main` branch triggers:
1. Docker image build and push to GHCR
2. kubectl apply all manifests from `k8s/dev/`
3. Rollout restart to pick up new image
4. ngrok operator automatically creates tunnel

### Manual
```bash
# Apply all manifests
kubectl apply -f k8s/dev/

# Force update to latest image
kubectl rollout restart deployment/catalog-mcp-dev -n catalog-mcp-dev

# Watch rollout
kubectl rollout status deployment/catalog-mcp-dev -n catalog-mcp-dev
```

## Access

- **Public URL:** https://unjestingly-unfoaled-donita.ngrok-free.dev
- **Direct K3s:** http://10.108.111.115:3000 (requires port-forward)
- **Traefik Internal:** http://catalog-mcp-dev-service.catalog-mcp-dev.svc.cluster.local:3000

## Testing

```bash
# Health check
curl https://unjestingly-unfoaled-donita.ngrok-free.dev/health

# MCP endpoint (if exposed)
curl https://unjestingly-unfoaled-donita.ngrok-free.dev/mcp

# Check deployment status
kubectl get all -n catalog-mcp-dev

# View logs
kubectl logs -f deployment/catalog-mcp-dev -n catalog-mcp-dev

# Check ingress
kubectl get ingress -n catalog-mcp-dev
kubectl describe ingress catalog-mcp-dev-ingress -n catalog-mcp-dev
```

## Troubleshooting

### Ingress not working
```bash
# Check ngrok operator logs
kubectl logs -n ngrok-operator deployment/ngrok-operator-manager

# Check ingress status
kubectl describe ingress catalog-mcp-dev-ingress -n catalog-mcp-dev

# Verify ngrok operator is running
kubectl get pods -n ngrok-operator
```

### Application not responding
```bash
# Check pod status
kubectl get pods -n catalog-mcp-dev

# View pod logs
kubectl logs -f deployment/catalog-mcp-dev -n catalog-mcp-dev

# Check pod events
kubectl describe pod -n catalog-mcp-dev -l app=catalog-mcp-dev

# Test service internally
kubectl run -it --rm debug --image=alpine --restart=Never -- \
  wget -O- http://catalog-mcp-dev-service.catalog-mcp-dev.svc.cluster.local:3000/health
```

### Secrets issues
```bash
# Verify secrets exist
kubectl get secret catalog-mcp-secrets -n catalog-mcp-dev

# Recreate secrets (from GitHub Actions or manually)
kubectl create secret generic catalog-mcp-secrets \
  --namespace=catalog-mcp-dev \
  --from-literal=MIDOCEAN_TEST_API_KEY="..." \
  --from-literal=MIDOCEAN_PROD_API_KEY="..." \
  --from-literal=XD_CONNECTS_PRODUCT_DATA_URL="..." \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Monitoring

### ngrok Dashboard
- URL: https://dashboard.ngrok.com
- Traffic Inspector: Real-time request monitoring
- Endpoints: View active tunnels

### K3s Monitoring
```bash
# Resource usage
kubectl top pods -n catalog-mcp-dev

# Events
kubectl get events -n catalog-mcp-dev --sort-by='.lastTimestamp'

# All resources
kubectl get all -n catalog-mcp-dev
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace catalog-mcp-dev

# This will remove:
# - Deployment
# - Service
# - Ingress (ngrok tunnel auto-deleted by operator)
# - PVC and data
# - Secrets
```

## Notes

- ngrok operator automatically manages tunnel lifecycle
- Domain must be reserved in ngrok dashboard
- Free tier may have rate limits
- PVC data persists across deployments (delete manually if needed)
- GitHub Actions automatically trigger on push to main
