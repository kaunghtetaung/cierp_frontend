#!/bin/bash

# =================================================================
# Remove All Docker Proxy Settings
# Run this on the GitLab server to remove proxy configurations
# =================================================================

set -e

echo "========================================="
echo "  Removing Docker Proxy Configuration"
echo "========================================="
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script needs sudo privileges"
  echo "Please run: sudo bash $0"
  exit 1
fi

# Backup existing proxy config if it exists
if [ -f /etc/systemd/system/docker.service.d/http-proxy.conf ]; then
  echo "📦 Backing up existing proxy config..."
  cp /etc/systemd/system/docker.service.d/http-proxy.conf \
     /etc/systemd/system/docker.service.d/http-proxy.conf.bak.$(date +%Y%m%d-%H%M%S)
  echo "✅ Backup created"
  echo ""
fi

# Remove proxy configuration files
echo "🗑️  Removing proxy configuration files..."
rm -f /etc/systemd/system/docker.service.d/http-proxy.conf
rm -f /etc/systemd/system/docker.service.d/https-proxy.conf
rm -f /root/.docker/config.json
echo "✅ Proxy config files removed"
echo ""

# Remove environment proxy variables from Docker service
echo "🔧 Cleaning Docker service environment..."
if [ -f /etc/default/docker ]; then
  sed -i.bak '/HTTP_PROXY/d; /HTTPS_PROXY/d; /NO_PROXY/d; /http_proxy/d; /https_proxy/d; /no_proxy/d' /etc/default/docker
  echo "✅ Cleaned /etc/default/docker"
fi
echo ""

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload
echo "✅ Systemd reloaded"
echo ""

# Restart Docker service
echo "🔄 Restarting Docker service..."
systemctl restart docker
echo "✅ Docker restarted"
echo ""

# Wait for Docker to be ready
echo "⏳ Waiting for Docker to be ready..."
sleep 3
echo ""

# Verify proxy settings are removed
echo "========================================="
echo "  Verification"
echo "========================================="
echo ""

echo "Docker proxy settings:"
docker info 2>/dev/null | grep -i proxy || echo "✅ No proxy configured"
echo ""

echo "Systemd service proxy settings:"
systemctl show --property=Environment docker | grep -i proxy || echo "✅ No proxy in service environment"
echo ""

echo "========================================="
echo "  ✅ Proxy Removal Complete!"
echo "========================================="
echo ""
echo "You can now run Docker build without proxy issues:"
echo "  cd ~/ciapp_frontend"
echo "  bash .aProduction/scripts/build-all.sh"
echo ""
