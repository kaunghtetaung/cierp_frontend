#!/bin/bash

# =================================================================
# Network Connectivity Test Script
# Tests connectivity to various services from GitLab server
# =================================================================

echo "========================================="
echo "  Network Connectivity Test"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_connection() {
  local SERVICE=$1
  local URL=$2

  echo -n "Testing $SERVICE... "

  if curl -I -s --connect-timeout 5 "$URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Success${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed${NC}"
    return 1
  fi
}

# Test DNS resolution
echo "=== DNS Resolution ==="
echo -n "Resolving google.com... "
if nslookup google.com > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Success${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi
echo ""

# Test basic connectivity
echo "=== Basic Internet Connectivity ==="
test_connection "Google" "https://www.google.com"
test_connection "Cloudflare DNS" "https://1.1.1.1"
test_connection "GitHub" "https://github.com"
echo ""

# Test Docker-related services
echo "=== Docker Registry Services ==="
test_connection "Docker Hub" "https://registry-1.docker.io/v2/"
test_connection "Docker Auth" "https://auth.docker.io"
test_connection "Alpine Linux Mirror (Thailand)" "https://mirror.kku.ac.th/alpine/"
echo ""

# Test internal services
echo "=== Internal Services ==="
test_connection "Harbor Registry" "http://192.168.200.41"
test_connection "Redis" "http://192.168.200.32:6379"
test_connection "MinIO" "http://192.168.200.33:9000"
echo ""

# Check proxy settings
echo "=== Proxy Configuration ==="
if [ -n "$HTTP_PROXY" ] || [ -n "$http_proxy" ]; then
  echo -e "${YELLOW}⚠️  HTTP Proxy is set:${NC}"
  echo "  HTTP_PROXY: ${HTTP_PROXY:-$http_proxy}"
else
  echo -e "${GREEN}✅ No HTTP proxy set${NC}"
fi

if [ -n "$HTTPS_PROXY" ] || [ -n "$https_proxy" ]; then
  echo -e "${YELLOW}⚠️  HTTPS Proxy is set:${NC}"
  echo "  HTTPS_PROXY: ${HTTPS_PROXY:-$https_proxy}"
else
  echo -e "${GREEN}✅ No HTTPS proxy set${NC}"
fi

if [ -n "$NO_PROXY" ] || [ -n "$no_proxy" ]; then
  echo "NO_PROXY: ${NO_PROXY:-$no_proxy}"
fi
echo ""

# Check Docker proxy
echo "=== Docker Daemon Proxy ==="
if docker info 2>/dev/null | grep -i proxy > /dev/null; then
  echo -e "${YELLOW}⚠️  Docker proxy is configured:${NC}"
  docker info 2>/dev/null | grep -i proxy
else
  echo -e "${GREEN}✅ No Docker proxy configured${NC}"
fi
echo ""

# Test Docker pull
echo "=== Docker Image Pull Test ==="
echo "Attempting to pull alpine:latest (small test image)..."
if timeout 30 docker pull alpine:latest > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Docker pull successful${NC}"
  docker rmi alpine:latest > /dev/null 2>&1
else
  echo -e "${RED}❌ Docker pull failed${NC}"
  echo "This indicates a problem with Docker Hub connectivity"
fi
echo ""

# Summary
echo "========================================="
echo "  Test Complete"
echo "========================================="
echo ""
echo "If all tests pass, you can proceed with Docker builds."
echo "If Docker Hub fails but Google works, the proxy might still be interfering."
echo ""
