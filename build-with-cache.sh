#!/bin/bash

# Build script using root Dockerfiles with caching enabled
# These Dockerfiles include cache mounts for faster rebuilds

set -e

# Enable BuildKit for cache mounts
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

echo "========================================="
echo "  Docker Build with Cache Optimization"
echo "========================================="
echo ""

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciapp-frontend"
VERSION="v1.0.0-$(date +%Y%m%d-%H%M%S)"

# Function to build an app
build_app() {
  local APP=$1
  local DOCKERFILE=$2
  local PORT=$3

  echo "Building $APP..."
  echo "  Dockerfile: $DOCKERFILE"
  echo "  Port: $PORT"
  echo ""

  docker build \
    -f "$DOCKERFILE" \
    -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:${VERSION}" \
    -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:latest" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'local')" \
    .

  if [ $? -eq 0 ]; then
    echo "✅ $APP built successfully!"
    echo "  Image: ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:${VERSION}"
  else
    echo "❌ $APP build failed!"
    return 1
  fi
  echo ""
}

# Check which Dockerfiles to use
echo "Checking available Dockerfiles..."
if [ -f "Dockerfile.core" ] && [ -f "Dockerfile.publicWeb" ]; then
  echo "✓ Using root Dockerfiles (with cache optimization)"
  CORE_DOCKERFILE="Dockerfile.core"
  PUBLIC_DOCKERFILE="Dockerfile.publicWeb"
elif [ -f ".aProduction/Docker/Dockerfile.core" ] && [ -f ".aProduction/Docker/Dockerfile.publicWeb" ]; then
  echo "✓ Using .aProduction/Docker Dockerfiles"
  CORE_DOCKERFILE=".aProduction/Docker/Dockerfile.core"
  PUBLIC_DOCKERFILE=".aProduction/Docker/Dockerfile.publicWeb"
else
  echo "❌ No Dockerfiles found!"
  exit 1
fi
echo ""

# Build Core
build_app "core" "$CORE_DOCKERFILE" "3001"

# Build PublicWeb
build_app "publicweb" "$PUBLIC_DOCKERFILE" "3002"

echo "========================================="
echo "  Build Summary"
echo "========================================="
echo ""
echo "Images built:"
docker images "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/*" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""
echo "To push to Harbor:"
echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/core:${VERSION}"
echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/core:latest"
echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/publicweb:${VERSION}"
echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/publicweb:latest"
echo ""
echo "To deploy to Kubernetes:"
echo "  kubectl set image deployment/core core=${HARBOR_REGISTRY}/${HARBOR_PROJECT}/core:${VERSION} -n ciapp-frontend"
echo "  kubectl set image deployment/publicweb publicweb=${HARBOR_REGISTRY}/${HARBOR_PROJECT}/publicweb:${VERSION} -n ciapp-frontend"