# Docker Setup for BMAC MCP Server

## Building the Docker Image

```bash
cd bmac-mcp-server
docker build -t bmac-mcp-server .
```

## Running the Container

### Basic Run

```bash
docker run --rm -it \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5433/bmac_demo_start" \
  bmac-mcp-server
```

### Using Docker Compose

```bash
# Create a .env file with your DATABASE_URL
echo "DATABASE_URL=postgresql://postgres:password@host.docker.internal:5433/bmac_demo_start" > .env

# Start the container
docker-compose up -d

# Access the container shell (with nano editor)
docker-compose exec bmac-mcp-server bash

# Stop the container
docker-compose down
```

## Using with MCP Clients

Since MCP servers communicate via stdio, you can use the Docker container with MCP clients like this:

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "bmac": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "DATABASE_URL=postgresql://postgres:password@host.docker.internal:5433/bmac_demo_start",
        "bmac-mcp-server"
      ]
    }
  }
}
```

### Cursor Configuration

Similar to Claude Desktop, configure Cursor to use Docker:

```json
{
  "mcpServers": {
    "bmac": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "DATABASE_URL=postgresql://postgres:password@host.docker.internal:5433/bmac_demo_start",
        "bmac-mcp-server"
      ]
    }
  }
}
```

## Development Mode

For development, you can mount the source code:

```bash
docker run --rm -it \
  -v $(pwd):/app \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5433/bmac_demo_start" \
  bmac-mcp-server \
  npm run dev
```

## Accessing the Container Shell

The container includes `nano` editor for file editing:

```bash
# Start container in interactive mode
docker run --rm -it \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5433/bmac_demo_start" \
  bmac-mcp-server \
  bash

# Inside the container, you can use nano
nano dist/index.js
```

## Notes

- The server communicates via stdio, so no ports need to be exposed
- Use `host.docker.internal` to access the database running on the host machine
- For production, consider using a proper database connection string pointing to your database service
- The container runs as a non-root user (`mcpuser`) for security

