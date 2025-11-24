#!/bin/bash

# =================================================================
# Build All Frontends with Permanent Proxy Configuration
# Uses 192.168.200.4:8888 as proxy server (already running)
# =================================================================

set -e

# Enable BuildKit for cache mounts and parallel builds
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

echo "========================================="
echo "  Build All Frontends (with Proxy)"
echo "  Proxy: 192.168.200.4:8888"
echo "========================================="
echo ""

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciappfrontend"
export BASE_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
export IMAGE_TAG="v${BASE_VERSION}-${CI_COMMIT_REF_NAME:-main}.${CI_PIPELINE_ID:-$(date +%Y%m%d-%H%M%S)}"

# PERMANENT PROXY CONFIGURATION
# Proxy server running on 192.168.200.4:8888
PROXY_SERVER="http://192.168.200.4:8888"
NO_PROXY_LIST="localhost,127.0.0.1,192.168.200.0/24,192.168.200.41,192.168.200.32"

echo "✓ Using proxy: $PROXY_SERVER"
echo "✓ No proxy for: $NO_PROXY_LIST"
echo ""

# Build arguments for proxy
PROXY_ARGS="--build-arg HTTP_PROXY=$PROXY_SERVER"
PROXY_ARGS="$PROXY_ARGS --build-arg HTTPS_PROXY=$PROXY_SERVER"
PROXY_ARGS="$PROXY_ARGS --build-arg http_proxy=$PROXY_SERVER"
PROXY_ARGS="$PROXY_ARGS --build-arg https_proxy=$PROXY_SERVER"
PROXY_ARGS="$PROXY_ARGS --build-arg NO_PROXY=$NO_PROXY_LIST"
PROXY_ARGS="$PROXY_ARGS --build-arg no_proxy=$NO_PROXY_LIST"

# Function to build an app
build_app() {
  local APP=$1
  local DOCKERFILE=$2
  local LOG_FILE="/tmp/docker-build-${APP}.log"

  echo "Building $APP with proxy support..."
  echo "  Dockerfile: $DOCKERFILE"
  echo "  Logs: $LOG_FILE"
  echo ""

  docker build \
    -f "$DOCKERFILE" \
    $PROXY_ARGS \
    -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:${IMAGE_TAG}" \
    -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:latest" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'local')" \
    . > "$LOG_FILE" 2>&1

  if [ $? -eq 0 ]; then
    echo "✅ $APP built successfully!"
    return 0
  else
    echo "❌ $APP build failed! Check $LOG_FILE"
    tail -50 "$LOG_FILE"
    return 1
  fi
}

# Start timer
START_TIME=$(date +%s)

echo "Building both apps in parallel..."
echo ""

# Build both apps in parallel
build_app "core" ".aProduction/Docker/Dockerfile.core" &
CORE_PID=$!

build_app "publicweb" ".aProduction/Docker/Dockerfile.publicWeb" &
PUBLICWEB_PID=$!

# Wait for both builds to complete
CORE_STATUS=0
PUBLICWEB_STATUS=0

wait $CORE_PID || CORE_STATUS=$?
wait $PUBLICWEB_PID || PUBLICWEB_STATUS=$?

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "========================================="
echo "  Build Summary"
echo "========================================="
echo ""
echo "Build time: ${MINUTES}m ${SECONDS}s"
echo "Version: ${IMAGE_TAG}"
echo ""

if [ $CORE_STATUS -eq 0 ] && [ $PUBLICWEB_STATUS -eq 0 ]; then
  echo "✅ All builds completed successfully!"
  echo ""
  echo "Images built:"
  docker images "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/*:${IMAGE_TAG}" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Next Steps"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1️⃣  Push to Harbor:"
  echo "    ./.aProduction/scripts/push-to-harbor.sh"
  echo ""
  echo "2️⃣  Deploy to Kubernetes:"
  echo "    ./.aProduction/scripts/deploy-to-kubernetes-new.sh"
  echo ""
  echo "Or manually:"
  echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/core:${IMAGE_TAG}"
  echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/publicweb:${IMAGE_TAG}"
  echo ""
  exit 0
else
  echo "❌ Some builds failed!"
  [ $CORE_STATUS -ne 0 ] && echo "  - Core build failed (check /tmp/docker-build-core.log)"
  [ $PUBLICWEB_STATUS -ne 0 ] && echo "  - PublicWeb build failed (check /tmp/docker-build-publicweb.log)"
  echo ""
  exit 1
fi
