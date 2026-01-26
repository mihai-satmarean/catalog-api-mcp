#!/bin/bash

# Script to set up BMAC MCP Server in Cursor

CURSOR_MCP_CONFIG="$HOME/Library/Application Support/Cursor/User/globalStorage/mcp.json"
PROJECT_DIR="/Users/relaxZone/Projects/BMAC-demo-start"
SERVER_PATH="$PROJECT_DIR/bmac-mcp-server/dist/index.js"

echo "🚀 Setting up BMAC MCP Server in Cursor..."
echo ""

# Check if server is built
if [ ! -f "$SERVER_PATH" ]; then
    echo "❌ Server not built. Building now..."
    cd "$PROJECT_DIR/bmac-mcp-server"
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please check the errors above."
        exit 1
    fi
    echo "✅ Server built successfully!"
fi

# Create Cursor config directory if it doesn't exist
mkdir -p "$(dirname "$CURSOR_MCP_CONFIG")"

# Check if mcp.json exists
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    echo "📝 Found existing MCP configuration"
    echo "⚠️  Please manually add the BMAC server configuration to:"
    echo "   $CURSOR_MCP_CONFIG"
    echo ""
    echo "Add this configuration:"
    echo ""
    cat "$PROJECT_DIR/bmac-mcp-server/cursor-mcp-config.json" | sed 's/^/   /'
    echo ""
else
    echo "📝 Creating new MCP configuration..."
    cp "$PROJECT_DIR/bmac-mcp-server/cursor-mcp-config.json" "$CURSOR_MCP_CONFIG"
    echo "✅ Configuration created at:"
    echo "   $CURSOR_MCP_CONFIG"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Cursor completely"
echo "2. Open Cursor's AI chat (Cmd+L)"
echo "3. Try asking: 'List all products using the BMAC MCP server'"
echo ""
echo "To verify the server works, run:"
echo "  cd $PROJECT_DIR/bmac-mcp-server && npm run dev"

