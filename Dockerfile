# 🐳 EasyCashFlows Docker Production Image
# Immagine ottimizzata per deployment cliente con auto-setup schema DB

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY scripts/ ./scripts/

# Build frontend and backend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    postgresql-client

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S easycashflows -u 1001

# Set ownership
RUN chown -R easycashflows:nodejs /app
USER easycashflows

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/api/auth/user || exit 1

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Startup script with auto-deployment
COPY <<EOF /app/start.sh
#!/bin/bash
set -e

echo "🐳 Starting EasyCashFlows Docker container..."

# Validate required environment variables
if [ -z "\$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is required"
    echo "ℹ️  Set DATABASE_URL to your Neon database connection string"
    exit 1
fi

echo "✅ Environment validated"

# Run database deployment/migration
echo "🔄 Setting up database schema..."
npx tsx scripts/deploy-docker.ts

if [ \$? -eq 0 ]; then
    echo "✅ Database setup completed"
else
    echo "❌ Database setup failed"
    exit 1
fi

# Start the application
echo "🚀 Starting EasyCashFlows server..."
exec node dist/index.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]

# Labels for metadata
LABEL maintainer="EasyCashFlows Team"
LABEL version="1.0.0"
LABEL description="EasyCashFlows - Italian Financial Management System"
LABEL com.easycashflows.auto-deploy="true"
LABEL com.easycashflows.database="neon-postgresql"