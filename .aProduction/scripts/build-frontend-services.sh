#!/bin/bash

# Build Frontend Services Script
# This script builds core and publicWeb Next.js applications for Kubernetes deployment
# Uses npm cache mounts for faster rebuilds

set -e  # Exit on error

# Check if REPO_DIR is provided or use current directory
REPO_DIR="${1:-.}"
cd "${REPO_DIR}"

# Load environment variables
export BASE_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
export IMAGE_TAG="v${BASE_VERSION}-${CI_COMMIT_REF_NAME:-main}.${CI_PIPELINE_ID:-local}"

# Configuration
HARBOR_REGISTRY="192.168.200.41"
HARBOR_PROJECT="ciapp-frontend"  # Changed to ciapp-frontend
ALL_SERVICES="core publicWeb"
DOCKER_DIR=".aProduction/Docker"
K8S_NAMESPACE="ciapp-frontend"  # Changed to ciapp-frontend
BUILD_SCRIPT=".aProduction/scripts/build-single-frontend.sh"

echo "════════════════════════════════════════════════════════════════"
echo " 🚀 Building Frontend Applications (2 services)"
echo "════════════════════════════════════════════════════════════════"
echo " Pipeline ID - ${CI_PIPELINE_ID:-local}"
echo " Commit - ${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')}"
echo " Branch - ${CI_COMMIT_REF_NAME:-$(git branch --show-current 2>/dev/null || echo 'N/A')}"
echo " Base Version - ${BASE_VERSION}"
echo " Image Tag - ${IMAGE_TAG}"
echo " Harbor Project - ${HARBOR_PROJECT}"
echo " Namespace - ${K8S_NAMESPACE}"
echo " Working Directory - $(pwd)"
echo ""

# Check if build-single-frontend.sh exists
if [ ! -f "${BUILD_SCRIPT}" ]; then
  echo "❌ ERROR: ${BUILD_SCRIPT} not found!"
  echo "   This script requires build-single-frontend.sh to be present"
  exit 1
fi

# Make sure build-single-frontend.sh is executable
chmod +x "${BUILD_SCRIPT}"

# Verify all required Dockerfiles exist
echo "📋 Verifying Dockerfiles..."
for service in ${ALL_SERVICES}; do
  if [ ! -f "${DOCKER_DIR}/Dockerfile.${service}" ]; then
    echo "❌ ${DOCKER_DIR}/Dockerfile.${service} not found!"
    exit 1
  else
    echo "   ✓ Found ${DOCKER_DIR}/Dockerfile.${service}"
  fi
done
echo ""

# Track build statistics
SUCCESSFUL_BUILDS=0
FAILED_BUILDS=0
START_TIME=$(date +%s)

# Build all services individually
for service in ${ALL_SERVICES}; do
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo " 📦 Building service ${SUCCESSFUL_BUILDS}+${FAILED_BUILDS}+1/2: ${service}"
  echo "════════════════════════════════════════════════════════════════"
  echo ""

  # Call build-single-frontend.sh for each service
  if ${BUILD_SCRIPT} ${service}; then
    SUCCESSFUL_BUILDS=$((SUCCESSFUL_BUILDS + 1))
    echo ""
    echo "✅ ${service} build successful (${SUCCESSFUL_BUILDS}/2 complete)"
  else
    FAILED_BUILDS=$((FAILED_BUILDS + 1))
    echo ""
    echo "❌ ${service} build failed!"
    echo ""
    echo "Build stopped at ${service}. ${SUCCESSFUL_BUILDS} succeeded, ${FAILED_BUILDS} failed."
    exit 1
  fi
done

# Calculate total build time
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_TIME / 60))
SECONDS=$((TOTAL_TIME % 60))

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " ✅ All Frontend Services Built Successfully!"
echo "════════════════════════════════════════════════════════════════"
echo " Total time: ${MINUTES}m ${SECONDS}s"
echo " Successful: ${SUCCESSFUL_BUILDS}/2"
echo " Failed: ${FAILED_BUILDS}/2"
echo ""
echo "📊 Built Images:"
docker images ${HARBOR_REGISTRY}/${HARBOR_PROJECT} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""
echo "💡 Application Details:"
echo "   - core:      Main ERP application (127.0.0.3:80 in dev)"
echo "   - publicWeb: Public multi-tenant website (127.0.0.2:80 in dev)"
echo ""
echo "🎯 Next steps:"
echo "   1. Push images: ./.aProduction/scripts/push-to-harbor.sh"
echo "   2. Deploy to K8s: ./.aProduction/scripts/deploy-to-kubernetes.sh"
echo ""