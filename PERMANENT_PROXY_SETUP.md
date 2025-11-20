# 🌐 Permanent Proxy Configuration Guide

Your proxy server is **already running on 192.168.200.4:8888**. This guide shows how to configure the GitLab server to use it permanently.

## 🎯 Network Setup

```
GitLab Server (git.crystal-image.net)
    ↓ Direct connection (no SSH tunnel needed)
192.168.200.4:8888 (Python proxy server - already running)
    ↓
Internet → npm/pnpm registry
```

---

## ✅ Quick Setup on GitLab Server

### Step 1: Set Environment Variables Permanently

SSH to GitLab server:
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
```

Add proxy configuration to your profile:
```bash
cat >> ~/.bashrc << 'EOF'

# NPM/PNPM Proxy Configuration (192.168.200.4:8888)
export HTTP_PROXY="http://192.168.200.4:8888"
export HTTPS_PROXY="http://192.168.200.4:8888"
export http_proxy="http://192.168.200.4:8888"
export https_proxy="http://192.168.200.4:8888"
export NO_PROXY="localhost,127.0.0.1,192.168.200.0/24,192.168.200.41,192.168.200.32"
export no_proxy="localhost,127.0.0.1,192.168.200.0/24,192.168.200.41,192.168.200.32"
EOF
```

Reload the configuration:
```bash
source ~/.bashrc
```

### Step 2: Verify Proxy Connection

Test the proxy is working:
```bash
# Test HTTP connection through proxy
curl -I http://registry.npmjs.org

# Should show connection through proxy
echo "HTTP Proxy: $HTTP_PROXY"
echo "HTTPS Proxy: $HTTPS_PROXY"
```

### Step 3: Configure npm/pnpm (Optional)

These are usually not needed if environment variables are set, but for extra reliability:

```bash
# Configure npm
npm config set proxy http://192.168.200.4:8888
npm config set https-proxy http://192.168.200.4:8888

# Configure pnpm
pnpm config set proxy http://192.168.200.4:8888
pnpm config set https-proxy http://192.168.200.4:8888
```

---

## 🚀 Building Docker Images

### Method 1: Using the New Script (Recommended)

The proxy configuration is **hardcoded** in the script:

```bash
cd ~/ciapp_frontend

# Build both apps with proxy
./.aProduction/scripts/build-all-with-permanent-proxy.sh
```

This script:
- ✅ Uses `192.168.200.4:8888` as proxy automatically
- ✅ Builds Core + PublicWeb in parallel
- ✅ No need to export environment variables
- ✅ Works in CI/CD pipelines

### Method 2: Using Environment Variables

If you've set environment variables in Step 1:

```bash
cd ~/ciapp_frontend

# Build with auto-detected proxy (from environment)
./.aProduction/scripts/build-all.sh
```

The `build-all.sh` script will automatically detect the proxy from your environment variables.

---

## 🔧 Docker Configuration

Your Dockerfiles already support proxy via build arguments:

### Dockerfile.core (lines 10-18)
```dockerfile
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    ...
```

### Dockerfile.publicWeb (lines 10-18)
Same configuration

When you build with the script, these ARGs are automatically passed:
```bash
--build-arg HTTP_PROXY=http://192.168.200.4:8888
--build-arg HTTPS_PROXY=http://192.168.200.4:8888
--build-arg NO_PROXY=localhost,127.0.0.1,192.168.200.0/24,...
```

---

## 📋 Complete Workflow

### On GitLab Server:

```bash
# 1. SSH to server
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

# 2. Go to project directory
cd ~/ciapp_frontend

# 3. Pull latest code
git pull

# 4. Build images (proxy configured automatically)
./.aProduction/scripts/build-all-with-permanent-proxy.sh

# 5. Push to Harbor
./.aProduction/scripts/push-to-harbor.sh

# 6. Deploy to Kubernetes
./.aProduction/scripts/deploy-to-kubernetes-new.sh
```

---

## 🎯 What Changed from Before

### ❌ OLD Method (Temporary SSH Tunnel):
```
Your Mac → Run proxy-server.py
Your Mac → SSH tunnel: ssh -NR 8889:localhost:8888 git.crystal-image.net
GitLab → Use proxy: http://localhost:8889
```

### ✅ NEW Method (Permanent Direct Connection):
```
192.168.200.4 → Proxy server running permanently
GitLab → Use proxy: http://192.168.200.4:8888 (direct)
```

### Benefits:
1. ✅ **No SSH tunnel needed** - Direct network connection
2. ✅ **No manual intervention** - Always available
3. ✅ **CI/CD ready** - Works in automated pipelines
4. ✅ **Multiple servers** - Other servers can use it too
5. ✅ **Simpler** - One less step to manage

---

## 🔍 Troubleshooting

### Check proxy server is running:
```bash
# From GitLab server
curl -I http://192.168.200.4:8888
# Should connect successfully
```

### Check environment variables:
```bash
env | grep -i proxy
# Should show:
# HTTP_PROXY=http://192.168.200.4:8888
# HTTPS_PROXY=http://192.168.200.4:8888
# etc.
```

### Test npm through proxy:
```bash
curl http://registry.npmjs.org --proxy http://192.168.200.4:8888
```

### Check Docker build logs:
```bash
# Logs are saved to:
cat /tmp/docker-build-core.log
cat /tmp/docker-build-publicweb.log
```

### If proxy is not working:
1. **Check proxy server** on 192.168.200.4:
   ```bash
   # On 192.168.200.4
   ps aux | grep proxy-server
   # Should show python3 proxy-server.py running
   ```

2. **Check network connectivity**:
   ```bash
   # From GitLab server
   telnet 192.168.200.4 8888
   # Should connect successfully
   ```

3. **Check firewall rules**:
   ```bash
   # On 192.168.200.4
   sudo ufw status
   # Port 8888 should be allowed
   ```

---

## 🛑 Cleanup (If You Need to Remove Proxy)

### Remove from environment:
```bash
# Edit ~/.bashrc and remove the proxy lines
nano ~/.bashrc

# Reload
source ~/.bashrc
```

### Remove from npm/pnpm:
```bash
npm config delete proxy
npm config delete https-proxy
pnpm config delete proxy
pnpm config delete https-proxy
```

---

## 📊 Summary

| Aspect | Configuration |
|--------|---------------|
| **Proxy Server** | 192.168.200.4:8888 (already running) |
| **GitLab Server** | git.crystal-image.net |
| **Connection** | Direct (no SSH tunnel) |
| **Environment** | Set in `~/.bashrc` |
| **Build Script** | `.aProduction/scripts/build-all-with-permanent-proxy.sh` |
| **Docker Support** | ✅ Built-in via ARG/ENV |
| **CI/CD Ready** | ✅ Yes |

---

**🎉 You're all set! No more temporary SSH tunnels needed.**

The proxy server on 192.168.200.4:8888 is now your permanent gateway for npm/pnpm package installation.
