# Production Deployment Guide

## 📁 Directory Structure

```
.aProduction/
├── Docker/
│   ├── Dockerfile.core          # Optimized Core app Dockerfile
│   ├── Dockerfile.publicWeb     # Optimized PublicWeb app Dockerfile
│   └── .dockerignore            # Build context exclusions
├── scripts/
│   ├── build-core.sh            # Build Core app only (3-4 min)
│   ├── build-publicweb.sh       # Build PublicWeb app only (3-4 min)
│   ├── build-all.sh             # Build both apps in parallel (3-4 min)
│   ├── build-with-proxy.sh      # Interactive build with proxy support
│   ├── push-to-harbor.sh        # Push images to Harbor registry
│   └── deploy-to-kubernetes.sh  # Deploy to K8s cluster
└── k8s/
    └── [Kubernetes manifests]
```

---

## 🚀 Quick Start

### 1. Build Docker Images

**Build Core app:**
```bash
cd /home/ciadmin/ciapp_frontend
./.aProduction/scripts/build-core.sh
```

**Build PublicWeb app:**
```bash
./.aProduction/scripts/build-publicweb.sh
```

**Build both apps in parallel (recommended for production):**
```bash
./.aProduction/scripts/build-all.sh
```

**Build with proxy support:**
```bash
./.aProduction/scripts/build-with-proxy.sh
```

### 2. Push to Harbor Registry

```bash
./.aProduction/scripts/push-to-harbor.sh
```

### 3. Deploy to Kubernetes

```bash
./.aProduction/scripts/deploy-to-kubernetes.sh
```

---

## 🔧 Docker Configuration

### Dockerfiles

Both `Dockerfile.core` and `Dockerfile.publicWeb` use:
- **Single-stage build** - Preserves pnpm workspace symlinks
- **BuildKit cache mounts** - Faster rebuilds
- **Proxy support** - Reliable builds through corporate proxies
- **Thailand mirror** - For Alpine packages (Myanmar ISP compatibility)
- **Non-root user** - Security best practice

### .dockerignore

Excludes unnecessary files to reduce build context:
- `node_modules/` - Installed fresh in Docker
- `.next/` - Built fresh in Docker
- `.git/` - Not needed in container
- Build artifacts and documentation

---

## 📊 Build Performance

| Metric | Time |
|--------|------|
| Build Context Transfer | ~1.4s |
| pnpm install | ~12s |
| Next.js build | ~120s |
| **Total Build Time** | **~3.5 min** |

### Image Sizes
- Core: ~4.2 GB
- PublicWeb: ~4.2 GB

---

## 🛠️ Build Scripts

### build-core.sh
Builds Core app Docker image
- **Input:** `/home/ciadmin/ciapp_frontend`
- **Output:** `192.168.200.41/ciapp-frontend/core:latest`
- **Time:** ~3-4 minutes

### build-publicweb.sh
Builds PublicWeb app Docker image
- **Input:** `/home/ciadmin/ciapp_frontend`
- **Output:** `192.168.200.41/ciapp-frontend/publicweb:latest`
- **Time:** ~3-4 minutes

### build-all.sh
Builds both apps in parallel
- **Output:** Both Core and PublicWeb images
- **Time:** ~3-4 minutes (parallel execution)

### build-with-proxy.sh
Interactive build with proxy support
- Auto-detects system proxy settings
- Lets you choose which app(s) to build
- Passes proxy configuration to Docker

### push-to-harbor.sh
Pushes images to Harbor registry
- Registry: `192.168.200.41`
- Project: `ciapp-frontend`

### deploy-to-kubernetes.sh
Deploys images to Kubernetes cluster
- Namespace: `ciapp-frontend`
- Updates deployments with latest images

---

## 🔍 Dockerfile Details

### Key Features

#### 1. Workspace Symlink Preservation
```dockerfile
# Copy everything first
COPY . .

# Install IN PLACE (preserves symlinks)
RUN pnpm install --no-frozen-lockfile

# Build IN PLACE (workspace packages work)
WORKDIR /app/apps/core
RUN pnpm build
```

#### 2. BuildKit Cache Mounts
```dockerfile
# pnpm store cache
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --no-frozen-lockfile

# Next.js build cache
RUN --mount=type=cache,target=/app/apps/core/.next/cache \
    pnpm build
```

