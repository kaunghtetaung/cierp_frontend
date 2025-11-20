# Remove Docker Proxy Configuration on GitLab Server

## Quick Commands (Run on GitLab Server)

### Option 1: Manual Removal (Copy-Paste)

```bash
# 1. Backup and remove proxy config
sudo cp /etc/systemd/system/docker.service.d/http-proxy.conf /etc/systemd/system/docker.service.d/http-proxy.conf.bak 2>/dev/null || true
sudo rm -f /etc/systemd/system/docker.service.d/http-proxy.conf
sudo rm -f /etc/systemd/system/docker.service.d/https-proxy.conf

# 2. Reload and restart Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# 3. Verify proxy is removed
docker info | grep -i proxy
```

### Option 2: Using the Script

```bash
# 1. CD to project directory
cd ~/ciapp_frontend

# 2. Run the removal script
sudo bash .aProduction/scripts/remove-docker-proxy.sh
```

## After Removing Proxy

Once the proxy is removed, you can build the Docker images:

```bash
cd ~/ciapp_frontend
bash .aProduction/scripts/build-all.sh
```

## Verification

After removal, verify no proxy is configured:

```bash
# Check Docker daemon proxy
docker info | grep -i proxy

# Check systemd service
systemctl show --property=Environment docker | grep -i proxy

# Should return nothing or "No proxy configured"
```

## If Build Still Fails

If you still get proxy errors after removal:

1. **Check environment variables:**
   ```bash
   env | grep -i proxy
   unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy NO_PROXY no_proxy
   ```

2. **Try direct build without script:**
   ```bash
   docker build --network=default -f .aProduction/Docker/Dockerfile.core \
     -t 192.168.200.41/ciappfrontend/core:latest .
   ```

3. **Check if you can reach Docker Hub:**
   ```bash
   curl -I https://registry-1.docker.io/v2/
   ```
