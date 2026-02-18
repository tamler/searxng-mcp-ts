# ===========================================
# Stage 1: Build
# ===========================================
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (ignore scripts to avoid prepare script)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build the project
RUN pnpm run build

# ===========================================
# Stage 2: Production
# ===========================================
FROM node:24-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies (ignore scripts to avoid build)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built files from builder
COPY --from=builder /app/build ./build

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Change ownership
RUN chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# Build argument for port (used in EXPOSE)
ARG PORT=3000

# Environment variables defaults
ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOST=0.0.0.0

# Expose the HTTP port (uses ARG, actual mapping done at runtime)
EXPOSE ${PORT}

# Health check (uses PORT env var at runtime)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Default command: HTTP server
CMD ["node", "build/http.js"]
