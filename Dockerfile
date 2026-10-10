# Multi-platform lightweight Node.js container
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

# Copy application manifests and code
COPY package.json ./
COPY . .

# Expose HTTP & WebSocket server port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Launch production server
CMD ["node", "server.js"]
