#!/bin/bash

# Script to build the Catalog API MCP Server Docker image locally

set -e

echo "🏗️  Building Catalog API MCP Server Docker Image..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build TypeScript first
echo -e "${YELLOW}📦 Installing dependencies and building TypeScript...${NC}"
cd bmac-mcp-server
npm ci
npm run build
cd ..

# Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -f Dockerfile.mcp -t ghcr.io/mihai-satmarean/catalog-api-mcp:latest .

echo ""
echo -e "${GREEN}✅ Docker image built successfully!${NC}"
echo ""
echo "Image: ghcr.io/mihai-satmarean/catalog-api-mcp:latest"
echo ""
echo "To test the image locally:"
echo "  docker run -e DATABASE_URL='your-database-url' -p 3000:3000 ghcr.io/mihai-satmarean/catalog-api-mcp:latest"
echo ""
echo "To push to GitHub Container Registry:"
echo "  docker push ghcr.io/mihai-satmarean/catalog-api-mcp:latest"

