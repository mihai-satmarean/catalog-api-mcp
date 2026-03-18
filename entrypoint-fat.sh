#!/bin/sh
set -e

# Ensure data directory exists (may be a fresh volume mount)
mkdir -p /app/data

# Start webapp in background on port 3001 (internal only)
cd /webapp
PORT=3001 DATABASE_URL="${DATABASE_URL}" HOSTNAME=0.0.0.0 node server.js &
WEBAPP_PID=$!
echo "[fat] Webapp started (PID $WEBAPP_PID) on port 3001"

# Start ngrok tunnel for the webapp if NGROK_AUTHTOKEN is set
if [ -n "${NGROK_AUTHTOKEN}" ]; then
  if [ -n "${NGROK_DOMAIN}" ]; then
    echo "[fat] Starting ngrok tunnel → https://${NGROK_DOMAIN}"
    ngrok http 3001 --domain="${NGROK_DOMAIN}" --log=stdout 2>&1 &
  else
    echo "[fat] Starting ngrok tunnel with auto-assigned URL"
    ngrok http 3001 --log=stdout 2>&1 &
  fi
else
  echo "[fat] NGROK_AUTHTOKEN not set — skipping ngrok tunnel (webapp only reachable internally)"
fi

# Return to root before starting nanobot
cd /

echo "[fat] Starting nanobot MCP server on port 3000"
exec nanobot run --listen-address :3000 \
  --config /nanobot.yaml \
  -e DATABASE_URL \
  -e NGROK_AUTHTOKEN \
  -e NGROK_DOMAIN \
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
