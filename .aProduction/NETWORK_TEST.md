# Network Connectivity Test for GitLab Server

## Quick Test Commands (Copy-Paste on GitLab Server)

### Test 1: Basic Google Connectivity

```bash
# Simple curl test to Google
curl -I https://www.google.com

# Expected output: HTTP/2 200 or HTTP/1.1 200
# If it fails with timeout, there's a network/proxy issue
```

### Test 2: DNS Resolution

```bash
# Test if DNS works
nslookup google.com

# Expected: IP address returned
```

### Test 3: Check Proxy Settings

```bash
# Check environment proxy variables
env | grep -i proxy

# Check Docker proxy
docker info | grep -i proxy

# Expected: No output (or no proxy configured)
```

### Test 4: Docker Hub Connectivity

```bash
# Test Docker Hub directly
curl -I https://registry-1.docker.io/v2/

# Test Docker authentication
curl -I https://auth.docker.io

# Expected: HTTP responses (not timeout)
```

### Test 5: Pull Alpine Image (Small Test)

```bash
# Try pulling a small image
docker pull alpine:latest

# Expected: Download successful
# If fails with proxy timeout, proxy is still interfering
```

---

## Automated Test Script

Run the comprehensive test script:

```bash
cd ~/ciapp_frontend
bash .aProduction/scripts/test-network.sh
```

This will test:
- DNS resolution
- Google connectivity
- GitHub connectivity
- Docker Hub connectivity
- Internal services (Harbor, Redis, MinIO)
- Proxy configuration
- Docker image pull

---

## Quick Test Results Interpretation

### ✅ All Pass
You can proceed with Docker builds!

### ❌ Google Fails
- Network/firewall issue
- Need to check server internet connectivity

### ❌ Docker Hub Fails (but Google works)
- Proxy is likely still interfering with Docker
- Run proxy removal commands again
- Check Docker daemon configuration

### ⚠️ Proxy Detected
Environment or Docker proxy is still set. Remove it:

```bash
# Unset environment proxy
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy NO_PROXY no_proxy

# Remove Docker proxy and restart
sudo rm -f /etc/systemd/system/docker.service.d/http-proxy.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## One-Liner for Quick Test

```bash
echo "=== Google Test ===" && curl -I https://www.google.com && echo "" && echo "=== Docker Hub Test ===" && curl -I https://registry-1.docker.io/v2/ && echo "" && echo "=== Proxy Check ===" && docker info | grep -i proxy || echo "No proxy configured"
```

Copy and paste this on the GitLab server to get a quick status.
