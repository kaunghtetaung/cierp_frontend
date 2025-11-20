#!/bin/bash

# Quick build script that handles dependency issues
# This builds Next.js locally first, then creates Docker image

echo "========================================="
echo "  Quick Kubernetes Build Solution"
echo "========================================="
echo ""

HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciapp-frontend"
VERSION="v1.0.0-$(date +%Y%m%d-%H%M%S)"

# Step 1: Build locally first
echo "Step 1: Building Next.js apps locally..."
echo "This ensures all dependencies are resolved"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npx pnpm install --no-frozen-lockfile
fi

# Build Core
echo "Building Core app..."
cd apps/core
npx next build || {
  echo "Build failed, trying with more memory..."
  NODE_OPTIONS="--max-old-space-size=4096" npx next build
}
cd ../..

# Build PublicWeb
echo "Building PublicWeb app..."
cd apps/publicWeb
npx next build || {
  echo "Build failed, trying with more memory..."
  NODE_OPTIONS="--max-old-space-size=4096" npx next build
}
cd ../..

echo ""
echo "Step 2: Creating Docker images with pre-built apps..."

# Create simplified Dockerfiles that use pre-built apps
cat > Dockerfile.core.prebuilt << 'EOF'
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat dumb-init

# Copy everything (including built .next directories)
COPY . .

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
RUN pnpm install --prod --no-frozen-lockfile

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/core/server.js"]
EOF

cat > Dockerfile.publicWeb.prebuilt << 'EOF'
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat dumb-init

# Copy everything (including built .next directories)
COPY . .

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
RUN pnpm install --prod --no-frozen-lockfile

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

EXPOSE 3002

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/publicWeb/server.js"]
EOF

# Build Docker images
echo ""
echo "Building Docker images..."

docker build -f Dockerfile.core.prebuilt \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/core:latest .

docker build -f Dockerfile.publicWeb.prebuilt \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:latest .

echo ""
echo "========================================="
echo "  BUILD COMPLETE!"
echo "========================================="
echo ""
echo "Images built:"
echo "  - $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION"
echo "  - $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION"
echo ""
echo "To push to Harbor:"
echo "  docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION"
echo "  docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION"
echo ""
echo "To deploy to Kubernetes:"
echo "  kubectl set image deployment/core core=$HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION -n ciapp-frontend"
echo "  kubectl set image deployment/publicweb publicweb=$HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION -n ciapp-frontend"