#### 3. Proxy Support
```dockerfile
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY}
```

#### 4. Optimized pnpm Configuration
```dockerfile
RUN pnpm config set store-dir /root/.pnpm-store && \
    pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5
```

---

## 📝 Usage Examples

### Development Workflow

```bash
# 1. Make code changes
vim apps/core/src/...

# 2. Build Core image
./.aProduction/scripts/build-core.sh

# 3. Push to Harbor
./.aProduction/scripts/push-to-harbor.sh

# 4. Deploy to K8s
./.aProduction/scripts/deploy-to-kubernetes.sh
```

### Production Release

```bash
# 1. Build both apps in parallel
./.aProduction/scripts/build-all.sh

# 2. Push all images
./.aProduction/scripts/push-to-harbor.sh

# 3. Deploy to production
./.aProduction/scripts/deploy-to-kubernetes.sh
```

### Build with Proxy

```bash
# Set proxy environment variables
export HTTP_PROXY="http://proxy:8080"
export HTTPS_PROXY="http://proxy:8080"

# Build with proxy support
./.aProduction/scripts/build-with-proxy.sh
# Select option: 1 (Core), 2 (PublicWeb), or 3 (Both)
```

---

## 🐛 Troubleshooting

### Build Fails with Module Not Found

**Problem:**
```
Module not found: Can't resolve '@repo/schema-utils'
```

**Solution:**
This should be fixed with the single-stage Dockerfile. Ensure you're using the latest Dockerfiles from `.aProduction/Docker/`.

### Slow pnpm install

**Solution:**
1. Ensure BuildKit is enabled: `export DOCKER_BUILDKIT=1`
2. Check Docker version: `docker version` (should be 19.03+)
3. Cache should speed up subsequent builds

### Proxy Timeout

**Solution:**
Use the proxy build script:
```bash
./.aProduction/scripts/build-with-proxy.sh
```

### Out of Disk Space

**Solution:**
```bash
# Check disk usage
docker system df

# Clean old images
docker image prune -a

# Clean old build cache
docker builder prune --filter "until=168h"
```

---

## 🔐 Harbor Registry

- **URL:** `192.168.200.41`
- **Project:** `ciapp-frontend`
- **Images:**
  - `ciapp-frontend/core:latest`
  - `ciapp-frontend/core:v1.0.0-<timestamp>`
  - `ciapp-frontend/publicweb:latest`
  - `ciapp-frontend/publicweb:v1.0.0-<timestamp>`

---

## ☸️ Kubernetes Deployment

- **Namespace:** `ciapp-frontend`
- **Deployments:**
  - `core` - Core application (port 3001)
  - `publicweb` - PublicWeb application (port 3002)

---

## 📂 File Reference

### Dockerfiles
- `Docker/Dockerfile.core` - Core app Dockerfile
- `Docker/Dockerfile.publicWeb` - PublicWeb app Dockerfile
- `Docker/.dockerignore` - Build context exclusions

### Build Scripts
- `scripts/build-core.sh` - Build Core app
- `scripts/build-publicweb.sh` - Build PublicWeb app
- `scripts/build-all.sh` - Build both apps in parallel
- `scripts/build-with-proxy.sh` - Build with proxy support

### Deployment Scripts
- `scripts/push-to-harbor.sh` - Push to Harbor registry
- `scripts/deploy-to-kubernetes.sh` - Deploy to Kubernetes

---

## 🎯 Best Practices

### Daily Development
1. Build only the app you're working on (`build-core.sh` or `build-publicweb.sh`)
2. Push to Harbor for testing
3. Deploy to dev/staging environment first

### Production Releases
1. Build both apps in parallel (`build-all.sh`)
2. Tag with version number
3. Push to Harbor
4. Deploy to production with specific version tags
5. Verify deployment health

### Cache Management
- BuildKit cache persists automatically
- Weekly: Test builds to keep cache warm
- Monthly: Clean old cache with `docker builder prune`

---

**Last Updated:** November 16, 2025
**Build System:** Docker BuildKit
**Build Time:** ~3.5 minutes per app
**Status:** ✅ Production Ready
