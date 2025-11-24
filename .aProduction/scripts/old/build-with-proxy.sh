#!/bin/bash

# =================================================================
# Build Script with Proxy Support
# Automatically detects and uses system proxy settings
# =================================================================

set -e

# Enable BuildKit
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

echo "========================================="
echo "  Docker Build with Proxy Support"
echo "========================================="
echo ""

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciappfrontend"
VERSION="v1.0.0-$(date +%Y%m%d-%H%M%S)"

# Detect proxy settings from environment
if [ -n "$HTTP_PROXY" ] || [ -n "$http_proxy" ]; then
  DETECTED_HTTP_PROXY="${HTTP_PROXY:-$http_proxy}"
  echo "✓ HTTP Proxy detected: $DETECTED_HTTP_PROXY"
fi

if [ -n "$HTTPS_PROXY" ] || [ -n "$https_proxy" ]; then
  DETECTED_HTTPS_PROXY="${HTTPS_PROXY:-$https_proxy}"
  echo "✓ HTTPS Proxy detected: $DETECTED_HTTPS_PROXY"
fi

if [ -n "$NO_PROXY" ] || [ -n "$no_proxy" ]; then
  DETECTED_NO_PROXY="${NO_PROXY:-$no_proxy}"
  echo "✓ No Proxy list: $DETECTED_NO_PROXY"
fi

# Manual proxy configuration (uncomment and set if needed)
# DETECTED_HTTP_PROXY="http://proxy.example.com:8080"
# DETECTED_HTTPS_PROXY="http://proxy.example.com:8080"
# DETECTED_NO_PROXY="localhost,127.0.0.1,.local"

# Build arguments for proxy
PROXY_ARGS=""
if [ -n "$DETECTED_HTTP_PROXY" ]; then
  PROXY_ARGS="$PROXY_ARGS --build-arg HTTP_PROXY=$DETECTED_HTTP_PROXY"
  PROXY_ARGS="$PROXY_ARGS --build-arg http_proxy=$DETECTED_HTTP_PROXY"
fi
if [ -n "$DETECTED_HTTPS_PROXY" ]; then
  PROXY_ARGS="$PROXY_ARGS --build-arg HTTPS_PROXY=$DETECTED_HTTPS_PROXY"
  PROXY_ARGS="$PROXY_ARGS --build-arg https_proxy=$DETECTED_HTTPS_PROXY"
fi
if [ -n "$DETECTED_NO_PROXY" ]; then
  PROXY_ARGS="$PROXY_ARGS --build-arg NO_PROXY=$DETECTED_NO_PROXY"
  PROXY_ARGS="$PROXY_ARGS --build-arg no_proxy=$DETECTED_NO_PROXY"
fi

echo ""

# Function to build an app
build_app() {
  local APP=$1
  local DOCKERFILE=$2

  echo "Building $APP with proxy support..."
  echo "  Dockerfile: $DOCKERFILE"
  echo ""

  time docker build \
    -f "$DOCKERFILE" \
    $PROXY_ARGS \
    -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:${VERSION}" \
    -t "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${APP}:latest" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'local')" \
    .

  if [ $? -eq 0 ]; then
    echo "✅ $APP built successfully!"
    return 0
  else
    echo "❌ $APP build failed!"
    return 1
  fi
}

# Ask which app to build
echo "Which app do you want to build?"
echo "  1) Core only"
echo "  2) PublicWeb only"
echo "  3) Both (in parallel)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    build_app "core" "Dockerfile.core"
    ;;
  2)
    build_app "publicweb" "Dockerfile.publicWeb"
    ;;
  3)
    echo "Building both apps in parallel..."
    echo ""
    build_app "core" "Dockerfile.core" > /tmp/docker-build-core.log 2>&1 &
    CORE_PID=$!
    build_app "publicweb" "Dockerfile.publicWeb" > /tmp/docker-build-publicweb.log 2>&1 &
    PUBLICWEB_PID=$!

    wait $CORE_PID && echo "✅ Core built" || echo "❌ Core failed (check /tmp/docker-build-core.log)"
    wait $PUBLICWEB_PID && echo "✅ PublicWeb built" || echo "❌ PublicWeb failed (check /tmp/docker-build-publicweb.log)"
    ;;
  *)
    echo "Invalid choice!"
    exit 1
    ;;
esac

echo ""
echo "========================================="
echo "  Build Complete!"
echo "========================================="
echo ""
echo "Images built:"
docker images "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/*" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep -E "(REPOSITORY|$VERSION|latest)" | head -5
echo ""
echo "To push to Harbor:"
echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/core:${VERSION}"
echo "  docker push ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/publicweb:${VERSION}"
