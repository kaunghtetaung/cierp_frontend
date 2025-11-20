#!/bin/bash

# Quick fix for Docker build issues

echo "========================================="
echo "  FIXING DOCKER BUILD"
echo "========================================="
echo ""

# Fix 1: Change frozen-lockfile to no-frozen-lockfile
echo "1. Fixing pnpm lockfile issue..."
sed -i 's/pnpm install --frozen-lockfile/pnpm install --no-frozen-lockfile/g' .aProduction/Docker/Dockerfile.core
sed -i 's/pnpm install --frozen-lockfile/pnpm install --no-frozen-lockfile/g' .aProduction/Docker/Dockerfile.publicWeb

# Fix 2: Change build command to use correct directory
echo "2. Fixing Next.js build path..."
sed -i 's|RUN npx next build|RUN cd apps/core \&\& npx next build|g' .aProduction/Docker/Dockerfile.core
sed -i 's|RUN npx next build|RUN cd apps/publicWeb \&\& npx next build|g' .aProduction/Docker/Dockerfile.publicWeb

# Fix 3: Fix the start command
echo "3. Fixing start command..."
sed -i 's|CMD \["npm", "start"\]|CMD ["sh", "-c", "cd apps/core \&\& npm start"]|g' .aProduction/Docker/Dockerfile.core
sed -i 's|CMD \["npm", "start"\]|CMD ["sh", "-c", "cd apps/publicWeb \&\& npm start"]|g' .aProduction/Docker/Dockerfile.publicWeb

echo ""
echo "✅ Docker files fixed!"
echo ""
echo "Now run: make build-frontend"