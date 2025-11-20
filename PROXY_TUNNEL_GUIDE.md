# 🚇 SSH Tunnel + Proxy Solution for Firewall Bypass

Your datacenter firewall blocks pnpm sources. This solution routes npm/pnpm traffic through your Mac to bypass the firewall.

## 🎯 How It Works

```
GitLab Server → SSH Tunnel → Your Mac → Internet → npm/pnpm registry
```

1. **Your Mac** acts as a proxy server
2. **SSH Tunnel** connects GitLab server to your Mac
3. **npm/pnpm** on GitLab uses the proxy to download packages

## 📋 Quick Setup (3 Steps)

### Step 1: Start Everything on Your Mac

```bash
# Terminal 1 - Start proxy server
cd ~/Projects/frontend
python3 proxy-server.py
```

```bash
# Terminal 2 - Create SSH tunnel
ssh -i ~/.ssh/ciservers -NR 8889:localhost:8888 ciadmin@git.crystal-image.net
```

Keep both terminals running!

### Step 2: Configure GitLab Server

SSH to GitLab server in a new terminal:
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
```

Then configure npm to use the proxy:
```bash
cd ~/ciapp_frontend

# Set proxy for npm
npm config set proxy http://localhost:8889
npm config set https-proxy http://localhost:8889

# For pnpm specifically
export HTTP_PROXY=http://localhost:8889
export HTTPS_PROXY=http://localhost:8889
```

### Step 3: Install and Build

Still on GitLab server:
```bash
# Install pnpm (if needed)
npm install pnpm

# Install dependencies through proxy
npx pnpm install

# Build applications
npx pnpm run build
```

## 🔧 Alternative: One-Command Setup

Run this on your Mac:
```bash
bash setup-tunnel-proxy.sh
```

This script will:
- Start the proxy server
- Create the SSH tunnel
- Show you the commands to run on GitLab

## 🎛️ Manual Configuration Options

### Option 1: Using .npmrc file
On GitLab server:
```bash
cd ~/ciapp_frontend
cat > .npmrc << EOF
proxy=http://localhost:8889
https-proxy=http://localhost:8889
registry=https://registry.npmjs.org
EOF
```

### Option 2: Using environment variables
```bash
export HTTP_PROXY=http://localhost:8889
export HTTPS_PROXY=http://localhost:8889
export http_proxy=http://localhost:8889
export https_proxy=http://localhost:8889
```

### Option 3: Direct pnpm config
```bash
npx pnpm config set proxy http://localhost:8889
npx pnpm config set https-proxy http://localhost:8889
```

## 🚀 Complete Installation Flow

### On Your Mac (Terminal 1):
```bash
cd ~/Projects/frontend
python3 proxy-server.py
# Keep this running - you'll see connection logs
```

### On Your Mac (Terminal 2):
```bash
# Create reverse tunnel
ssh -i ~/.ssh/ciservers -NR 8889:localhost:8888 ciadmin@git.crystal-image.net
# Keep this running - no output expected
```

### On GitLab Server (Terminal 3):
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
cd ~/ciapp_frontend

# Configure proxy
export HTTP_PROXY=http://localhost:8889
export HTTPS_PROXY=http://localhost:8889

# Test proxy connection
curl -I http://registry.npmjs.org --proxy http://localhost:8889

# Install everything
npm install pnpm
npx pnpm install
npx pnpm run build
```

## 🔍 Troubleshooting

### Check if tunnel is working:
On GitLab server:
```bash
# Check if port 8889 is listening
netstat -an | grep 8889

# Test proxy
curl http://www.google.com --proxy http://localhost:8889
```

### If proxy isn't working:
1. Check Terminal 1 (proxy server) for errors
2. Check Terminal 2 (SSH tunnel) is still running
3. Try recreating the tunnel

### Alternative ports:
If 8888/8889 are in use, try different ports:
```bash
# Mac proxy on 9999
python3 proxy-server.py  # Edit file to use port 9999

# Tunnel to 9998
ssh -i ~/.ssh/ciservers -NR 9998:localhost:9999 ciadmin@git.crystal-image.net

# Configure npm
npm config set proxy http://localhost:9998
```

## 🛑 Cleanup After Installation

### On GitLab Server:
```bash
# Remove proxy settings
npm config delete proxy
npm config delete https-proxy

# Or remove .npmrc
rm .npmrc

# Clear environment variables
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
```

### On Your Mac:
```bash
# Stop proxy server - Press Ctrl+C in Terminal 1
# Stop SSH tunnel - Press Ctrl+C in Terminal 2

# Or find and kill processes
ps aux | grep proxy-server
kill [PID]

ps aux | grep "ssh.*8889"
kill [PID]
```

## 💡 Tips

1. **Keep proxy running** during entire installation
2. **Watch proxy logs** in Terminal 1 to see connections
3. **Use China mirror** as backup if proxy fails:
   ```bash
   npx pnpm install --registry https://registry.npmmirror.com
   ```
4. **Test small package first**:
   ```bash
   npm install lodash --proxy http://localhost:8889
   ```

## 🎯 Summary

This solution bypasses your datacenter firewall by:
1. Running a proxy server on your Mac (has internet access)
2. Creating SSH tunnel from GitLab to your Mac
3. Routing all npm/pnpm traffic through this tunnel

Your Mac essentially becomes a gateway for package installation!

---

**Note**: After successful installation and build, you can stop the proxy and tunnel. The built applications don't need the proxy to run.