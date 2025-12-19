#!/bin/bash

# Test script for BMAC MCP Server
# This simulates an MCP client to verify the server works correctly

echo "🧪 Testing BMAC MCP Server..."
echo ""

SERVER_PATH="/Users/relaxZone/Projects/BMAC-demo-start/bmac-mcp-server/dist/index.js"

if [ ! -f "$SERVER_PATH" ]; then
    echo "❌ Server not found. Building..."
    cd "$(dirname "$SERVER_PATH")/.."
    npm run build
fi

echo "📡 Sending initialize request..."
echo ""

# Send initialize request
INIT_REQUEST='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0"}}}'

echo "$INIT_REQUEST" | node "$SERVER_PATH" 2>&1 | head -20

echo ""
echo "✅ Test complete!"
echo ""
echo "If you see a JSON response with server info, the server is working correctly."
echo "You can now configure it in Cursor using the instructions in CURSOR_SETUP.md"

