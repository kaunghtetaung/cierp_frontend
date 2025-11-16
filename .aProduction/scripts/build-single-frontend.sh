#!/bin/bash

# Build Single Frontend Service Script
# Usage: ./build-single-frontend.sh <service-name>
# Example: ./build-single-frontend.sh core

set -e

# Enable BuildKit for cache mounts (npm cache optimization)
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

if docker buildx version &>/dev/null; then
  echo "✓ BuildKit with buildx detected - npm cache will be optimized"
else
  echo "⚠ Warning: buildx not installed - npm cache mounts will not work"
  echo "  Install buildx for faster builds with cached npm packages"
  echo ""
fi

SERVICE=$1

if [ -z "$SERVICE" ]; then
  echo "Usage: $0 <service-name>"
  echo ""
  echo "Available services:"
  echo "  - core       : Main ERP application"
  echo "  - publicWeb  : Public multi-tenant website"
  echo ""
  echo "Example: $0 core"
  exit 1
fi

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciapp-frontend"
DOCKER_DIR=".aProduction/Docker"

# Load version
export BASE_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
export IMAGE_TAG="v${BASE_VERSION}-${CI_COMMIT_REF_NAME:-main}.${CI_PIPELINE_ID:-local}"

echo "========================================"
echo "  Building Frontend Service: ${SERVICE}"
echo "========================================"
echo "  Version: ${IMAGE_TAG}"
echo "  Harbor: ${HARBOR_REGISTRY}/${HARBOR_PROJECT}"
echo ""

# Set build context based on service
if [ "$SERVICE" = "core" ]; then
  CONTEXT_DIR="."
  APP_PATH="apps/core"
  echo "Building core application from: ${CONTEXT_DIR}"
elif [ "$SERVICE" = "publicWeb" ]; then
  CONTEXT_DIR="."
  APP_PATH="apps/publicWeb"
  echo "Building publicWeb application from: ${CONTEXT_DIR}"
else
  echo "ERROR: Unknown service: ${SERVICE}"
  echo "Available services: core, publicWeb"
  exit 1
fi

# Check if Dockerfile exists
DOCKERFILE="${DOCKER_DIR}/Dockerfile.${SERVICE}"
if [ ! -f "$DOCKERFILE" ]; then
  echo "ERROR: Dockerfile not found: ${DOCKERFILE}"
  exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_PATH" ]; then
  echo "ERROR: Application directory not found: ${APP_PATH}"
  exit 1
fi

echo ""
echo "Step 1: Checking Docker daemon..."
docker version || { echo "ERROR: Docker not running"; exit 1; }

echo ""
echo "Step 2: Checking build context size..."
BUILD_CONTEXT_SIZE=$(tar -czf - ${CONTEXT_DIR} 2>/dev/null | wc -c | awk '{printf "%.1f MB", $1/1024/1024}')
echo "  Build context: ${BUILD_CONTEXT_SIZE}"
echo ""

echo "Step 3: Building image..."
echo "  Dockerfile: ${DOCKERFILE}"
echo "  Context: ${CONTEXT_DIR}"
echo "  Application: ${APP_PATH}"
if [ "$DOCKER_BUILDKIT" = "1" ]; then
  echo "  BuildKit: enabled (npm cache will be preserved)"
else
  echo "  Builder: legacy (consider enabling buildx for cached builds)"
fi
echo ""

# Build with timing
echo "🔨 Starting Docker build..."
time docker build \
  -f "${DOCKERFILE}" \
  -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${SERVICE}:${IMAGE_TAG}" \
  -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${SERVICE}:latest" \
  --build-arg APP_VERSION="${IMAGE_TAG}" \
  --build-arg BASE_VERSION="${BASE_VERSION}" \
  --build-arg GIT_BRANCH="${CI_COMMIT_REF_NAME:-$(git branch --show-current 2>/dev/null || echo 'main')}" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --build-arg VCS_REF="${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')}" \
  --build-arg PIPELINE_ID="${CI_PIPELINE_ID:-local}" \
  "${CONTEXT_DIR}"

BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo ""
  echo "✅ Build successful!"
  echo ""

  # Clean up dangling images to free disk space
  echo "Step 4: Cleaning up dangling images..."
  DANGLING_COUNT=$(docker images -f "dangling=true" -q | wc -l)
  if [ "$DANGLING_COUNT" -gt 0 ]; then
    echo "  Found ${DANGLING_COUNT} dangling images, removing..."
    docker image prune -f
    echo "  ✓ Cleanup complete"
  else
    echo "  ✓ No dangling images found"
  fi

  echo ""
  echo "Image details:"
  docker images "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${SERVICE}" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

  echo ""
  echo "To push to Harbor:"
  echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${SERVICE}:${IMAGE_TAG}"
  echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${SERVICE}:latest"
else
  echo ""
  echo "❌ Build failed with exit code: $BUILD_EXIT"
  echo ""

  # Clean up dangling images even on failure
  echo "Cleaning up dangling images from failed build..."
  docker image prune -f || true

  echo ""
  echo "Common issues:"
  echo "  1. npm/pnpm registry blocked - check network connectivity"
  echo "  2. Missing dependencies - check package.json and pnpm-lock.yaml"
  echo "  3. Build errors - check Next.js configuration"
  echo "  4. Out of memory - Next.js builds require significant RAM"
  echo "  5. Disk full - run: docker system df"
  echo ""
  echo "Tips:"
  echo "  - Enable BuildKit for npm cache: export DOCKER_BUILDKIT=1"
  echo "  - Use Thailand npm mirror if default is blocked"
  echo "  - Check .env files are properly configured"
  exit $BUILD_EXIT
fi