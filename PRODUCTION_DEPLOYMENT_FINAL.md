# 🚀 Production Deployment - Complete Guide

## Current Build Status
✅ **Dependencies**: Installed (741 packages via China mirror)
✅ **pnpm**: Available via `npx pnpm`
⚠️ **Type Check**: Completed with warnings
🔄 **Core Build**: In progress (Next.js optimization)
⏳ **PublicWeb Build**: Pending

---

## 📋 Quick Deployment Commands

### Option 1: From Your Local Machine (Recommended)
```bash
# Step 1: Push latest code to production
make pushCi

# Step 2: Run production build on server
make gitlab-prod-build

# Step 3: Monitor build progress (optional)
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
tail -f ~/ciapp_frontend/build-*.log
```

### Option 2: Direct Server Access
```bash
# Connect to server
ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net
cd ~/ciapp_frontend

# Run the production build
bash ./.aProduction/scripts/production-build.sh

# Or run individual steps:
npx pnpm install --registry https://registry.npmmirror.com
npx pnpm run build
```

---

## 🔧 Complete Production Build Process

### Step-by-Step Execution

#### 1. Ensure Latest Code
```bash
# From local machine
make pushCi

# OR on server directly
git pull origin main
```

#### 2. Install/Update Dependencies
```bash
# Using the mirror script (recommended)
bash ./.aProduction/scripts/install-with-mirror.sh

# OR manual install
npx pnpm install --registry https://registry.npmmirror.com
```

#### 3. Run Production Build
```bash
# Complete build with all checks
bash ./.aProduction/scripts/production-build.sh

# OR build only (skip checks)
npx pnpm run build
```

#### 4. Verify Build Output
```bash
# Check build directories
ls -la apps/core/.next
ls -la apps/publicWeb/.next

# View build info
cat ./.aProduction/build-info.json

# Check build logs
ls -la build-*.log
tail -100 build-*.log
```

#### 5. Test Production Locally
```bash
# Terminal 1: Core App
cd apps/core
PORT=3000 NODE_ENV=production npx pnpm run start

# Terminal 2: PublicWeb App
cd apps/publicWeb
PORT=3001 NODE_ENV=production npx pnpm run start

# Access:
# Core: http://127.0.0.3:3000
# PublicWeb: http://127.0.0.2:3001
```

---

## 📊 Build Verification Checklist

### After Build Completes
- [ ] Core `.next` directory exists and contains:
  - [ ] `server/` directory
  - [ ] `static/` directory
  - [ ] `BUILD_ID` file
- [ ] PublicWeb `.next` directory exists with same structure
- [ ] Build info JSON shows both app sizes
- [ ] No error messages in build log
- [ ] Both apps start successfully in production mode

### Expected Build Output
```
✅ PRODUCTION BUILD COMPLETE!
Build Summary:
  • Timestamp: 20241116-HHMMSS
  • Core Build: ~50-100MB
  • PublicWeb Build: ~30-60MB
  • Log file: ./build-[timestamp].log
```

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Build Fails with Type Errors
```bash
# Continue with warnings
npx pnpm run build || true

# OR fix type errors first
npx pnpm run type-check
# Fix reported errors, then rebuild
```

#### 2. Out of Memory During Build
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npx pnpm run build

# OR build apps separately
cd apps/core && npx pnpm run build
cd ../publicWeb && npx pnpm run build
```

#### 3. Port Already in Use
```bash
# Find and kill process
lsof -i :3000
kill -9 [PID]

# OR use different ports
PORT=3002 npx pnpm run start
```

#### 4. Dependencies Installation Fails
```bash
# Clear everything and reinstall
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules libs/*/node_modules
bash ./.aProduction/scripts/install-with-mirror.sh
```

#### 5. Build Hangs or Takes Too Long
```bash
# Kill current build
pkill node

# Clear cache and rebuild
rm -rf .turbo apps/*/.next
npx pnpm run build --verbose
```

---

## 🎯 Post-Build Deployment

### Production Server Setup

#### 1. Using PM2 (Recommended)
```bash
# Install PM2 if needed
npm install -g pm2

# Start applications
pm2 start ecosystem.config.js

# OR manually
pm2 start "npx pnpm run start" --name "core" --cwd ./apps/core
pm2 start "npx pnpm run start" --name "publicweb" --cwd ./apps/publicWeb

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 2. Create ecosystem.config.js
```javascript
module.exports = {
  apps: [
    {
      name: 'core',
      cwd: './apps/core',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'publicweb',
      cwd: './apps/publicWeb',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

#### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/ciapp
server {
    listen 80;
    server_name 127.0.0.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name 127.0.0.2;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 Monitoring & Logs

### Check Application Status
```bash
# PM2 status
pm2 status
pm2 logs core
pm2 logs publicweb

# System resources
htop
df -h
free -m

# Application logs
tail -f ~/.pm2/logs/core-out.log
tail -f ~/.pm2/logs/publicweb-out.log
```

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://127.0.0.3
curl -w "@curl-format.txt" -o /dev/null -s http://127.0.0.2
```

---

## 🔄 Update & Rollback Procedures

### Deploy Updates
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild
bash ./.aProduction/scripts/production-build.sh

# 3. Reload applications (zero-downtime)
pm2 reload core
pm2 reload publicweb
```

### Rollback if Needed
```bash
# 1. Checkout previous version
git checkout [previous-commit-hash]

# 2. Rebuild
npx pnpm install --registry https://registry.npmmirror.com
npx pnpm run build

# 3. Restart applications
pm2 restart all
```

---

## ✅ Final Checklist

### Before Going Live
- [ ] Build completed successfully for both apps
- [ ] Production environment variables configured
- [ ] Database connections verified
- [ ] Redis cache connected
- [ ] SSL certificates configured (if applicable)
- [ ] Monitoring setup (PM2/other)
- [ ] Backup strategy in place
- [ ] Rollback procedure tested

### After Deployment
- [ ] Both applications accessible
- [ ] Authentication working
- [ ] Core features tested
- [ ] Performance acceptable
- [ ] Logs showing no critical errors
- [ ] Monitoring alerts configured

---

## 📞 Support & Resources

### Quick Reference
- **Server**: git.crystal-image.net
- **User**: ciadmin
- **Apps Directory**: ~/ciapp_frontend
- **Core URL**: http://127.0.0.3:80
- **PublicWeb URL**: http://127.0.0.2:80

### Log Locations
- Build logs: `~/ciapp_frontend/build-*.log`
- PM2 logs: `~/.pm2/logs/`
- Application logs: Check PM2 or console output

### Emergency Commands
```bash
# Kill all Node processes
pkill node

# Clear everything and start fresh
rm -rf node_modules apps/*/node_modules libs/*/node_modules
rm -rf apps/*/.next .turbo
bash ./.aProduction/scripts/install-with-mirror.sh
npx pnpm run build

# Check system resources
top
df -h
free -m
```

---

**Document Version**: 1.0
**Last Updated**: November 16, 2024
**Status**: Production Build in Progress

## Notes
- Always use China mirror (registry.npmmirror.com) for package installation
- Use `npx pnpm` for all pnpm commands
- Type check warnings can be ignored for initial deployment
- Build time: ~2-5 minutes per application
- Required disk space: ~2GB for complete build