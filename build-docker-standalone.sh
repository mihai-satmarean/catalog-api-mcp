#!/bin/bash

# Script to build the Catalog API MCP Server Docker image (standalone with PostgreSQL)

set -e

echo "🏗️  Building Catalog API MCP Server Docker Image (Standalone with PostgreSQL)..."
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
echo -e "${YELLOW}🐳 Building Docker image with embedded PostgreSQL...${NC}"
docker build -f Dockerfile.mcp.standalone -t ghcr.io/mihai-satmarean/catalog-api-mcp:standalone .

echo ""
echo -e "${GREEN}✅ Docker image built successfully!${NC}"
echo ""
echo "Image: ghcr.io/mihai-satmarean/catalog-api-mcp:standalone"
echo ""
echo "This image includes:"
echo "  - PostgreSQL 15 database"
echo "  - Catalog API MCP Server"
echo "  - Supervisor for process management"
echo ""
echo "To test the image locally:"
echo "  docker run -p 3000:3000 ghcr.io/mihai-satmarean/catalog-api-mcp:standalone"
echo ""
echo "To push to GitHub Container Registry:"
echo "  docker push ghcr.io/mihai-satmarean/catalog-api-mcp:standalone"
echo ""
echo "Note: Database is embedded and data will be lost when container is removed."
echo "      For persistent data, mount a volume: -v pgdata:/var/lib/postgresql/data"

