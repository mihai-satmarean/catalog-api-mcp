#!/bin/sh
set -e

# Ensure data directory exists (may be a fresh volume mount)
mkdir -p /app/data

# Start webapp in background on port 3002 (3001 is reserved by nanobot UI)
cd /webapp
PORT=3002 DATABASE_URL="${DATABASE_URL}" HOSTNAME=0.0.0.0 node server.js &
WEBAPP_PID=$!
echo "[fat] Webapp started (PID $WEBAPP_PID) on port 3002"

# Start cloudflared quick tunnel — no account or token required
# URL is random (*.trycloudflare.com) and retrievable via metrics API at :20241/quicktunnel
echo "[fat] Starting cloudflared tunnel for webapp (random trycloudflare.com URL)"
cloudflared tunnel --url http://localhost:3002 \
  --metrics localhost:20241 \
  --no-autoupdate \
  --logfile /tmp/cloudflared.log 2>&1 &
CLOUDFLARED_PID=$!
echo "[fat] cloudflared started (PID $CLOUDFLARED_PID)"

# Return to root before starting nanobot
cd /

echo "[fat] Starting nanobot MCP server on port 3000"
exec nanobot run --listen-address :3000 \
  --config /nanobot.yaml \
  --exclude-built-in-agents \
  -e DATABASE_URL \
  -e MIDOCEAN_TEST_API_KEY \
  -e MIDOCEAN_PROD_API_KEY \
  -e MIDOCEAN_TEST_BASE_URL \
  -e MIDOCEAN_PROD_BASE_URL \
  -e XD_CONNECTS_BASE_URL \
  -e XD_CONNECTS_PRODUCT_DATA_URL \
  -e XD_CONNECTS_PRODUCT_PRICES_URL \
  -e XD_CONNECTS_PRINT_DATA_URL \
  -e XD_CONNECTS_PRINT_PRICES_URL \
  -e XD_CONNECTS_STOCK_URL
