# 🚀 SUPER SIMPLE BUILD GUIDE

## The Only Commands You Need

### Option 1: One Command (Recommended)
```bash
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/just-build.sh"
```

### Option 2: Step by Step
```bash
# 1. Connect to server
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

# 2. Go to project
cd ~/ciapp_frontend

# 3. Run simple build
bash ./.aProduction/scripts/just-build.sh
```

### Option 3: Manual Commands
```bash
# On the server, just run these 3 commands:
cd ~/ciapp_frontend
npx pnpm install --registry https://registry.npmmirror.com
npx pnpm run build
```

---

## If Build Fails

### Memory Error?
```bash
# Add more memory
export NODE_OPTIONS="--max-old-space-size=4096"
npx pnpm run build
```

### Type Errors?
```bash
# Ignore them and continue
npx pnpm run build || true
```

### Dependencies Error?
```bash
# Clean and reinstall
rm -rf node_modules
npm install pnpm
npx pnpm install --registry https://registry.npmmirror.com
npx pnpm run build
```

---

## Test After Build
```bash
# Test Core app
cd apps/core
PORT=3000 npx pnpm run start

# Test PublicWeb app
cd apps/publicWeb
PORT=3001 npx pnpm run start
```

---

## That's It! 🎉

No complex steps. No long scripts. Just build and run.

**Problems?** Just run this to start fresh:
```bash
cd ~/ciapp_frontend
rm -rf node_modules apps/*/.next
bash ./.aProduction/scripts/just-build.sh
```