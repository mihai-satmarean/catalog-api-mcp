# Use official Node.js runtime as base image
FROM node:20-slim

# Install nano editor for file editing
RUN apt-get update && apt-get install -y nano && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code and configuration files
COPY . .

# Build the TypeScript project
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Create a non-root user for security
RUN useradd -m -u 1000 mcpuser && chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# The server communicates via stdio, so no port exposure needed
# MCP servers are typically invoked directly by MCP clients

# Default command to run the server
CMD ["node", "dist/index.js"]

