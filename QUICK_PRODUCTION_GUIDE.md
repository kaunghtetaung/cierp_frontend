# 🚀 Quick Production Build & Deploy Guide

## ✅ Current Status
- **Dependencies**: ✅ Installed (741 packages via China mirror)
- **pnpm**: ✅ Available via `npx pnpm`
- **Server**: git.crystal-image.net
- **Apps**: Core (ERP) & PublicWeb

## 📋 Quick Commands

### From Your Local Machine

#### 1️⃣ Push Code & Build
```bash
# Push latest code to production
make pushCi

# Run production build on server
make gitlab-prod-build
```

#### 2️⃣ One-Command Deploy
```bash
# Full deployment (build + deploy)
make gitlab-deploy
```

### On Production Server Directly

#### Option A: Quick Build
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
cd ~/ciapp_frontend

# Run production build
bash ./.aProduction/scripts/production-build.sh
```

#### Option B: Manual Steps
```bash
# 1. Install/Update dependencies
npx pnpm install --registry https://registry.npmmirror.com

# 2. Build all apps
npx pnpm run build

# 3. Test production build
cd apps/core && PORT=3000 npx pnpm run start      # Core app
cd apps/publicWeb && PORT=3001 npx pnpm run start # PublicWeb
```

## 📦 What Gets Built

### Core App (ERP)
- **Output**: `apps/core/.next`
- **Port**: 3000 (default)
- **URL**: http://127.0.0.3:80 (production)

### PublicWeb App
- **Output**: `apps/publicWeb/.next`
- **Port**: 3001 (default)
- **URL**: http://127.0.0.2:80 (production)

## 🔧 Available Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `production-build.sh` | Full production build with checks | `bash ./.aProduction/scripts/production-build.sh` |
| `install-with-mirror.sh` | Install deps with China mirror | `bash ./.aProduction/scripts/install-with-mirror.sh` |
| `install-simple.sh` | Simple pnpm install | `bash ./.aProduction/scripts/install-simple.sh` |

## 🐛 Troubleshooting

### Build Failed?
```bash
# Clear and rebuild
rm -rf apps/*/.next .turbo
npx pnpm run build --verbose
```

### Dependencies Issue?
```bash
# Reinstall with China mirror
bash ./.aProduction/scripts/install-with-mirror.sh
```

### Network Issues?
```bash
# Use China mirror
echo "registry=https://registry.npmmirror.com" > .npmrc
npx pnpm install --registry https://registry.npmmirror.com
```

## 📊 Build Verification

### Check Build Output
```bash
# Verify builds exist
ls -la apps/core/.next
ls -la apps/publicWeb/.next

# Check build info
cat ./.aProduction/build-info.json
```

### Test Production Locally
```bash
# Start both apps
NODE_ENV=production npx pnpm run start:core   # Port 3000
NODE_ENV=production npx pnpm run start:public # Port 3001
```

## 🎯 Complete Workflow Example

```bash
# 1. From your local machine
make pushCi                    # Push code to server

# 2. Build on server
make gitlab-prod-build         # Run production build

# 3. Verify (optional)
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
cd ~/ciapp_frontend
cat ./.aProduction/build-info.json  # Check build info
```

## 📝 Important Notes

1. **Always use China mirror** for npm packages (registry.npmmirror.com)
2. **Use `npx pnpm`** for all pnpm commands (it's installed locally)
3. **Node version**: Server has v18.19.1 (recommended: v20+)
4. **Build time**: ~2-3 minutes for both apps
5. **Disk space needed**: ~2GB for full build

## 🆘 Emergency Commands

```bash
# Kill all Node processes
pkill node

# Clear everything and start fresh
rm -rf node_modules apps/*/node_modules libs/*/node_modules
rm -rf apps/*/.next .turbo
bash ./.aProduction/scripts/install-with-mirror.sh
npx pnpm run build

# Check server resources
df -h    # Disk space
free -m  # Memory
top      # CPU usage
```

---

**Last tested**: November 2024
**Status**: ✅ Working with China mirror
**Build time**: ~2-3 minutes
**Support**: Check PRODUCTION_DEPLOYMENT_GUIDE.md for detailed info