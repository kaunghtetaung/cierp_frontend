#!/bin/bash

# Simple Harbor Push Script
# Run this on GitLab server after building images

set -e

HARBOR_REGISTRY="192.168.200.41"
HARBOR_USER="admin"
HARBOR_PASS="Cryst@l123!"

echo "Logging in to Harbor..."
echo "${HARBOR_PASS}" | docker login ${HARBOR_REGISTRY} -u ${HARBOR_USER} --password-stdin

echo ""
echo "Pushing images..."
echo ""

# Find and push all ciappfrontend images
for image in $(docker images "${HARBOR_REGISTRY}/ciappfrontend/*" --format "{{.Repository}}:{{.Tag}}" | grep -v '<none>'); do
  echo "Pushing: $image"
  docker push "$image"
done

echo ""
echo "Logging out..."
docker logout ${HARBOR_REGISTRY}

echo ""
echo "✅ Done!"
