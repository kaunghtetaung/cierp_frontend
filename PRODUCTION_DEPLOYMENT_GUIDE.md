# Production Deployment Guide

## 📋 Prerequisites Checklist
- [x] ✅ pnpm installed locally on server
- [x] ✅ Dependencies installed with China mirror
- [x] ✅ All 741 packages successfully installed
- [ ] Docker installed on server
- [ ] Access to Harbor registry
- [ ] Kubernetes cluster access

## 🚀 Complete Production Deployment Steps

### Step 1: Connect to Production Server
```bash
# From your local machine
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
cd ~/ciapp_frontend
```

### Step 2: Pull Latest Code (if needed)
```bash
git pull origin main
```

### Step 3: Install/Update Dependencies
```bash
# Use the China mirror for faster installation
bash ./.aProduction/scripts/install-with-mirror.sh

# OR if already installed, just update
npx pnpm install --registry https://registry.npmmirror.com
```

### Step 4: Build Applications

#### Option A: Build All Applications
```bash
# Build both core and publicWeb
npx pnpm run build

# This will create:
# - apps/core/.next (production build for core)
# - apps/publicWeb/.next (production build for publicWeb)
```

#### Option B: Build Individual Applications
```bash
# Build Core (ERP) only
cd apps/core
npx pnpm run build
cd ../..

# Build PublicWeb only
cd apps/publicWeb
npx pnpm run build
cd ../..
```

### Step 5: Run Production Locally (Testing)
```bash
# Test Core app
cd apps/core
npx pnpm run start  # Runs on port 3000

# Test PublicWeb app
cd apps/publicWeb
npx pnpm run start  # Runs on port 3001
```

### Step 6: Build Docker Images

#### Create Docker Build Script
```bash
cat > ./.aProduction/scripts/build-docker.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "  Building Docker Images"
echo "========================================="

# Set registry
REGISTRY="your-harbor-registry.com/project"
VERSION=$(date +%Y%m%d-%H%M%S)

# Build Core Application
echo "Building Core application..."
docker build \
  -f ./.aProduction/Docker/Dockerfile.core \
  -t $REGISTRY/core:$VERSION \
  -t $REGISTRY/core:latest \
  .

# Build PublicWeb Application
echo "Building PublicWeb application..."
docker build \
  -f ./.aProduction/Docker/Dockerfile.publicWeb \
  -t $REGISTRY/publicweb:$VERSION \
  -t $REGISTRY/publicweb:latest \
  .

echo "✅ Docker images built successfully!"
echo "Images:"
echo "  - $REGISTRY/core:$VERSION"
echo "  - $REGISTRY/publicweb:$VERSION"
EOF

chmod +x ./.aProduction/scripts/build-docker.sh
```

### Step 7: Create Dockerfiles

#### Core Dockerfile
```dockerfile
# .aProduction/Docker/Dockerfile.core
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/core/package.json ./apps/core/
COPY libs/*/package.json ./libs/*/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build:core

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/core/.next ./apps/core/.next
COPY --from=builder /app/apps/core/public ./apps/core/public
COPY --from=builder /app/apps/core/package.json ./apps/core/
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "run", "start:core"]
```

#### PublicWeb Dockerfile
```dockerfile
# .aProduction/Docker/Dockerfile.publicWeb
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/publicWeb/package.json ./apps/publicWeb/
COPY libs/*/package.json ./libs/*/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build:public

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/publicWeb/.next ./apps/publicWeb/.next
COPY --from=builder /app/apps/publicWeb/public ./apps/publicWeb/public
COPY --from=builder /app/apps/publicWeb/package.json ./apps/publicWeb/
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["pnpm", "run", "start:public"]
```

### Step 8: Push to Registry
```bash
# Login to Harbor
docker login your-harbor-registry.com

# Push images
docker push $REGISTRY/core:latest
docker push $REGISTRY/core:$VERSION
docker push $REGISTRY/publicweb:latest
docker push $REGISTRY/publicweb:$VERSION
```

### Step 9: Deploy to Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f ./.aProduction/k8s/core-deployment.yaml
kubectl apply -f ./.aProduction/k8s/publicweb-deployment.yaml

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
```

## 🔧 One-Command Deployment Scripts

### Complete Build & Deploy Script
```bash
cat > ./.aProduction/scripts/deploy-production.sh << 'EOF'
#!/bin/bash

set -e  # Exit on error

echo "========================================="
echo "  FULL PRODUCTION DEPLOYMENT"
echo "========================================="

