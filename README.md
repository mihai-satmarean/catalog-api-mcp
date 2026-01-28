# BMAC Demo - Product Management System

A full-stack product management application with Model Context Protocol (MCP) server integration, providing AI assistants with access to product catalogs, user management, and database operations.

## Technologies Used

### Backend & Database
- **Node.js** - JavaScript runtime environment
- **TypeScript** - Type-safe JavaScript with static typing
- **SQLite** - Lightweight, file-based relational database
- **better-sqlite3** - Fast and reliable SQLite3 driver for Node.js
- **Drizzle ORM** - Type-safe SQL ORM with excellent TypeScript support
- **Drizzle Kit** - Database migration and schema management tool

### Frontend
- **Next.js 15** - React framework with App Router and server components
- **React 19** - UI library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Radix UI** - Accessible component primitives

### MCP Server
- **Model Context Protocol (MCP)** - Protocol for AI assistants to interact with external data sources
- **@modelcontextprotocol/sdk** - Official MCP SDK for building protocol-compliant servers

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Docker** - Containerization for consistent deployments
- **tsx** - TypeScript execution environment for development

## APIs Used

### Midocean API
RESTful API for product data, pricing, and print services.

**Base URLs:**
- Test: `https://apitest.midocean.com`
- Production: `https://api.midocean.com`

**Endpoints:**
- `/gateway/products/2.0` - Product catalog data
- `/gateway/pricelist/2.0` - Product pricing information
- `/gateway/printpricelist/2.0` - Print pricing information

**Authentication:** API key via `x-Gateway-APIKey` header

### XD Connects API
JSON feed-based API for product data, prices, print data, and stock information.

**Base URL:** `https://feeds.xindao.com`

**Feed Types:**
- Product Data - Product catalog information
- Product Prices - Pricing tiers and quantities
- Print Data - Print customization options
- Print Prices - Print pricing information
- Stock - Inventory levels

**Authentication:** Public JSON feeds (no authentication required)

## How to Run the App

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager
- (Optional) Docker and Docker Compose for containerized deployment

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd BMAC-demo-start
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install MCP server dependencies:**
   ```bash
   cd bmac-mcp-server
   npm install
   cd ..
   ```

### Configuration

1. **Create environment file** (optional - defaults are provided):
   ```bash
   cp .env.example .env.local
   ```

2. **Set database path** (optional - defaults to `./sqlite.db`):
   ```env
   DATABASE_URL="./sqlite.db"
   ```

3. **Configure API keys** (optional - test keys are included):
   ```env
   MIDOCEAN_TEST_API_KEY="your-test-key"
   MIDOCEAN_PROD_API_KEY="your-prod-key"
   ```

### Database Setup

1. **Initialize database schema:**
   ```bash
   npm run db:push
   ```

   This creates the SQLite database file and sets up all required tables.

   Alternatively, initialize manually:
   ```bash
   sqlite3 sqlite.db < init-tables.sql
   ```

### Running the Application

#### Development Mode

1. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

#### MCP Server

1. **Build the MCP server:**
   ```bash
   cd bmac-mcp-server
   npm run build
   ```

2. **Run the MCP server:**
   ```bash
   # Development mode (with watch)
   npm run dev

   # Production mode
   npm start
   ```

### Docker Deployment

1. **Build and start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop containers:**
   ```bash
   docker-compose down
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Database Management

- **Generate migrations:** `npm run db:generate`
- **Apply migrations:** `npm run db:migrate`
- **Push schema changes:** `npm run db:push`
- **Open Drizzle Studio:** `npm run db:studio`

## Project Structure

```
BMAC-demo-start/
├── bmac-mcp-server/          # MCP server implementation
│   ├── src/
│   │   ├── index.ts          # MCP server entry point
│   │   ├── tools/            # MCP tool definitions
│   │   ├── resources/        # MCP resource handlers
│   │   └── lib/              # API clients and utilities
│   └── package.json
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/              # API routes
│   │   └── page.tsx          # Pages
│   └── db/                   # Database schema and connection
├── package.json              # Root package.json
├── drizzle.config.ts         # Drizzle configuration
└── sqlite.db                 # SQLite database (created after setup)
```

## Features

- **Product Management** - Browse and search products from multiple suppliers
- **Price Synchronization** - Sync product prices from XD Connects and Midocean
- **User Management** - User accounts with role-based permissions
- **Product Requests** - Request products with customization options
- **MCP Integration** - AI assistant access via Model Context Protocol
- **Type Safety** - Full TypeScript support throughout the application

## License

MIT
