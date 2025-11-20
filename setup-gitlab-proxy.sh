#!/bin/bash

# =================================================================
# GitLab Server Proxy Setup Script
# Run this ONCE on GitLab server to configure permanent proxy
# =================================================================

echo "========================================="
echo "  GitLab Server Proxy Configuration"
echo "  Target: 192.168.200.4:8888"
echo "========================================="
echo ""

PROXY_SERVER="http://192.168.200.4:8888"
NO_PROXY_LIST="localhost,127.0.0.1,192.168.200.0/24,192.168.200.41,192.168.200.32"

echo "This script will configure:"
echo "  ✓ Environment variables in ~/.bashrc"
echo "  ✓ npm proxy configuration"
echo "  ✓ pnpm proxy configuration"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Configure environment variables
echo ""
echo "Step 1: Configuring environment variables..."

if grep -q "NPM/PNPM Proxy Configuration" ~/.bashrc 2>/dev/null; then
    echo "⚠️  Proxy configuration already exists in ~/.bashrc"
    echo "   Skipping to avoid duplicates"
else
    cat >> ~/.bashrc << 'EOF'

# NPM/PNPM Proxy Configuration (192.168.200.4:8888)
# Added by setup-gitlab-proxy.sh
export HTTP_PROXY="http://192.168.200.4:8888"
export HTTPS_PROXY="http://192.168.200.4:8888"
export http_proxy="http://192.168.200.4:8888"
export https_proxy="http://192.168.200.4:8888"
export NO_PROXY="localhost,127.0.0.1,192.168.200.0/24,192.168.200.41,192.168.200.32"
export no_proxy="localhost,127.0.0.1,192.168.200.0/24,192.168.200.41,192.168.200.32"
EOF
    echo "✅ Added proxy configuration to ~/.bashrc"
fi

# Load the configuration now
export HTTP_PROXY="$PROXY_SERVER"
export HTTPS_PROXY="$PROXY_SERVER"
export http_proxy="$PROXY_SERVER"
export https_proxy="$PROXY_SERVER"
export NO_PROXY="$NO_PROXY_LIST"
export no_proxy="$NO_PROXY_LIST"

echo "✅ Loaded proxy configuration for current session"

# Step 2: Test proxy connection
echo ""
echo "Step 2: Testing proxy connection..."

if curl -s -I --connect-timeout 5 http://192.168.200.4:8888 > /dev/null 2>&1; then
    echo "✅ Proxy server is reachable at 192.168.200.4:8888"
else
    echo "❌ WARNING: Cannot reach proxy server at 192.168.200.4:8888"
    echo "   Please check:"
    echo "   1. Proxy server is running on 192.168.200.4"
    echo "   2. Network connectivity: ping 192.168.200.4"
    echo "   3. Port 8888 is not blocked by firewall"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 3: Configure npm
echo ""
echo "Step 3: Configuring npm..."

if command -v npm &> /dev/null; then
    npm config set proxy "$PROXY_SERVER"
    npm config set https-proxy "$PROXY_SERVER"
    echo "✅ npm proxy configured"
else
    echo "⚠️  npm not found, skipping npm configuration"
fi

# Step 4: Configure pnpm
echo ""
echo "Step 4: Configuring pnpm..."

if command -v pnpm &> /dev/null; then
    pnpm config set proxy "$PROXY_SERVER"
    pnpm config set https-proxy "$PROXY_SERVER"
    echo "✅ pnpm proxy configured"
else
    echo "⚠️  pnpm not found, skipping pnpm configuration"
fi

# Step 5: Verify configuration
echo ""
echo "========================================="
echo "  Configuration Summary"
echo "========================================="
echo ""
echo "Environment Variables:"
echo "  HTTP_PROXY=$HTTP_PROXY"
echo "  HTTPS_PROXY=$HTTPS_PROXY"
echo "  NO_PROXY=$NO_PROXY"
echo ""

if command -v npm &> /dev/null; then
    echo "npm configuration:"
    echo "  proxy=$(npm config get proxy)"
    echo "  https-proxy=$(npm config get https-proxy)"
    echo ""
fi

if command -v pnpm &> /dev/null; then
    echo "pnpm configuration:"
    echo "  proxy=$(pnpm config get proxy)"
    echo "  https-proxy=$(pnpm config get https-proxy)"
    echo ""
fi

# Step 6: Test package installation
echo "========================================="
echo "  Testing Package Installation"
echo "========================================="
echo ""
read -p "Test npm package installation? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing: npm install lodash (in temp directory)..."
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    npm init -y > /dev/null 2>&1

    if npm install lodash --no-save; then
        echo "✅ Package installation test SUCCESSFUL!"
        echo "   Proxy is working correctly"
    else
        echo "❌ Package installation test FAILED"
        echo "   Please check proxy server logs on 192.168.200.4"
    fi

    cd - > /dev/null
    rm -rf "$TEMP_DIR"
fi

# Final instructions
echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "✅ Proxy configuration is now permanent"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Reload your shell (or source ~/.bashrc):"
echo "   source ~/.bashrc"
echo ""
echo "2. Build Docker images with proxy:"
echo "   cd ~/ciapp_frontend"
echo "   ./.aProduction/scripts/build-all-with-permanent-proxy.sh"
echo ""
echo "3. Or use regular build (will auto-detect proxy):"
echo "   ./.aProduction/scripts/build-all.sh"
echo ""
echo "🔧 To remove proxy configuration later:"
echo "   Edit ~/.bashrc and remove the proxy section"
echo "   npm config delete proxy"
echo "   npm config delete https-proxy"
echo "   pnpm config delete proxy"
echo "   pnpm config delete https-proxy"
echo ""
echo "📚 Full documentation: PERMANENT_PROXY_SETUP.md"
echo ""
