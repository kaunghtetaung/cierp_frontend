#!/bin/bash

# CVE-2025-55182 Patch Verification Script
# This script verifies that patched versions are deployed

echo "=================================="
echo "CVE-2025-55182 Patch Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking production server: www.um1ygn.edu.mm"
echo ""

# 1. Check if server is responding
echo "1. Server Health Check..."
if curl -s -o /dev/null -w "%{http_code}" https://www.um1ygn.edu.mm/ | grep -q "200"; then
    echo -e "${GREEN}✓ Server is responding${NC}"
else
    echo -e "${RED}✗ Server is not responding${NC}"
fi
echo ""

# 2. Check local package versions
echo "2. Checking local package.json versions..."
echo ""

# Check publicWeb
echo "publicWeb app:"
NEXT_VERSION=$(grep '"next"' apps/publicWeb/package.json | sed 's/.*: "\(.*\)".*/\1/')
REACT_VERSION=$(grep '"react"' apps/publicWeb/package.json | sed 's/.*: "\(.*\)".*/\1/' | head -1)

echo "  Next.js: $NEXT_VERSION"
echo "  React: $REACT_VERSION"

# Verify versions
if [[ "$NEXT_VERSION" =~ ^[\^\~]?15\.(4\.[8-9]|[5-9]\.|1[0-9]\.) ]] || [[ "$NEXT_VERSION" =~ ^[\^\~]?1[6-9]\. ]]; then
    echo -e "  ${GREEN}✓ Next.js version is patched (>= 15.4.8)${NC}"
else
    echo -e "  ${RED}✗ Next.js version needs update${NC}"
fi

if [[ "$REACT_VERSION" =~ ^[\^\~]?19\.0\.[1-9] ]] || [[ "$REACT_VERSION" =~ ^[\^\~]?19\.[1-9] ]]; then
    echo -e "  ${GREEN}✓ React version is patched (>= 19.0.1)${NC}"
else
    echo -e "  ${RED}✗ React version needs update${NC}"
fi

echo ""

# Check core
echo "core app:"
NEXT_VERSION=$(grep '"next"' apps/core/package.json | sed 's/.*: "\(.*\)".*/\1/')
REACT_VERSION=$(grep '"react"' apps/core/package.json | sed 's/.*: "\(.*\)".*/\1/' | head -1)

echo "  Next.js: $NEXT_VERSION"
echo "  React: $REACT_VERSION"

if [[ "$NEXT_VERSION" =~ ^[\^\~]?15\.(4\.[8-9]|[5-9]\.|1[0-9]\.) ]] || [[ "$NEXT_VERSION" =~ ^[\^\~]?1[6-9]\. ]]; then
    echo -e "  ${GREEN}✓ Next.js version is patched (>= 15.4.8)${NC}"
else
    echo -e "  ${RED}✗ Next.js version needs update${NC}"
fi

if [[ "$REACT_VERSION" =~ ^[\^\~]?19\.0\.[1-9] ]] || [[ "$REACT_VERSION" =~ ^[\^\~]?19\.[1-9] ]]; then
    echo -e "  ${GREEN}✓ React version is patched (>= 19.0.1)${NC}"
else
    echo -e "  ${RED}✗ React version needs update${NC}"
fi

echo ""
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo ""
echo -e "${YELLOW}IMPORTANT:${NC} To fully verify production:"
echo "1. SSH into your production server"
echo "2. Run: cd /path/to/your/app && cat package.json | grep -E '\"(next|react)\"'"
echo "3. Verify the deployed versions match the patched versions above"
echo ""
echo "If production matches local versions shown above, you are protected!"
echo ""
