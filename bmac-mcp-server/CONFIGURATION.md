# BMAC MCP Server Configuration

## Claude Desktop Configuration

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bmac": {
      "command": "node",
      "args": ["/absolute/path/to/BMAC-demo-start/bmac-mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "/absolute/path/to/BMAC-demo-start/sqlite.db"
      }
    }
  }
}
```

**Important**: 
- Use the absolute path to the compiled `dist/index.js` file
- Set `DATABASE_URL` to the path of your SQLite database file (can be relative or absolute)
- The MCP server uses SQLite, so ensure the database file path is accessible
- Restart Claude Desktop after making changes

## Testing the Server

You can test the server manually:

```bash
cd bmac-mcp-server
npm run dev
```

The server communicates via stdio, so it's designed to be used by MCP clients, not directly.

## Available Tools

### Product Tools
- `get_products` - List products with filters
- `get_product_details` - Get detailed product information
- `search_products` - Search products by query

### User Tools
- `get_users` - List users
- `get_user_details` - Get user information

### Request Tools
- `get_product_requests` - List product requests
- `create_product_request` - Create a new request

## Resources

- `bmac://products/{id}` - Access product data as a resource

