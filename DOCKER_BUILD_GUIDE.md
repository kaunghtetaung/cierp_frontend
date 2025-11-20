# 🐳 Docker Build Guide for Production

Two options to build Docker images for your Kubernetes deployment.

---

## Option 1: Build on Mac (RECOMMENDED ⭐)

**Advantages:**
- ✅ No network restrictions
- ✅ No proxy setup needed
- ✅ Faster build (native Docker BuildKit)
- ✅ Simpler workflow

### Steps:

#### 1. Build and export on your Mac
```bash
cd ~/Projects/frontend
./.aProduction/scripts/build-and-export-for-production.sh
```

This will:
- Build both `core` and `publicWeb` for AMD64 (x86_64) architecture
- Export as tar files to `./docker-images-export/`

#### 2. Copy to production server
```bash
scp -i ~/.ssh/ciservers ./docker-images-export/*.tar ciadmin@git.crystal-image.net:~/docker-images/
```

#### 3. Load and push on server
```bash
# SSH to server
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

# Create directory if needed
mkdir -p ~/docker-images

# Load images
docker load -i ~/docker-images/core-*.tar
docker load -i ~/docker-images/publicweb-*.tar

# Push to Harbor
docker push 192.168.200.41/ciapp-frontend/core:latest
docker push 192.168.200.41/ciapp-frontend/publicweb:latest
```

#### 4. Deploy to Kubernetes
```bash
kubectl set image deployment/core core=192.168.200.41/ciapp-frontend/core:latest -n ciapp-frontend
kubectl set image deployment/publicweb publicweb=192.168.200.41/ciapp-frontend/publicweb:latest -n ciapp-frontend
```

---

## Option 2: Build on GitLab Server (with Proxy)

**Use this if:**
- You need to build directly on the server
- You have CI/CD pipeline requirements

### Prerequisites:

#### On Your Mac (Terminal 1):
```bash
cd ~/Projects/frontend
python3 proxy-server.py
# Keep running - don't close
```

#### On Your Mac (Terminal 2):
```bash
ssh -i ~/.ssh/ciservers -NR 8889:localhost:8888 ciadmin@git.crystal-image.net
# Keep running - don't close
```

#### Test proxy (on server):
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
curl -I https://registry.npmjs.org --proxy http://localhost:8889
# Should see "200 OK"
```

### Build Steps:

#### 1. Copy build script to server
```bash
scp -i ~/.ssh/ciservers .aProduction/scripts/build-with-proxy-on-server.sh ciadmin@git.crystal-image.net:~/ciapp_frontend/.aProduction/scripts/
```

#### 2. Run build on server
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
cd ~/ciapp_frontend
bash .aProduction/scripts/build-with-proxy-on-server.sh
```

This will:
- Configure Docker daemon to use proxy
- Build both applications
- Show push commands

#### 3. Push to Harbor
```bash
# Commands will be shown at the end of build script
docker push 192.168.200.41/ciapp-frontend/core:latest
docker push 192.168.200.41/ciapp-frontend/publicweb:latest
```

#### 4. Deploy to Kubernetes
```bash
kubectl set image deployment/core core=192.168.200.41/ciapp-frontend/core:latest -n ciapp-frontend
kubectl set image deployment/publicweb publicweb=192.168.200.41/ciapp-frontend/publicweb:latest -n ciapp-frontend
```

---

## 🔧 Troubleshooting

### Build fails with "Permission denied" for Alpine packages
Your Dockerfile already has the Thailand mirror configured:
```dockerfile
RUN sed -i 's|https://dl-cdn.alpinelinux.org|https://mirror.kku.ac.th|g' /etc/apk/repositories
```

### Build fails with "@repo/schema-utils" not found
Your Dockerfile.core is now single-stage, which preserves workspace symlinks. This should work.

### Proxy not working (Option 2)
1. Check proxy server is running on Mac (Terminal 1)
2. Check SSH tunnel is active (Terminal 2)
3. Test: `curl http://www.google.com --proxy http://localhost:8889`

### Docker out of disk space
```bash
docker system df
docker system prune -a --volumes  # Careful - removes unused data
```

---

## 📊 Comparison

| Aspect | Option 1 (Mac) | Option 2 (Server) |
|--------|----------------|-------------------|
| Network issues | None | Needs proxy |
| Setup complexity | Simple | Complex |
| Build speed | Fast | Slower (proxy overhead) |
| File transfer | Required | Not required |
| CI/CD ready | No | Yes |

---

## 💡 Recommended Workflow

**For manual deployments:** Use Option 1 (build on Mac)

**For CI/CD pipelines:** Use Option 2 (build on server) but consider:
- Setting up permanent proxy solution
- Or using China npm mirror in Dockerfile
- Or configuring GitLab Runner with proper network access

---

## 🎯 Quick Reference

### Build on Mac:
```bash
./.aProduction/scripts/build-and-export-for-production.sh
scp -i ~/.ssh/ciservers ./docker-images-export/*.tar ciadmin@git.crystal-image.net:~/docker-images/
# Then load and push on server
```

### Build on Server (with proxy):
```bash
# Mac Terminal 1: python3 proxy-server.py
# Mac Terminal 2: ssh -i ~/.ssh/ciservers -NR 8889:localhost:8888 ciadmin@git.crystal-image.net
# Server: bash .aProduction/scripts/build-with-proxy-on-server.sh
```
