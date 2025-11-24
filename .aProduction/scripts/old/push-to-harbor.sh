#!/bin/bash

# Push Frontend Images to Harbor Registry Script
# This script pushes all built images to Harbor registry

set -e  # Exit on error

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciappfrontend"
HARBOR_USER="${HARBOR_USER:-admin}"
HARBOR_PASS="${HARBOR_PASS:-Cryst@l123!}"

# Load version
export BASE_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
export IMAGE_TAG="v${BASE_VERSION}-${CI_COMMIT_REF_NAME:-main}.${CI_PIPELINE_ID:-local}"

# Services to push
SERVICES="core publicWeb"

echo "════════════════════════════════════════════════════════════════"
echo " 🚢 Pushing Frontend Images to Harbor"
echo "════════════════════════════════════════════════════════════════"
echo " Registry: ${HARBOR_REGISTRY}"
echo " Project: ${HARBOR_PROJECT}"
echo " Version: ${IMAGE_TAG}"
echo " Services: ${SERVICES}"
echo ""

# Login to Harbor
echo "Step 1: Logging in to Harbor registry..."
echo "${HARBOR_PASS}" | docker login ${HARBOR_REGISTRY} -u ${HARBOR_USER} --password-stdin
if [ $? -eq 0 ]; then
  echo "✅ Successfully logged in to Harbor"
else
  echo "❌ Failed to login to Harbor"
  echo "   Check credentials: HARBOR_USER and HARBOR_PASS environment variables"
  exit 1
fi
echo ""

# Track statistics
PUSHED=0
FAILED=0

# Push each service
for service in ${SERVICES}; do
  echo "────────────────────────────────────────────────────────────────"
  echo " 📦 Pushing ${service}..."
  echo ""

  IMAGE="${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${service}"

  # Check if image exists locally
  if docker images ${IMAGE}:${IMAGE_TAG} --format "{{.Repository}}" | grep -q ${IMAGE}; then
    echo "Found image: ${IMAGE}:${IMAGE_TAG}"

    # Push versioned tag
    echo "Pushing ${IMAGE}:${IMAGE_TAG}..."
    if docker push ${IMAGE}:${IMAGE_TAG}; then
      echo "✅ Pushed ${IMAGE}:${IMAGE_TAG}"

      # Push latest tag
      echo "Pushing ${IMAGE}:latest..."
      if docker push ${IMAGE}:latest; then
        echo "✅ Pushed ${IMAGE}:latest"
        PUSHED=$((PUSHED + 1))
      else
        echo "⚠️  Failed to push ${IMAGE}:latest"
      fi
    else
      echo "❌ Failed to push ${IMAGE}:${IMAGE_TAG}"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "❌ Image not found locally: ${IMAGE}:${IMAGE_TAG}"
    echo "   Run build script first: ./.aProduction/scripts/build-frontend-services.sh"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

# Logout from Harbor
echo "Step 2: Logging out from Harbor..."
docker logout ${HARBOR_REGISTRY}
echo ""

# Summary
echo "════════════════════════════════════════════════════════════════"
if [ ${FAILED} -eq 0 ]; then
  echo " ✅ All Images Pushed Successfully!"
else
  echo " ⚠️  Push Completed with Errors"
fi
echo "════════════════════════════════════════════════════════════════"
echo " Pushed: ${PUSHED}/${#SERVICES[@]} services"
echo " Failed: ${FAILED}/${#SERVICES[@]} services"
echo ""
echo "📊 Harbor Project URL:"
echo "   https://${HARBOR_REGISTRY}/harbor/projects/${HARBOR_PROJECT}/repositories"
echo ""
echo "🎯 Next steps:"
echo "   1. Verify images in Harbor UI"
echo "   2. Deploy to K8s: ./.aProduction/scripts/deploy-to-kubernetes.sh"
echo ""