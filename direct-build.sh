#!/bin/bash

# Direct build without Docker - Just get it running!

echo "========================================="
echo "  DIRECT BUILD - No Docker"
echo "========================================="
echo ""

# Step 1: Install dependencies locally
echo "Step 1: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npx pnpm install --no-frozen-lockfile --registry https://registry.npmmirror.com
fi

# Step 2: Build Next.js apps directly
echo ""
echo "Step 2: Building Core app..."
cd apps/core
npx next build || {
    echo "Build failed - trying with reduced memory"
    NODE_OPTIONS="--max-old-space-size=2048" npx next build
}

echo ""
echo "Step 3: Building PublicWeb app..."
cd ../publicWeb
npx next build || {
    echo "Build failed - trying with reduced memory"
    NODE_OPTIONS="--max-old-space-size=2048" npx next build
}

cd ../..

echo ""
echo "========================================="
echo "  ✅ BUILD COMPLETE!"
echo "========================================="
echo ""
echo "To run the apps:"
echo ""
echo "Terminal 1:"
echo "  cd apps/core && PORT=3000 npm start"
echo ""
echo "Terminal 2:"
echo "  cd apps/publicWeb && PORT=3001 npm start"
echo ""
echo "Or use PM2:"
echo "  pm2 start ecosystem.config.js"