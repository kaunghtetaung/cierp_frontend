#!/bin/bash

# Production Installation Script
# This script handles dependency installation with React 19 compatibility

echo "========================================="
echo "  Installing Frontend Dependencies"
echo "========================================="

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"
echo ""

# Clean install with legacy peer deps for React 19 compatibility
echo "Step 1: Cleaning npm cache..."
npm cache clean --force

echo ""
echo "Step 2: Removing existing node_modules and lock files..."
rm -rf node_modules package-lock.json
rm -rf apps/core/node_modules apps/core/package-lock.json
rm -rf apps/publicWeb/node_modules apps/publicWeb/package-lock.json

echo ""
echo "Step 3: Installing dependencies with legacy peer deps..."
# Use legacy-peer-deps to handle React 19 compatibility issues
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Build Docker images: make build-frontend"
    echo "  2. Push to Harbor: make push-harbor"
    echo "  3. Deploy to K8s: make deploy-k8s"
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check Node.js version (requires >= 20.0.0)"
    echo "  2. Try: npm install --force"
    echo "  3. Check network connectivity"
    echo "  4. Review error messages above"
    exit 1
fi