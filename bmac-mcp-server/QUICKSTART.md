# BMAC MCP Server - Quick Start Guide

## ✅ What Was Created

A complete MCP (Model Context Protocol) server that exposes your BMAC product management system to AI assistants like Claude.

## 📁 Structure

```
bmac-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/
│   │   ├── products.ts       # Product query tools
│   │   ├── users.ts          # User management tools
│   │   └── requests.ts       # Product request tools
│   ├── resources/
│   │   └── products.ts       # Product resources
│   └── db/
│       ├── connection.ts     # Database connection
│       └── schema.ts         # Database schema (copied from main project)
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### 1. Build the Server

```bash
cd bmac-mcp-server
npm install
npm run build
```

### 2. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bmac": {
      "command": "node",
      "args": ["/Users/relaxZone/Projects/BMAC-demo-start/bmac-mcp-server/dist/src/index.js"],
      "env": {
        "DATABASE_URL": "/Users/relaxZone/Projects/BMAC-demo-start/sqlite.db"
      }
    }
  }
}
```

**Important**: 
- Replace the path with your actual absolute path
- Set `DATABASE_URL` to the path of your SQLite database file (absolute path recommended)
- The MCP server uses SQLite, so ensure the database file path is accessible

### 3. Restart Claude Desktop

After saving the configuration, restart Claude Desktop completely.

### 4. Test It

In Claude Desktop, you can now ask:
- "List all Midocean products"
- "Show me details for product AR1249"
- "Search for products with 'target' in the name"
- "Get all pending product requests"

## 🛠️ Available Tools

The server exposes 7 tools:

1. **get_products** - Query products with filters (source, search, category, brand)
2. **get_product_details** - Get full product details including variants and images
3. **search_products** - Search products by query string
4. **get_users** - List users with optional filters
5. **get_user_details** - Get specific user information
6. **get_product_requests** - List product requests
7. **create_product_request** - Create a new product request

## 📦 Resources

Products are also available as resources:
- `bmac://products/{id}` - Access product data directly

## 🔧 Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Run in development mode
npm run dev

# Build for production
npm run build
```

## 📝 Notes

- The server uses stdio for communication (standard MCP protocol)
- It connects to the same database as your main BMAC application
- All tools return JSON data that Claude can understand and use
- The server automatically loads environment variables from `.env.local` in the parent directory

## 🐛 Troubleshooting

If Claude Desktop doesn't recognize the server:

1. Check that the path in config is absolute and correct
2. Verify `DATABASE_URL` points to your SQLite database file (use absolute path)
3. Ensure the server builds without errors: `npm run build`
4. Check Claude Desktop logs for errors
5. Make sure you restarted Claude Desktop after configuration changes
6. Ensure the SQLite database file exists and is accessible

