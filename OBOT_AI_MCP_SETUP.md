# Complementary MCP Servers for obot.ai with BMAC

This guide outlines recommended MCP servers that complement the BMAC MCP server when using obot.ai for product catalog management.

## 🎯 Top Priority MCP Servers for Product Catalog Management

### 1. **Microsoft Office 365 MCP Servers** ⭐ Highly Recommended
**Why it's essential:**
- **Outlook**: Send product quotes, order confirmations, and customer communications
- **Excel**: Export product catalogs, price lists, and generate reports
- **OneDrive**: Store and manage product images, documentation, and data files
- **Calendar**: Schedule product launches, supplier meetings, and order deadlines
- **Contacts**: Manage supplier and customer contact information

**Setup in obot.ai:**
1. Navigate to **Connectors** section in obot.ai
2. Enable **Microsoft Office 365 MCP Servers**
3. Complete OAuth authentication process
4. Grant permissions for Outlook, Excel, OneDrive, Calendar, and Contacts

**Use Cases:**
- "Send a product quote to customer@example.com with the top 10 backpacks"
- "Export all Midocean products to Excel with prices"
- "Schedule a meeting with supplier next week"
- "Save product images to OneDrive folder"

---

### 2. **OttoKit MCP Server** ⭐ Highly Recommended
**Why it's powerful:**
- **1,000+ app integrations** including:
  - **Slack/Discord**: Team notifications, product updates, request approvals
  - **Google Sheets**: Real-time product catalog sync
  - **Airtable**: Advanced product database management
  - **Trello/Asana**: Product request workflow management
  - **Shopify/WooCommerce**: E-commerce platform integration
  - **Zapier/Make**: Automation workflows

**Setup in obot.ai:**
1. Create MCP server endpoint through [OttoKit](https://ottokit.com/mcp-server/)
2. Select and configure desired app integrations
3. Copy the endpoint URL
4. Paste the endpoint URL into obot.ai's MCP server configuration

**Use Cases:**
- "Notify the team in Slack when a new product request is created"
- "Sync product prices to Google Sheets"
- "Create a Trello card for high-priority product requests"
- "Update Shopify inventory when products are imported"

---

### 3. **Filesystem MCP Server** ⭐ Essential
**Why it's needed:**
- Read/write product configuration files
- Manage product images and assets
- Access log files for debugging
- Backup and restore database files
- Generate reports and exports

**Setup:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/BMAC-demo-start"]
    }
  }
}
```

**Use Cases:**
- "Read the product import configuration file"
- "Save product images to the assets folder"
- "Export product data to CSV file"
- "Check the database backup file"

---

### 4. **Database MCP Server** (PostgreSQL/MySQL)
**Why it's useful:**
- Direct SQL queries for advanced analytics
- Database inspection and optimization
- Cross-database data migration
- Complex reporting queries

**Setup (PostgreSQL example):**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost/dbname"
      }
    }
  }
}
```

**Use Cases:**
- "Show me products with prices above $100"
- "Find duplicate product codes"
- "Generate a report of all XD Connects products"

---

### 5. **Web Search MCP Server** (Brave Search/Google)
**Why it's helpful:**
- Research competitor products
- Find supplier information
- Market trend analysis
- Product specification research

**Setup (Brave Search example):**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Use Cases:**
- "Search for competitor prices for backpacks"
- "Find Midocean supplier contact information"
- "Research market trends for promotional products"

---

### 6. **GitHub MCP Server**
**Why it's valuable:**
- Version control for product data
- Track changes to product catalogs
- Collaborate on product configurations
- Code reviews for MCP server updates

**Setup:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Use Cases:**
- "Commit product catalog changes to GitHub"
- "Create an issue for product data inconsistencies"
- "Review recent changes to the BMAC MCP server"

---

### 7. **Nanobot Framework** ⭐ Advanced
**Why it's innovative:**
- Transform BMAC MCP server into a full-featured AI agent
- Add reasoning capabilities
- Rich UI components with MCP-UI
- Enhanced user interaction

**Setup:**
1. Wrap your BMAC MCP server with Nanobot framework
2. Define agent configurations with system prompts
3. Add UI components with MCP-UI
4. Connect to obot.ai

