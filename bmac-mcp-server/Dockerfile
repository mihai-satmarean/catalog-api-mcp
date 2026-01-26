# Production image using obot's base
FROM ghcr.io/obot-platform/mcp-images-phat:v0.15.0

# Copy the pre-built application and dependencies
COPY dist/index.js ./bmac-mcp-server
COPY node_modules ./node_modules
COPY package.json ./package.json

USER root

# Make executable
RUN chmod +x ./bmac-mcp-server

RUN cat > nanobot.yaml <<'EOF'
publish:
  mcpServers: [server]

mcpServers:
  server:
    command: node
    args: [./bmac-mcp-server]
    env:
      DATABASE_URL: ${DATABASE_URL}
EOF

RUN chown 1000 nanobot.yaml

# Set default PORT if not provided
ENV PORT=3000

ENTRYPOINT ["sh", "-c"]

CMD ["nanobot run --listen-address :${PORT} -e DATABASE_URL ./nanobot.yaml"]

USER 1000

