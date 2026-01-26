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
  -v /path/to/sqlite.db:/app/data/sqlite.db \
  -e DATABASE_URL="/app/data/sqlite.db" \
  bmac-mcp-server
```

**Note**: Replace `/path/to/sqlite.db` with the actual path to your SQLite database file on the host machine.

### Using Docker Compose

```bash
# Create a .env file with your DATABASE_URL
echo "DATABASE_URL=/app/data/sqlite.db" > .env

# Start the container (make sure to mount the SQLite database file)
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
        "-v",
        "/path/to/sqlite.db:/app/data/sqlite.db",
        "-e",
        "DATABASE_URL=/app/data/sqlite.db",
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
        "-v",
        "/path/to/sqlite.db:/app/data/sqlite.db",
        "-e",
        "DATABASE_URL=/app/data/sqlite.db",
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
  -v /path/to/sqlite.db:/app/data/sqlite.db \
  -e DATABASE_URL="/app/data/sqlite.db" \
  bmac-mcp-server \
  npm run dev
```

## Accessing the Container Shell

The container includes `nano` editor for file editing:

```bash
# Start container in interactive mode
docker run --rm -it \
  -v /path/to/sqlite.db:/app/data/sqlite.db \
  -e DATABASE_URL="/app/data/sqlite.db" \
  bmac-mcp-server \
  bash

# Inside the container, you can use nano
nano dist/index.js
```

## Notes

- The server communicates via stdio, so no ports need to be exposed
- SQLite is a file-based database, so you must mount the database file as a volume
- Replace `/path/to/sqlite.db` with the actual path to your SQLite database file
- The database file path inside the container is `/app/data/sqlite.db` by default
- Ensure the mounted database file has proper read/write permissions
- The container runs as a non-root user (`mcpuser`) for security

