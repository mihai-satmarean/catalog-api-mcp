# Quick Deploy Guide for Sorin

Fast reference for deploying catalog-api-mcp to K3s development environment.

## Prerequisites Check

Before first deployment, verify these are complete:

- [ ] ngrok operator installed in K3s cluster
- [ ] GitHub secrets configured
- [ ] Domain reserved in ngrok dashboard

If any is missing, see DEVELOPMENT-SETUP.md for full setup.

## Automatic Deployment

**Just push to main branch:**
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

GitHub Actions will automatically:
1. Build Docker image
2. Push to GHCR
3. Deploy to K3s
4. Create ngrok tunnel

**Check progress:**
- https://github.com/pulse-quantum-ai/catalog-api-mcp/actions

**Access your deployment:**
- https://unjestingly-unfoaled-donita.ngrok-free.dev

## Manual Deployment

If you need to deploy without pushing:

```bash
# 1. Get kubeconfig access (ask admin)
export KUBECONFIG=/path/to/k3s-kubeconfig

# 2. Apply manifests
kubectl apply -f k8s/dev/

# 3. Update deployment
kubectl rollout restart deployment/catalog-mcp-dev -n catalog-mcp-dev

# 4. Wait for rollout
kubectl rollout status deployment/catalog-mcp-dev -n catalog-mcp-dev
```

## Quick Testing

```bash
# Health check
curl https://unjestingly-unfoaled-donita.ngrok-free.dev/health

# View logs
kubectl logs -f deployment/catalog-mcp-dev -n catalog-mcp-dev

# Check status
kubectl get all -n catalog-mcp-dev
```

## Common Commands

```bash
# See all resources
kubectl get all -n catalog-mcp-dev

# Describe deployment
kubectl describe deployment catalog-mcp-dev -n catalog-mcp-dev

# Check ingress
kubectl get ingress -n catalog-mcp-dev

# Restart deployment manually
kubectl rollout restart deployment/catalog-mcp-dev -n catalog-mcp-dev

# View recent events
kubectl get events -n catalog-mcp-dev --sort-by='.lastTimestamp' | tail -20
```

## Troubleshooting Quick Fixes

### Pod not starting
```bash
# Check logs
kubectl logs deployment/catalog-mcp-dev -n catalog-mcp-dev --tail=50

# Check events
kubectl describe pod -l app=catalog-mcp-dev -n catalog-mcp-dev
```

### URL not working
```bash
# Check ingress
kubectl describe ingress catalog-mcp-dev-ingress -n catalog-mcp-dev

# Check ngrok operator
kubectl logs -n ngrok-operator deployment/ngrok-operator-manager --tail=50
```

### Old code version running
```bash
# Force image pull and restart
kubectl rollout restart deployment/catalog-mcp-dev -n catalog-mcp-dev
kubectl rollout status deployment/catalog-mcp-dev -n catalog-mcp-dev
```

## Monitoring

- **ngrok Traffic:** https://dashboard.ngrok.com/traffic-inspector
- **Logs:** `kubectl logs -f deployment/catalog-mcp-dev -n catalog-mcp-dev`
- **GitHub Actions:** https://github.com/pulse-quantum-ai/catalog-api-mcp/actions

## URLs

- **Development:** https://unjestingly-unfoaled-donita.ngrok-free.dev
- **Production:** Ask admin for Digital Ocean Obot URL
- **ngrok Dashboard:** https://dashboard.ngrok.com

---

For detailed setup and troubleshooting, see DEVELOPMENT-SETUP.md
