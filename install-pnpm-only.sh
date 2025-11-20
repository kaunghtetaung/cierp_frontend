#!/bin/bash

# Install ONLY pnpm without triggering workspace dependencies

echo "========================================="
echo "  Installing PNPM Without Dependencies"
echo "========================================="
echo ""

# Method 1: Direct download from GitHub (bypasses npm completely)
echo "Method 1: Downloading pnpm directly from GitHub..."
curl -fsSL https://get.pnpm.io/install.sh | sh -

# If that fails, try Method 2
if [ $? -ne 0 ]; then
    echo ""
    echo "Method 1 failed. Trying Method 2..."

    # Method 2: Download pnpm binary directly
    curl -L https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linux-x64 -o pnpm
    chmod +x pnpm
    ./pnpm --version

    if [ $? -eq 0 ]; then
        echo "✅ pnpm binary downloaded successfully!"
        echo "Use: ./pnpm install"
    fi
fi

# If both fail, try Method 3
if [ $? -ne 0 ]; then
    echo ""
    echo "Method 2 failed. Trying Method 3..."

    # Method 3: Use npx without installing
    echo "You can use: npx pnpm@latest install"
    echo "This downloads pnpm on-the-fly without installing"
fi