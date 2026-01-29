#!/bin/bash
# Script to set GitHub secrets from .env file
# Requires: gh CLI (GitHub CLI) installed and authenticated
# Usage: ./scripts/set-github-secrets.sh

set -e

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Copy .env.example to .env and fill in your values"
    exit 1
fi

# Load .env file
source .env

# Repository (auto-detect or override)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo "Error: Could not detect repository. Are you in a git repository with GitHub remote?"
    exit 1
fi

echo "Setting secrets for repository: $REPO"
echo ""

# Set each secret
if [ -n "$NGROK_AUTHTOKEN" ]; then
    echo "Setting NGROK_AUTHTOKEN..."
    echo "$NGROK_AUTHTOKEN" | gh secret set NGROK_AUTHTOKEN
fi

if [ -n "$NGROK_DOMAIN" ]; then
    echo "Setting NGROK_DOMAIN..."
    echo "$NGROK_DOMAIN" | gh secret set NGROK_DOMAIN
fi

if [ -n "$VPN_SERVER" ]; then
    echo "Setting VPN_SERVER..."
    echo "$VPN_SERVER" | gh secret set VPN_SERVER
fi

if [ -n "$VPN_USERNAME" ]; then
    echo "Setting VPN_USERNAME..."
    echo "$VPN_USERNAME" | gh secret set VPN_USERNAME
fi

if [ -n "$VPN_PASSWORD" ]; then
    echo "Setting VPN_PASSWORD..."
    echo "$VPN_PASSWORD" | gh secret set VPN_PASSWORD
fi

if [ -n "$VPN_TRUSTED_CERT" ]; then
    echo "Setting VPN_TRUSTED_CERT..."
    echo "$VPN_TRUSTED_CERT" | gh secret set VPN_TRUSTED_CERT
fi

if [ -n "$KUBECONFIG_K3S_DEV" ]; then
    echo "Setting KUBECONFIG_K3S_DEV..."
    echo "$KUBECONFIG_K3S_DEV" | gh secret set KUBECONFIG_K3S_DEV
fi

if [ -n "$MIDOCEAN_TEST_API_KEY" ]; then
    echo "Setting MIDOCEAN_TEST_API_KEY..."
    echo "$MIDOCEAN_TEST_API_KEY" | gh secret set MIDOCEAN_TEST_API_KEY
fi

if [ -n "$MIDOCEAN_PROD_API_KEY" ]; then
    echo "Setting MIDOCEAN_PROD_API_KEY..."
    echo "$MIDOCEAN_PROD_API_KEY" | gh secret set MIDOCEAN_PROD_API_KEY
fi

if [ -n "$XD_CONNECTS_PRODUCT_DATA_URL" ]; then
    echo "Setting XD_CONNECTS_PRODUCT_DATA_URL..."
    echo "$XD_CONNECTS_PRODUCT_DATA_URL" | gh secret set XD_CONNECTS_PRODUCT_DATA_URL
fi

echo ""
echo "All secrets have been set successfully!"
echo "You can verify them at: https://github.com/$REPO/settings/secrets/actions"
