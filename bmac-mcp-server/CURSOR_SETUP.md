# Setting Up BMAC MCP Server in Cursor

## Configuration Steps

### 1. Locate Cursor's MCP Configuration

Cursor stores MCP server configurations in:
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\mcp.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/mcp.json`

Alternatively, you can access it through Cursor's UI:
- Go to **Settings** → **Features** → **MCP**
- Click **+ Add New MCP Server**

### 2. Add BMAC MCP Server Configuration

Add the following configuration to your `mcp.json` file:

```json
{
  "mcpServers": {
    "bmac": {
      "command": "node",
      "args": ["/Users/relaxZone/Projects/BMAC-demo-start/bmac-mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/bmac_demo"
      }
    }
  }
}
```

**Important**: 
- Replace `/Users/relaxZone/Projects/BMAC-demo-start` with your actual absolute path
- Update the `DATABASE_URL` to match your database configuration

### 3. Restart Cursor

After adding the configuration, completely restart Cursor to apply the changes.

### 4. Verify the Server is Connected

1. Open Cursor's AI chat (Ctrl+L or Cmd+L)
2. Check if the MCP server appears in the available tools/resources
3. Try asking: "List all products using the BMAC MCP server"

### 5. Test the Tools

Try these example queries in Cursor's chat:

- **"Use the get_products tool to list all Midocean products"**
- **"Get details for product AR1249 using the BMAC server"**
- **"Search for products with 'target' in the name"**
- **"List all users from the database"**
- **"Show me all pending product requests"**

## Troubleshooting

### Server Not Appearing

1. **Check the path**: Ensure the absolute path to `dist/index.js` is correct
2. **Verify build**: Run `npm run build` in the `bmac-mcp-server` directory
3. **Check logs**: Look for errors in Cursor's developer console (Help → Toggle Developer Tools)

### Database Connection Issues

1. **Verify DATABASE_URL**: Make sure it matches your `.env.local` file
2. **Test connection**: Run `npm run dev` in `bmac-mcp-server` to test the connection
3. **Check database**: Ensure PostgreSQL is running and accessible

### Import Errors

If you see module import errors:
1. Run `npm run build` to rebuild the server
2. The `fix-imports.js` script should automatically add `.js` extensions
3. Verify `dist/index.js` exists and is executable

## Manual Testing

You can test the server manually before configuring in Cursor:

```bash
cd bmac-mcp-server
npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/index.js
```

If you see a JSON response with server info, the server is working correctly.