# Configuration
REGISTRY="your-harbor-registry.com/project"
VERSION=$(date +%Y%m%d-%H%M%S)

# Step 1: Build Applications
echo "📦 Building applications..."
npx pnpm run build

# Step 2: Build Docker Images
echo "🐳 Building Docker images..."
docker build -f ./.aProduction/Docker/Dockerfile.core \
  -t $REGISTRY/core:$VERSION \
  -t $REGISTRY/core:latest .

docker build -f ./.aProduction/Docker/Dockerfile.publicWeb \
  -t $REGISTRY/publicweb:$VERSION \
  -t $REGISTRY/publicweb:latest .

# Step 3: Push to Registry
echo "📤 Pushing to Harbor registry..."
docker push $REGISTRY/core:latest
docker push $REGISTRY/core:$VERSION
docker push $REGISTRY/publicweb:latest
docker push $REGISTRY/publicweb:$VERSION

# Step 4: Deploy to Kubernetes
echo "☸️ Deploying to Kubernetes..."
kubectl set image deployment/core core=$REGISTRY/core:$VERSION
kubectl set image deployment/publicweb publicweb=$REGISTRY/publicweb:$VERSION

# Step 5: Check deployment
echo "✅ Checking deployment status..."
kubectl rollout status deployment/core
kubectl rollout status deployment/publicweb

echo "========================================="
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "  Version: $VERSION"
echo "========================================="
EOF

chmod +x ./.aProduction/scripts/deploy-production.sh
```

## 🎯 Quick Commands Reference

### From Local Machine
```bash
# Full deployment from local
make pushCi                    # Push code to server
make gitlab-deploy             # Run full deployment on server

# Individual steps
make gitlab-install-simple    # Install dependencies
make gitlab-build             # Build applications
```

### On Production Server
```bash
# Install/Update dependencies
npx pnpm install --registry https://registry.npmmirror.com

# Build applications
npx pnpm run build

# Build specific app
cd apps/core && npx pnpm run build
cd apps/publicWeb && npx pnpm run build

# Run production mode locally (testing)
npx pnpm run start:core       # Core on port 3000
npx pnpm run start:public     # PublicWeb on port 3001

# Full deployment
bash ./.aProduction/scripts/deploy-production.sh
```

## 📊 Environment Variables

Create `.env.production` files:

### Core App (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
DATABASE_URL=your_database_url
REDIS_URL=redis://your-redis-server:6379
SESSION_SECRET=your_session_secret
```

### PublicWeb App (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🔍 Verification Steps

1. **Check Build Output**
```bash
# Verify .next directories exist
ls -la apps/core/.next
ls -la apps/publicWeb/.next
```

2. **Test Production Locally**
```bash
NODE_ENV=production npx pnpm run start:core
NODE_ENV=production npx pnpm run start:public
```

3. **Check Docker Images**
```bash
docker images | grep -E "core|publicweb"
```

4. **Verify Kubernetes Deployment**
```bash
kubectl get all
kubectl logs deployment/core
kubectl logs deployment/publicweb
```

## 🚨 Troubleshooting

### Build Failures
```bash
# Clear build cache
rm -rf apps/*/.next
rm -rf .turbo

# Rebuild with verbose output
npx pnpm run build --verbose
```

### Dependency Issues
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
npx pnpm install --registry https://registry.npmmirror.com
```

### Docker Build Issues
```bash
# Build with no cache
docker build --no-cache -f ./.aProduction/Docker/Dockerfile.core .

# Check logs
docker logs <container_id>
```

## 📈 Performance Optimization

1. **Enable Next.js Standalone Mode**
   - Reduces image size by ~70%
   - Add to next.config.js: `output: 'standalone'`

2. **Multi-stage Docker Builds**
   - Already implemented in Dockerfiles above
   - Reduces final image size

3. **CDN for Static Assets**
   - Configure CDN in next.config.js
   - Use `assetPrefix` for CDN URL

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis cache cleared
- [ ] SSL certificates valid
- [ ] Domain DNS configured
- [ ] Monitoring/logging setup
- [ ] Backup created
- [ ] Rollback plan ready

## 🔄 Rollback Procedure

```bash
# Rollback to previous version
kubectl rollout undo deployment/core
kubectl rollout undo deployment/publicweb

# Check rollback status
kubectl rollout status deployment/core
kubectl rollout status deployment/publicweb
```

---

**Last Updated**: November 2024
**Version**: 1.0.0