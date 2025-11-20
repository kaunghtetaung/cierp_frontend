#!/bin/bash

# SSH Tunnel + Proxy Setup Script for npm/pnpm Installation
# This bypasses firewall restrictions by routing through your Mac

echo "========================================="
echo "  SSH TUNNEL + PROXY SETUP"
echo "========================================="
echo ""

# Configuration
GITLAB_SERVER="git.crystal-image.net"
GITLAB_USER="ciadmin"
SSH_KEY="~/.ssh/ciservers"
LOCAL_PROXY_PORT="8888"
REMOTE_TUNNEL_PORT="8889"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating SSH reverse tunnel${NC}"
echo "This will make your Mac's proxy available on the GitLab server"
echo ""

# Create SSH reverse tunnel in background
echo "Creating tunnel: GitLab:$REMOTE_TUNNEL_PORT → Mac:$LOCAL_PROXY_PORT"
ssh -i $SSH_KEY -fN -R $REMOTE_TUNNEL_PORT:localhost:$LOCAL_PROXY_PORT $GITLAB_USER@$GITLAB_SERVER

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH tunnel created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create SSH tunnel${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Starting proxy server on your Mac${NC}"
echo ""

# Start Python proxy server
python3 proxy-server.py &
PROXY_PID=$!

echo -e "${GREEN}✅ Proxy server started (PID: $PROXY_PID)${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}  SETUP COMPLETE!${NC}"
echo "========================================="
echo ""
echo "Now on your GitLab server, run these commands:"
echo ""
echo -e "${YELLOW}# 1. SSH to GitLab server:${NC}"
echo "ssh -i $SSH_KEY $GITLAB_USER@$GITLAB_SERVER"
echo ""
echo -e "${YELLOW}# 2. Configure npm/pnpm to use the proxy:${NC}"
echo "cd ~/ciapp_frontend"
echo "npm config set proxy http://localhost:$REMOTE_TUNNEL_PORT"
echo "npm config set https-proxy http://localhost:$REMOTE_TUNNEL_PORT"
echo ""
echo -e "${YELLOW}# 3. Install pnpm through the proxy:${NC}"
echo "npm install -g pnpm"
echo ""
echo -e "${YELLOW}# 4. Install dependencies:${NC}"
echo "pnpm install"
echo ""
echo -e "${YELLOW}# 5. Build your applications:${NC}"
echo "pnpm run build"
echo ""
echo "========================================="
echo ""
echo -e "${YELLOW}To stop the proxy and tunnel:${NC}"
echo "kill $PROXY_PID"
echo "ssh -i $SSH_KEY $GITLAB_USER@$GITLAB_SERVER 'pkill -f \"ssh.*8889\"'"
echo ""
echo "Press Ctrl+C to stop the proxy server"

# Wait for proxy server
wait $PROXY_PID