**Use Cases:**
- Create interactive product selection interfaces
- Build guided product request workflows
- Add visual product comparison tools

---

## 📋 Complete obot.ai Configuration Example

Here's a complete `mcp.json` configuration for obot.ai with multiple complementary servers:

```json
{
  "mcpServers": {
    "bmac": {
      "command": "node",
      "args": ["/absolute/path/to/BMAC-demo-start/bmac-mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "/absolute/path/to/BMAC-demo-start/sqlite.db"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/absolute/path/to/BMAC-demo-start"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key"
      }
    }
  }
}
```

**Note:** Microsoft Office 365 and OttoKit servers are configured through obot.ai's UI, not in the mcp.json file.

---

## 🚀 Recommended Setup Workflow

### Phase 1: Essential Setup (Start Here)
1. ✅ **BMAC MCP Server** - Already configured
2. ✅ **Filesystem MCP** - For file operations
3. ✅ **Microsoft Office 365** - For email and document management

### Phase 2: Enhanced Productivity
4. ✅ **OttoKit MCP** - For app integrations (Slack, Google Sheets, etc.)
5. ✅ **Web Search MCP** - For research capabilities

### Phase 3: Advanced Features
6. ✅ **GitHub MCP** - For version control
7. ✅ **Database MCP** - For advanced queries
8. ✅ **Nanobot Framework** - For enhanced AI agent capabilities

---

## 💡 Integration Scenarios

### Scenario 1: Product Quote Workflow
```
User: "Create a quote for 50 backpacks and email it to customer@example.com"
→ BMAC MCP: Fetch product details and prices
→ Excel MCP: Generate formatted quote document
→ Outlook MCP: Send email with quote attachment
→ Slack MCP: Notify sales team
```

### Scenario 2: Product Research
```
User: "Research competitor prices for promotional water bottles"
→ Web Search MCP: Search for competitor products
→ BMAC MCP: Compare with our catalog prices
→ Excel MCP: Create comparison spreadsheet
→ OneDrive MCP: Save report
```

### Scenario 3: Product Import Workflow
```
User: "Import new products from Midocean and notify the team"
→ BMAC MCP: Sync products from Midocean API
→ GitHub MCP: Commit changes to repository
→ Slack MCP: Post notification with product count
→ Google Sheets MCP: Update product tracking sheet
```

---

## 🔧 Troubleshooting

### MCP Server Not Connecting
1. Verify the server path is absolute (not relative)
2. Check that Node.js is installed and accessible
3. Ensure all environment variables are set correctly
4. Check obot.ai logs for connection errors

### Office 365 Authentication Issues
1. Re-authenticate through obot.ai's Connectors section
2. Verify OAuth permissions are granted
3. Check if your organization allows third-party integrations

### OttoKit Integration Problems
1. Verify your endpoint URL is correct
2. Check that selected apps are properly configured
3. Ensure API keys/tokens are valid

---

## 📚 Additional Resources

- [obot.ai MCP Documentation](https://obot.ai)
- [OttoKit MCP Server Guide](https://ottokit.com/mcp-server/)
- [Microsoft Office 365 MCP Setup](https://obot.ai/connecting-microsoft-office-365-mcp-servers-in-obot/)
- [Nanobot Framework Documentation](https://obot.ai/blog/introducing-nanobot-a-new-framework-for-turning-mcp-servers-into-ai-agents/)

---

## 🎯 Quick Start Checklist

- [ ] BMAC MCP Server configured and tested
- [ ] Filesystem MCP added for file operations
- [ ] Microsoft Office 365 MCP connected (Outlook, Excel, OneDrive)
- [ ] OttoKit MCP configured with essential apps (Slack, Google Sheets)
- [ ] Web Search MCP added for research
- [ ] Test basic workflows (product search, quote generation, email)
- [ ] Set up notification workflows (Slack/Teams)
- [ ] Configure automated exports (Excel/Google Sheets)

---

**Last Updated:** 2025-01-27
**Compatible with:** obot.ai, BMAC MCP Server v1.0.0

