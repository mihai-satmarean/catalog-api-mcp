# BMAC MCP Server

Model Context Protocol (MCP) server for the BMAC Demo product management system.

## Overview

This MCP server provides AI assistants with access to:
- Product catalog (Midocean, XD Connects)
- User management
- Product requests
- Database queries

## Installation

```bash
cd bmac-mcp-server
npm install
```

## Configuration

The server will automatically look for `.env.local` in the parent directory (`BMAC-demo-start/.env.local`). 

Alternatively, you can set the `DATABASE_URL` environment variable directly when running the server:

```env
DATABASE_URL="./sqlite.db"
```

**Note**: When configuring Claude Desktop, you should set `DATABASE_URL` in the `env` section of the configuration (see Usage section below). The MCP server uses SQLite, so `DATABASE_URL` should point to the SQLite database file path (relative or absolute).

## Building

```bash
npm run build
```

## Running

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Available Tools

### Product Tools

- **get_products** - Get a list of products with optional filters
  - Filters: source, search, category, brand
  - Returns: List of products

- **get_product_details** - Get detailed product information
  - Parameters: productId or productCode
  - Returns: Product with variants and digital assets

- **search_products** - Search products by query
  - Parameters: query, limit
  - Returns: Matching products

### User Tools

- **get_users** - Get a list of users
  - Filters: search, roleId
  - Returns: List of users with roles

- **get_user_details** - Get user details
  - Parameters: userId or email
  - Returns: User information with role

### Request Tools

- **get_product_requests** - Get product requests
  - Filters: status, productId
  - Returns: List of requests

- **create_product_request** - Create a new product request
  - Parameters: productId, productName, quantity, personalizationRemarks
  - Returns: Created request

## Resources

- **bmac://products/{id}** - Access product data as a resource

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "bmac": {
      "command": "node",
      "args": ["/absolute/path/to/BMAC-demo-start/bmac-mcp-server/dist/src/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/bmac_demo"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/BMAC-demo-start` with the actual absolute path to your project directory.

After adding the configuration, restart Claude Desktop for the changes to take effect.

## Development

```bash
# Watch mode
npm run watch

# Type checking
npx tsc --noEmit
```

## Project Structure

```
bmac-mcp-server/
├── src/
│   ├── index.ts          # Main server entry point
│   ├── tools/
│   │   ├── products.ts   # Product tools
│   │   ├── users.ts      # User tools
│   │   └── requests.ts   # Request tools
│   ├── resources/
│   │   └── products.ts   # Product resources
│   └── db/
│       └── connection.ts  # Database connection
├── package.json
├── tsconfig.json
└── README.md
```

