#!/bin/bash

# Quick Kubernetes Deployment Script

echo "========================================="
echo "  KUBERNETES QUICK DEPLOYMENT"
echo "========================================="
echo ""

HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciapp-frontend"
VERSION="v1.0.0-quick-$(date +%Y%m%d%H%M%S)"

# Step 1: Use minimal Dockerfiles
echo "Step 1: Setting up minimal Dockerfiles..."
cp .aProduction/Docker/Dockerfile.core.minimal .aProduction/Docker/Dockerfile.core
cp .aProduction/Docker/Dockerfile.core.minimal .aProduction/Docker/Dockerfile.publicWeb
# Adjust publicWeb dockerfile
sed -i 's/apps\/core/apps\/publicWeb/g' .aProduction/Docker/Dockerfile.publicWeb
sed -i 's/PORT=3000/PORT=3001/g' .aProduction/Docker/Dockerfile.publicWeb
sed -i 's/EXPOSE 3000/EXPOSE 3001/g' .aProduction/Docker/Dockerfile.publicWeb

# Step 2: Build Docker images (simpler approach)
echo ""
echo "Step 2: Building Docker images..."

# Build Core
echo "Building Core image..."
docker build -f .aProduction/Docker/Dockerfile.core \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/core:latest \
  . || {
    echo "Core build failed, trying with buildkit disabled..."
    DOCKER_BUILDKIT=0 docker build -f .aProduction/Docker/Dockerfile.core \
      -t $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION \
      -t $HARBOR_REGISTRY/$HARBOR_PROJECT/core:latest \
      .
  }

# Build PublicWeb
echo "Building PublicWeb image..."
docker build -f .aProduction/Docker/Dockerfile.publicWeb \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION \
  -t $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:latest \
  . || {
    echo "PublicWeb build failed, trying with buildkit disabled..."
    DOCKER_BUILDKIT=0 docker build -f .aProduction/Docker/Dockerfile.publicWeb \
      -t $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION \
      -t $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:latest \
      .
  }

# Step 3: Push to Harbor
echo ""
echo "Step 3: Pushing to Harbor registry..."
docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION
docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/core:latest
docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION
docker push $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:latest

# Step 4: Deploy to Kubernetes
echo ""
echo "Step 4: Deploying to Kubernetes..."

# Update deployments with new image
kubectl set image deployment/core core=$HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION -n ciapp-frontend
kubectl set image deployment/publicweb publicweb=$HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION -n ciapp-frontend

# Check rollout status
kubectl rollout status deployment/core -n ciapp-frontend
kubectl rollout status deployment/publicweb -n ciapp-frontend

echo ""
echo "========================================="
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Images pushed:"
echo "  - $HARBOR_REGISTRY/$HARBOR_PROJECT/core:$VERSION"
echo "  - $HARBOR_REGISTRY/$HARBOR_PROJECT/publicweb:$VERSION"
echo ""
echo "Check status:"
echo "  kubectl get pods -n ciapp-frontend"
echo "  kubectl logs -f deployment/core -n ciapp-frontend"