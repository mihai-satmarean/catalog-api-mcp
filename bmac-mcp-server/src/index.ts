#!/usr/bin/env node

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Suppress dotenv output to prevent interference with MCP JSON protocol
const originalConsoleLog = console.log;
console.log = () => {};

// Load environment variables from parent directory's .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// Also try loading from current directory as fallback
dotenv.config({ path: '.env.local' });

// Restore console.log
console.log = originalConsoleLog;

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize database connection at startup
import { db, products } from './db/connection.js';
// Force database initialization by accessing it
try {
  // This will trigger the Proxy getter and initialize the database
  const _ = db.query;
} catch (error) {
  console.error('Warning: Database initialization failed:', error);
}

// Import tools
import { productTools, handleGetProducts, handleGetProductDetails, handleSearchProducts, handleImportProducts, handleSyncSuppliers } from './tools/products.js';
import { userTools, handleGetUsers, handleGetUserDetails } from './tools/users.js';
import { requestTools, handleGetProductRequests, handleCreateProductRequest } from './tools/requests.js';
import { listProductResources, getProductResource } from './resources/products.js';

// Create MCP server
const server = new Server(
  {
    name: 'bmac-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...productTools,
      ...userTools,
      ...requestTools,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'sync_suppliers':
        return await handleSyncSuppliers(args || {});
      
      case 'import_products':
        return await handleImportProducts(args || {});
      
      case 'get_products':
        return await handleGetProducts(args || {});
      
      case 'get_product_details':
        return await handleGetProductDetails(args || {});
      
      case 'search_products':
        return await handleSearchProducts(args || {});
      
      case 'get_users':
        return await handleGetUsers(args || {});
      
      case 'get_user_details':
        return await handleGetUserDetails(args || {});
      
      case 'get_product_requests':
        return await handleGetProductRequests(args || {});
      
      case 'create_product_request':
        return await handleCreateProductRequest(args || {});
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = await listProductResources();
  return { resources };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri.startsWith('bmac://products/')) {
    return await getProductResource(uri);
  }
  
  throw new Error(`Unknown resource URI: ${uri}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Server is now connected and ready
  // Note: Products can be imported manually using the 'sync_suppliers' tool
  console.error('[BMAC MCP] Server started successfully');
  console.error('[BMAC MCP] Database path:', process.env.DATABASE_URL || '/app/data/sqlite.db');
  console.error('[BMAC MCP] Use "sync_suppliers" tool to import products from Midocean and XD Connects');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

