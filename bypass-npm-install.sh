#!/bin/bash

# Bypass npm completely - Install pnpm without touching package.json

echo "========================================="
echo "  BYPASS NPM - Direct PNPM Installation"
echo "========================================="
echo ""

# Step 1: Temporarily move package.json to avoid npm reading workspace:*
echo "Step 1: Moving package.json temporarily..."
mv package.json package.json.backup 2>/dev/null

# Step 2: Create minimal package.json just to install pnpm
echo "Step 2: Creating minimal package.json..."
echo '{"name":"temp","version":"1.0.0"}' > package.json

# Step 3: Now npm can install pnpm without errors
echo "Step 3: Installing pnpm..."
npm install pnpm

# Step 4: Restore original package.json
echo "Step 4: Restoring original package.json..."
mv package.json.backup package.json

# Step 5: Now use pnpm
echo ""
echo "✅ Success! pnpm is installed. Now run:"
echo ""
echo "  npx pnpm install --registry https://registry.npmmirror.com"
echo "  npx pnpm run build"
echo ""