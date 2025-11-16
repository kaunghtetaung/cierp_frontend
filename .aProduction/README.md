# Frontend Production Deployment Guide

## Overview

This guide documents the production deployment process for the frontend applications (Core and PublicWeb) to Kubernetes using Harbor registry.

## Architecture

- **Harbor Registry**: `192.168.200.41/ciapp-frontend`
- **Kubernetes Namespace**: `ciapp-frontend`
- **Applications**:
  - **Core**: Main ERP application
  - **PublicWeb**: Public multi-tenant website

## Key Features

### 1. NPM Cache Optimization
The Docker builds use BuildKit cache mounts to preserve npm/pnpm cache between builds:
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.pnpm-store \
    npm ci || pnpm install
```
This significantly speeds up rebuilds by caching downloaded packages.

### 2. Multi-Stage Builds
- **deps**: Install dependencies with cache
- **builder**: Build Next.js applications
- **runner**: Minimal production image

### 3. Standalone Next.js Builds
Uses Next.js standalone output for smaller Docker images (~200-300MB vs 1.5GB).

## Prerequisites

1. **Docker with BuildKit**:
   ```bash
   export DOCKER_BUILDKIT=1
   # Or install buildx for better performance
   ```

2. **Harbor Access**:
   - Registry: `192.168.200.41`
   - Project: `ciapp-frontend`
   - Credentials set as environment variables

3. **Kubernetes Access**:
   - SSH key: `~/.ssh/ciservers`
   - K8s master: `192.168.200.11`

## Directory Structure

```
.aProduction/
├── Docker/
│   ├── Dockerfile.core        # Core app Dockerfile
│   └── Dockerfile.publicWeb   # PublicWeb Dockerfile
├── k8s/
│   ├── namespace.yaml         # Namespace definition
│   ├── core/
│   │   └── deployment.yaml    # Core deployment & service
│   └── publicWeb/
│       └── deployment.yaml    # PublicWeb deployment & service
└── scripts/
    ├── build-frontend-services.sh  # Build all services
    ├── build-single-frontend.sh    # Build single service
    ├── push-to-harbor.sh           # Push to Harbor
    └── deploy-to-kubernetes.sh     # Deploy to K8s
```

## Deployment Process

### Step 1: Build Docker Images

Build all frontend services:
```bash
./.aProduction/scripts/build-frontend-services.sh
```

Or build a single service:
```bash
./.aProduction/scripts/build-single-frontend.sh core
./.aProduction/scripts/build-single-frontend.sh publicWeb
```

**Features**:
- Uses npm cache mounts for faster rebuilds
- Multi-stage builds for optimized images
- Thailand Alpine mirror for network reliability
- Automatic cleanup of dangling images

### Step 2: Push to Harbor

Push built images to Harbor registry:
```bash
# Set credentials (or export as env vars)
export HARBOR_USER=admin
export HARBOR_PASS=your-password

# Push images
./.aProduction/scripts/push-to-harbor.sh
```

### Step 3: Deploy to Kubernetes

Deploy services to Kubernetes cluster:
```bash
./.aProduction/scripts/deploy-to-kubernetes.sh
```

**What it does**:
- Creates namespace if needed
- Deploys both applications
- Shows deployment status
- Configures 2 replicas per service

## Configuration

### Environment Variables

Key environment variables configured in K8s deployments:

```yaml
- NODE_ENV: production
- NEXT_PUBLIC_API_URL: https://api.mmhub.info
- REDIS_HOST: 192.168.200.32
- MINIO_ENDPOINT: 192.168.200.33
```

### Resource Limits

Each pod is configured with:
- **Requests**: 512Mi RAM, 250m CPU
- **Limits**: 1Gi RAM, 500m CPU

### Health Checks

- **Liveness Probe**: `/api/health` every 10s
- **Readiness Probe**: `/api/health` every 5s

## Monitoring

### Check Deployment Status
```bash
kubectl get deployments -n ciapp-frontend
kubectl get pods -n ciapp-frontend -o wide
```

### View Logs
```bash
kubectl logs -n ciapp-frontend deployment/core
kubectl logs -n ciapp-frontend deployment/publicweb
```

### Port Forward for Testing
```bash
# Core application
kubectl port-forward -n ciapp-frontend svc/core 3000:3000

# PublicWeb
kubectl port-forward -n ciapp-frontend svc/publicweb 3001:3000
```

## CI/CD Integration

The scripts support GitLab CI variables:
- `CI_PIPELINE_ID`: Build number
- `CI_COMMIT_REF_NAME`: Branch name
- `CI_COMMIT_SHORT_SHA`: Git commit hash

Version tagging format: `v{VERSION}-{BRANCH}.{PIPELINE_ID}`

## Troubleshooting

### Build Issues

1. **NPM Cache Not Working**:
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Network Issues**:
   - Uses Thailand mirrors for Alpine and npm
   - Check network connectivity to mirrors

3. **Out of Memory**:
   - Next.js builds require significant RAM
   - Increase Docker memory limits

### Deployment Issues

1. **Pods Not Starting**:
   ```bash
   kubectl describe pod -n ciapp-frontend <pod-name>
   ```

2. **Image Pull Errors**:
   - Verify Harbor credentials
   - Check image exists in Harbor

3. **Health Check Failures**:
   - Ensure `/api/health` endpoint exists
   - Check application logs

## Best Practices

1. **Version Management**:
   - Update VERSION file before builds
   - Use semantic versioning

2. **Security**:
   - Never commit secrets to repository
   - Use K8s secrets for sensitive data
   - Run containers as non-root user

3. **Performance**:
   - Enable BuildKit for cache mounts
   - Use standalone Next.js builds
   - Configure appropriate resource limits

4. **Monitoring**:
   - Implement comprehensive health checks
   - Set up logging aggregation
   - Monitor resource usage

## Quick Commands

```bash
# Full deployment pipeline
./.aProduction/scripts/build-frontend-services.sh && \
./.aProduction/scripts/push-to-harbor.sh && \
./.aProduction/scripts/deploy-to-kubernetes.sh

# Check everything
kubectl get all -n ciapp-frontend

# Restart deployment
kubectl rollout restart deployment/core -n ciapp-frontend
kubectl rollout restart deployment/publicweb -n ciapp-frontend

# Scale deployment
kubectl scale deployment/core --replicas=3 -n ciapp-frontend
```

## Support

For issues or questions:
- Check application logs first
- Review Harbor registry for image status
- Verify K8s cluster health
- Check network connectivity between services