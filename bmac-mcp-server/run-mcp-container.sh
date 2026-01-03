#!/bin/bash
# Script to run BMAC MCP Server in stdio mode for Cursor
# Uses the same container image as Obot.ai but in stdio mode

IMAGE="ghcr.io/mihai-satmarean/catalog-api-mcp:latest"

# Run container in stdio mode (ephemeral)
# MCP_MODE=stdio tells the container to use stdio instead of HTTP
exec docker run --rm -i \
  -e MCP_MODE=stdio \
  -v bmac-sqlite-cursor:/app/data \
  "${IMAGE}"

