# Catalog API MCP Server - Docker Build Guide

This guide explains how to build and deploy the Catalog API MCP Server Docker image.

## Architecture

The Catalog API MCP Server uses the obot platform base image (`ghcr.io/obot-platform/mcp-images-phat:main`) to run as a containerized MCP server.

## Prerequisites

- Docker installed and running
- Node.js 20+ for building TypeScript
- Access to GitHub Container Registry (for pushing images)

## Local Build

### Quick Build

Use the provided build script:

```bash
./build-docker.sh
```

### Manual Build

1. **Build TypeScript**:
```bash
cd bmac-mcp-server
npm ci
npm run build
cd ..
```

2. **Build Docker Image**:
```bash
docker build -f Dockerfile.mcp -t ghcr.io/mihai-satmarean/catalog-api-mcp:latest .
```

## Testing Locally

Run the container with your database URL:

```bash
docker run -e DATABASE_URL='postgresql://user:password@host:port/database' \
  -p 3000:3000 \
  ghcr.io/mihai-satmarean/catalog-api-mcp:latest
```

## Automatic Builds (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically builds and pushes Docker images when:

- Code is pushed to `main` or `master` branches (in `bmac-mcp-server/` directory)
- A tag starting with `v` is pushed (e.g., `v1.0.0`)
- Manually triggered via GitHub Actions UI

### Image Tags

The workflow automatically creates the following tags:

- `latest` - Latest build from main/master branch
- `main` or `master` - Branch name
- `v1.0.0`, `v1.0`, `v1` - Semantic version tags (when pushing git tags)

## Pushing to GitHub Container Registry

1. **Authenticate with GitHub**:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

2. **Push the image**:
```bash
docker push ghcr.io/mihai-satmarean/catalog-api-mcp:latest
```

## Using the Image

### In MCP Configuration

```json
{
  "mcpServers": {
    "bmac": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "DATABASE_URL=postgresql://...",
        "ghcr.io/mihai-satmarean/catalog-api-mcp:latest"
      ]
    }
  }
}
```

### With Obot/Smithery

The image is designed to work with the Obot platform and can be deployed using the `bmac.yaml` configuration file.

## Configuration

### Environment Variables

- `DATABASE_URL` (required): PostgreSQL connection string
- `PORT` (optional): Server port (default: 3000)

### Ports

- Port `3000`: HTTP endpoint for MCP communication (`/mcp` path)

## Troubleshooting

### Build Fails

- Ensure Node.js dependencies are installed: `cd bmac-mcp-server && npm ci`
- Check that TypeScript compiles: `npm run build`

### Container Won't Start

- Verify DATABASE_URL is correctly formatted
- Check container logs: `docker logs <container-id>`

### Connection Issues

- Ensure database is accessible from the container
- For local databases, use host.docker.internal instead of localhost
- Check firewall/network settings

## Multi-Architecture Support

The GitHub Actions workflow builds for both:
- `linux/amd64` (Intel/AMD processors)
- `linux/arm64` (Apple Silicon, ARM servers)

## Version Management

To create a new release:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This triggers an automatic build with proper version tags.

