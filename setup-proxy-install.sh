#!/bin/bash

# Install via normal NPM registry using proxy (not China mirror)

echo "========================================="
echo "  INSTALL VIA PROXY (Normal Registry)"
echo "========================================="
echo ""

# Step 1: Remove China mirror configuration
echo "Step 1: Removing China mirror settings..."
rm -f .npmrc
npm config delete registry

# Step 2: Set proxy to route through your Mac
echo "Step 2: Configuring proxy (through your SSH tunnel)..."
npm config set proxy http://localhost:8889
npm config set https-proxy http://localhost:8889

# Also set environment variables
export HTTP_PROXY=http://localhost:8889
export HTTPS_PROXY=http://localhost:8889
export http_proxy=http://localhost:8889
export https_proxy=http://localhost:8889

# Step 3: Use normal NPM registry (not China mirror)
echo "Step 3: Using normal registry (registry.npmjs.org)..."
npm config set registry https://registry.npmjs.org

# Step 4: Configure pnpm to use proxy and normal registry
echo "Step 4: Configuring pnpm..."
npx pnpm config set proxy http://localhost:8889
npx pnpm config set https-proxy http://localhost:8889
npx pnpm config set registry https://registry.npmjs.org

# Step 5: Install with normal registry through proxy
echo ""
echo "Step 5: Installing packages through proxy..."
echo "Using: registry.npmjs.org (via localhost:8889 proxy)"
echo ""

npx pnpm install --registry https://registry.npmjs.org

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next step: npx pnpm run build"