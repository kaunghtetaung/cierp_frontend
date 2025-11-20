# Push Docker Images to Harbor Registry

## Quick Commands (Run on GitLab Server)

### Option 1: Using the New Push Script (Recommended)

```bash
cd ~/ciapp_frontend
bash .aProduction/scripts/push-images.sh
```

This script will:
- Login to Harbor with credentials
- Find all built images automatically
- Push both versioned and latest tags
- Show a summary with statistics

### Option 2: Manual Push Commands

```bash
# Login to Harbor first
echo "Cryst@l123!" | docker login 192.168.200.41 -u admin --password-stdin

# Push core images
docker push 192.168.200.41/ciappfrontend/core:v1.0.0-20251116-194408
docker push 192.168.200.41/ciappfrontend/core:latest

# Push publicweb images
docker push 192.168.200.41/ciappfrontend/publicweb:v1.0.0-20251116-194408
docker push 192.168.200.41/ciappfrontend/publicweb:latest

# Logout
docker logout 192.168.200.41
```

### Option 3: One-Liner

```bash
echo "Cryst@l123!" | docker login 192.168.200.41 -u admin --password-stdin && \
docker push 192.168.200.41/ciappfrontend/core:v1.0.0-20251116-194408 && \
docker push 192.168.200.41/ciappfrontend/core:latest && \
docker push 192.168.200.41/ciappfrontend/publicweb:v1.0.0-20251116-194408 && \
docker push 192.168.200.41/ciappfrontend/publicweb:latest && \
docker logout 192.168.200.41
```

---

## Troubleshooting

### Unauthorized Access Error

If you get "unauthorized: authentication required", ensure:

1. **Login first:**
   ```bash
   echo "Cryst@l123!" | docker login 192.168.200.41 -u admin --password-stdin
   ```

2. **Check if you're logged in:**
   ```bash
   cat ~/.docker/config.json
   # Should show auth for 192.168.200.41
   ```

3. **Verify credentials:**
   - Username: `admin`
   - Password: `Cryst@l123!`

### Image Not Found Error

If images are not found:

```bash
# List available images
docker images | grep ciappfrontend

# If empty, rebuild:
cd ~/ciapp_frontend
bash .aProduction/scripts/build-all.sh
```

### Network Timeout

If push times out:

```bash
# Check Harbor connectivity
curl -I http://192.168.200.41

# Check if logged in
docker login 192.168.200.41
```

---

## Verification

After pushing, verify images in Harbor:

1. **Web UI:**
   - URL: https://192.168.200.41/harbor/projects/ciappfrontend/repositories
   - Login: admin / Cryst@l123!

2. **Command line:**
   ```bash
   # List images in Harbor (requires curl/API access)
   curl -u admin:Cryst@l123! http://192.168.200.41/api/v2.0/projects/ciappfrontend/repositories
   ```

---

## Complete Workflow

```bash
# 1. Build images
cd ~/ciapp_frontend
bash .aProduction/scripts/build-all.sh

# 2. Push to Harbor
bash .aProduction/scripts/push-images.sh

# 3. Deploy to K8s (from local machine)
# make k8s-apply
```
