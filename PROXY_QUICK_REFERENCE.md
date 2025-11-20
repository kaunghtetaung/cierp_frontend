# 🚀 Proxy Quick Reference Card

## 📍 Current Setup

| Component | Configuration |
|-----------|---------------|
| **Proxy Server** | `192.168.200.4:8888` (Python - already running) |
| **Build Server** | `git.crystal-image.net` (GitLab) |
| **Connection** | Direct network (no SSH tunnel) |
| **Harbor Registry** | `192.168.200.41` |
| **Redis** | `192.168.200.32` |

---

## ⚡ Quick Commands

### On GitLab Server (One-Time Setup):

```bash
# 1. Copy setup script to GitLab server
scp -i ~/.ssh/ciservers setup-gitlab-proxy.sh ciadmin@git.crystal-image.net:~/

# 2. SSH to GitLab server
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

# 3. Run setup script
bash setup-gitlab-proxy.sh

# 4. Reload shell
source ~/.bashrc
```

### Build & Deploy (Regular Use):

```bash
# SSH to GitLab server
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

cd ~/ciapp_frontend

# Pull latest code
git pull

# Build with proxy (automatic)
./.aProduction/scripts/build-all-with-permanent-proxy.sh

# Push to Harbor
./.aProduction/scripts/push-to-harbor.sh

# Deploy to Kubernetes
./.aProduction/scripts/deploy-to-kubernetes-new.sh
```

---

## 🔍 Verification Commands

### Check Proxy Connection:
```bash
curl -I http://192.168.200.4:8888
```

### Check Environment Variables:
```bash
env | grep -i proxy
```

### Test npm Through Proxy:
```bash
curl http://registry.npmjs.org --proxy http://192.168.200.4:8888
```

### Check Docker Build Logs:
```bash
cat /tmp/docker-build-core.log
cat /tmp/docker-build-publicweb.log
```

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| [PERMANENT_PROXY_SETUP.md](PERMANENT_PROXY_SETUP.md) | Full setup documentation |
| [setup-gitlab-proxy.sh](setup-gitlab-proxy.sh) | One-time setup script for GitLab |
| [.aProduction/scripts/build-all-with-permanent-proxy.sh](.aProduction/scripts/build-all-with-permanent-proxy.sh) | Build script with hardcoded proxy |
| [proxy-server.py](proxy-server.py) | Proxy server (runs on 192.168.200.4) |
| [PROXY_TUNNEL_GUIDE.md](PROXY_TUNNEL_GUIDE.md) | OLD method (SSH tunnel - deprecated) |

---

## 🆚 Comparison

### ❌ OLD: SSH Tunnel Method
```bash
# On your Mac - Terminal 1
python3 proxy-server.py

# On your Mac - Terminal 2
ssh -NR 8889:localhost:8888 ciadmin@git.crystal-image.net

# On GitLab
export HTTP_PROXY=http://localhost:8889
```
**Problems:** Manual, temporary, requires 2 terminals, breaks on disconnect

### ✅ NEW: Direct Proxy Method
```bash
# On GitLab (one-time setup)
bash setup-gitlab-proxy.sh

# Build (always works)
./.aProduction/scripts/build-all-with-permanent-proxy.sh
```
**Benefits:** Automatic, permanent, no manual steps, CI/CD ready

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot reach proxy | Check `ping 192.168.200.4` and proxy server is running |
| Docker build fails | Check logs: `/tmp/docker-build-*.log` |
| npm install fails | Verify: `curl http://registry.npmjs.org --proxy http://192.168.200.4:8888` |
| Environment not set | Run: `source ~/.bashrc` |

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1️⃣  One-Time Setup on GitLab Server                     │
│    bash setup-gitlab-proxy.sh                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2️⃣  Regular Build & Deploy (automated)                  │
│    ./.aProduction/scripts/build-all-with-permanent-proxy.sh │
│    ./.aProduction/scripts/push-to-harbor.sh             │
│    ./.aProduction/scripts/deploy-to-kubernetes-new.sh   │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 Support

- **Full Guide**: [PERMANENT_PROXY_SETUP.md](PERMANENT_PROXY_SETUP.md)
- **Old Method** (deprecated): [PROXY_TUNNEL_GUIDE.md](PROXY_TUNNEL_GUIDE.md)

---

**Last Updated**: January 2025
