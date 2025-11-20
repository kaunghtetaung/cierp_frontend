#!/bin/bash

# =================================================================
# Push Docker Images to Harbor Registry
# Works with build-all.sh output (timestamped versions)
# =================================================================

set -e

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciappfrontend"
HARBOR_USER="${HARBOR_USER:-admin}"
HARBOR_PASS="${HARBOR_PASS:-Cryst@l123!}"

echo "========================================="
echo "  Pushing Images to Harbor Registry"
echo "========================================="
echo ""

# Step 1: Login to Harbor
echo "Step 1: Logging in to Harbor..."
echo "${HARBOR_PASS}" | docker login ${HARBOR_REGISTRY} -u ${HARBOR_USER} --password-stdin

if [ $? -ne 0 ]; then
  echo "❌ Failed to login to Harbor"
  echo "Please check credentials"
  exit 1
fi

echo "✅ Successfully logged in to Harbor"
echo ""

# Step 2: Find images to push
echo "Step 2: Finding images to push..."
echo ""

# Find all core and publicweb images
CORE_IMAGES=$(docker images "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/core" --format "{{.Repository}}:{{.Tag}}" | grep -v '<none>')
PUBLICWEB_IMAGES=$(docker images "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/publicweb" --format "{{.Repository}}:{{.Tag}}" | grep -v '<none>')

if [ -z "$CORE_IMAGES" ] && [ -z "$PUBLICWEB_IMAGES" ]; then
  echo "❌ No images found to push!"
  echo "Please build images first using: bash .aProduction/scripts/build-all.sh"
  docker logout ${HARBOR_REGISTRY}
  exit 1
fi

# Step 3: Push images
echo "Step 3: Pushing images..."
echo ""

PUSHED=0
FAILED=0

# Push core images
if [ -n "$CORE_IMAGES" ]; then
  echo "--- Core Images ---"
  for image in $CORE_IMAGES; do
    echo "Pushing: $image"
    if docker push "$image"; then
      echo "✅ Pushed: $image"
      PUSHED=$((PUSHED + 1))
    else
      echo "❌ Failed: $image"
      FAILED=$((FAILED + 1))
    fi
    echo ""
  done
fi

# Push publicweb images
if [ -n "$PUBLICWEB_IMAGES" ]; then
  echo "--- PublicWeb Images ---"
  for image in $PUBLICWEB_IMAGES; do
    echo "Pushing: $image"
    if docker push "$image"; then
      echo "✅ Pushed: $image"
      PUSHED=$((PUSHED + 1))
    else
      echo "❌ Failed: $image"
      FAILED=$((FAILED + 1))
    fi
    echo ""
  done
fi

# Step 4: Logout
echo "Step 4: Logging out from Harbor..."
docker logout ${HARBOR_REGISTRY}
echo ""

# Summary
echo "========================================="
if [ $FAILED -eq 0 ]; then
  echo "  ✅ All Images Pushed Successfully!"
else
  echo "  ⚠️  Push Completed with Errors"
fi
echo "========================================="
echo ""
echo "📊 Statistics:"
echo "  ✅ Pushed: $PUSHED images"
echo "  ❌ Failed: $FAILED images"
echo ""
echo "📁 Harbor Project URL:"
echo "   https://${HARBOR_REGISTRY}/harbor/projects/${HARBOR_PROJECT}/repositories"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎯 Next steps:"
  echo "   1. Verify images in Harbor UI"
  echo "   2. Deploy to K8s: kubectl apply -f .aProduction/k8s/"
  echo ""
  exit 0
else
  exit 1
fi
