# Fix Docker Proxy Issue on GitLab Server

## Problem
Docker on GitLab server is configured to use proxy `192.168.200.4:8888` which is timing out, preventing image builds.

## Solution Steps

### Step 1: Sync Latest Code to GitLab Server

From your Mac, run:
```bash
make pushCi
```

Or manually:
```bash
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  -e "ssh -i ~/.ssh/ciservers" \
  . ciadmin@git.crystal-image.net:~/ciapp_frontend/
```

### Step 2: SSH to GitLab Server

```bash
make gitlab
```

Or:
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
```

### Step 3: Remove Docker Proxy Configuration

On the GitLab server, run these commands:

```bash
# Backup existing proxy config
sudo cp /etc/systemd/system/docker.service.d/http-proxy.conf \
     /etc/systemd/system/docker.service.d/http-proxy.conf.bak 2>/dev/null || true

# Remove proxy configuration files
sudo rm -f /etc/systemd/system/docker.service.d/http-proxy.conf
sudo rm -f /etc/systemd/system/docker.service.d/https-proxy.conf

# Reload systemd and restart Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# Verify proxy is removed
docker info | grep -i proxy
```

Expected output: Nothing (no proxy configured)

### Step 4: Build Docker Images

Still on GitLab server:

```bash
cd ~/ciapp_frontend
bash .aProduction/scripts/build-all.sh
```

This will:
- Build both `core` and `publicWeb` images in parallel
- Tag them with latest and timestamped versions
- Show you the push commands when done

### Step 5: Push to Harbor Registry

After successful build, push images:

```bash
# Push both versions of both images
docker push 192.168.200.41/ciappfrontend/core:latest
docker push 192.168.200.41/ciappfrontend/core:v1.0.0-YYYYMMDD-HHMMSS

docker push 192.168.200.41/ciappfrontend/publicweb:latest
docker push 192.168.200.41/ciappfrontend/publicweb:v1.0.0-YYYYMMDD-HHMMSS
```

(Replace `YYYYMMDD-HHMMSS` with the actual timestamp from build output)

### Step 6: Deploy to Kubernetes

From your Mac (or GitLab server):

```bash
make k8s-apply
```

Or manually via SSH:
```bash
ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
  kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/namespace.yaml && \
  kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/secrets.yaml && \
  kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/core/deployment.yaml && \
  kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/publicWeb/deployment.yaml"
```

### Step 7: Verify Deployment

Check pod status:
```bash
make k8s-status
```

Or:
```bash
ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get all -n ciapp-frontend"
```

---

## Troubleshooting

### If proxy removal doesn't work

1. **Check environment variables:**
   ```bash
   env | grep -i proxy
   ```

   If you see proxy variables, unset them:
   ```bash
   unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy NO_PROXY no_proxy
   ```

2. **Check Docker daemon config:**
   ```bash
   sudo cat /etc/docker/daemon.json
   ```

   Remove any proxy configuration from this file.

3. **Use the automated script:**
   ```bash
   cd ~/ciapp_frontend
   sudo bash .aProduction/scripts/remove-docker-proxy.sh
   ```

### If build still fails

1. **Check if you can reach Docker Hub:**
   ```bash
   curl -I https://registry-1.docker.io/v2/
   ```

2. **Try building without cache:**
   ```bash
   docker build --no-cache --network=default \
     -f .aProduction/Docker/Dockerfile.core \
     -t 192.168.200.41/ciappfrontend/core:latest .
   ```

3. **Check Docker logs:**
   ```bash
   sudo journalctl -u docker -n 50
   ```

---

## Quick Reference

### All Commands in Order

```bash
# On Mac: Sync code
make pushCi

# On Mac: SSH to GitLab
make gitlab

# On GitLab: Remove proxy
sudo rm -f /etc/systemd/system/docker.service.d/http-proxy.conf
sudo systemctl daemon-reload
sudo systemctl restart docker

# On GitLab: Build images
cd ~/ciapp_frontend
bash .aProduction/scripts/build-all.sh

# On GitLab: Push to Harbor (after build completes)
docker push 192.168.200.41/ciappfrontend/core:latest
docker push 192.168.200.41/ciappfrontend/publicweb:latest

# On Mac: Deploy to K8s
make k8s-apply

# On Mac: Check status
make k8s-status
```
