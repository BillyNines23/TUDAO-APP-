# Build stage
FROM node:20-slim AS builder

# Build arguments for frontend environment
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy source files
COPY . .

# Build the application (Vite frontend + esbuild server bundle)
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from builder
# Frontend assets (Vite output)
COPY --from=builder /app/dist/public ./dist/public
# Server bundle (esbuild output)
COPY --from=builder /app/dist/index.js ./dist/index.js

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["npm", "run", "start"]
