# Config Service Integration Guide

## 🎯 Overview

This Next.js monorepo now integrates with a centralized **Config Service** for dynamic runtime configuration management. This allows you to change configurations in production without rebuilding or redeploying your applications.

## 📦 What's Been Implemented

### 1. **Config Client Library** (`libs/config`)
- Fetches configuration from centralized config service
- Automatic hot-reload every 5 minutes (configurable)
- Graceful fallback to environment variables
- Type-safe configuration access
- React Server Component support

### 2. **Initialization Scripts**
- `scripts/init-publicWeb-config.js` - Initialize publicWeb config
- `scripts/init-core-config.js` - Initialize core config

### 3. **Updated Environment Files**
All `.env` and `.env.production` files now include:
- Config service connection settings
- Fallback values for when config service is unavailable
- Clear separation between build-time and runtime configs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Config Service (MongoDB)                    │
│         http://config:3330/api/config                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP GET every 5 minutes
                  │
          ┌───────┴───────┐
          │               │
    ┌─────▼─────┐   ┌────▼─────┐
    │ publicWeb  │   │   core   │
    │   App      │   │   App    │
    │ (Port 3000)│   │(Port 3001)│
    └────────────┘   └──────────┘
```

## 🔑 Key Concepts

### Build-Time vs Runtime Configs

**Build-Time** (Must stay in `.env`):
- `NEXT_PUBLIC_*` variables - Baked into client bundle
- `NODE_ENV` - Determines build mode
- Next.js `images.remotePatterns` - Image optimization config

**Runtime** (Now in Config Service):
- Redis connection settings
- MinIO/S3 credentials and endpoints
- OIDC credentials
- API subdomain configuration
- Cache TTL settings
- Feature flags
- API keys

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Install axios for init scripts
npm install axios
```

### Step 2: Start Config Service

```bash
cd /Users/kaunghtet/Projects/ciapp
npm run serve:config
```

The config service should be running at `http://localhost:3330`

### Step 3: Initialize Configurations

```bash
cd /Users/kaunghtet/Projects/frontend

# Initialize publicWeb configuration (development)
node scripts/init-publicWeb-config.js development

# Initialize publicWeb configuration (production)
node scripts/init-publicWeb-config.js production

# Initialize core configuration (development)
node scripts/init-core-config.js development

# Initialize core configuration (production)
node scripts/init-core-config.js production
```

### Step 4: Verify Configuration

```bash
# Check publicWeb config
curl http://localhost:3330/api/config/publicWeb?environment=production | jq

# Check core config
curl http://localhost:3330/api/config/core?environment=production | jq
```

### Step 5: Use in Your Code

```typescript
// In Server Components, API Routes, or Server Actions
import { configClient } from '@repo/config';

// Example 1: Get Redis host
const redisHost = await configClient.get('redis.host', process.env.REDIS_HOST);

// Example 2: Get MinIO endpoint
const minioEndpoint = await configClient.get('minio.internal.endpoint', process.env.MINIO_ENDPOINT);

// Example 3: Get cache TTL
const cacheTtl = await configClient.get('redis.ttl.default', 3600);

// Example 4: Get nested config
const s3Bucket = await configClient.get('minio.bucketStrategy', 'per-tenant');
```

## 📝 Configuration Structure

### publicWeb App Configuration

```json
{
  "appName": "publicWeb",
  "environment": "production",
  "version": "1.0.0",
  "config": {
    "redis": {
      "host": "192.168.200.32",
      "port": 6379,
      "password": "cidb1234",
      "username": "cidbaccess",
      "db": 0,
      "ttl": {
        "default": 3600,
        "tenantSettings": 1800,
        "userSession": 7200,
        "authToken": 900,
        "content": 600
      }
    },
    "minio": {
      "internal": {
        "endpoint": "192.168.200.33",
        "port": 9000,
        "useSSL": false,
        "region": "us-east-1"
      },
      "public": {
        "endpointTemplate": "storage.{tenantRootDomain}",
        "port": 443,
        "useSSL": true
      },
      "credentials": {
        "rootUser": "minioadmin",
        "rootPassword": "cidb1234"
      },
      "bucketStrategy": "per-tenant"
    },
    "oidc": {
      "clientId": "f636728...",
      "clientSecret": "T7uAqmC..."
    },
    "api": {
      "subdomain": "api",
      "authSubdomain": "auth"
    },
    "logging": {
      "format": "json"
    },
    "server": {
      "port": 3000
    }
  }
}
```

### core App Configuration

Same as publicWeb, plus:

```json
{
  "gemini": {
    "apiKey": "AIzaSy..."
  },
  "api": {
    "subdomain": "api",
    "authSubdomain": "auth",
    "wwwSubdomain": "www"
  },
  "server": {
    "port": 3001
  }
}
```

## 🔧 Environment Variables

### Config Service Settings

```env
# Enable hot-reload (false for dev, true for prod)
ENABLE_CONFIG_HOT_RELOAD=true

# Config service URL
CONFIG_SERVICE_URL=http://config:3330/api/config

# App name in config service
CONFIG_SERVICE_APP_NAME=publicWeb  # or 'core'

# Environment
CONFIG_SERVICE_ENVIRONMENT=production  # or 'development'

# Refresh interval (milliseconds)
CONFIG_REFRESH_INTERVAL=300000  # 5 minutes

# Debug logging
CONFIG_DEBUG=false
```

### Fallback Values

All runtime configuration should have fallback values in `.env` files. These are used when:
- Config service is unavailable
- Network issues
- Config not yet initialized
- Development mode with `ENABLE_CONFIG_HOT_RELOAD=false`

## 🔄 Updating Configuration

### Method 1: Using curl

```bash
curl -X PUT http://localhost:3330/api/config/publicWeb?environment=production \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.1",
    "config": {
      "redis": {
        "host": "192.168.200.35",
        "port": 6379
      }
    },
    "metadata": {
      "updatedBy": "admin",
      "changeReason": "Updated Redis host"
    }
  }'
```

### Method 2: Using Config Service Dashboard

Visit: `http://localhost:3330/dashboard`

### Timeline for Changes

```
T+0:00  - Update config via API
T+0:05  - publicWeb pod 1 refreshes, picks up new config
T+0:05  - publicWeb pod 2 refreshes, picks up new config
T+0:05  - core pod 1 refreshes, picks up new config
...
```

**Note**: Changes take effect within 5 minutes (one refresh interval)

## ✅ Benefits

1. **Zero-Downtime Config Updates** - Change configs without rebuild/redeploy
2. **Pod-Friendly** - All pods fetch from same centralized source
3. **Version Control** - Track config versions and rollback if needed
4. **Audit Trail** - See who changed what and when
5. **Environment Separation** - Separate configs for dev/staging/prod
6. **Graceful Fallback** - Uses `.env` if config service down
7. **Multi-App** - Single config service for multiple apps

## 🛡️ Production Best Practices

### 1. Enable Hot-Reload in Production

```env
# .env.production
ENABLE_CONFIG_HOT_RELOAD=true
```

### 2. Disable Hot-Reload in Development

```env
# .env
ENABLE_CONFIG_HOT_RELOAD=false
```

This keeps development fast and predictable.

### 3. Always Provide Fallback Values

Even though production uses config service, always maintain fallback values in `.env.production` for emergency situations.

### 4. Test Config Changes

```bash
# 1. Update config in config service
curl -X PUT http://config:3330/api/config/publicWeb ...

# 2. Wait 5 minutes or restart app

# 3. Verify in logs
tail -f app.log | grep "Config loaded"

# 4. Test functionality
```

### 5. Version Your Configs

Use semantic versioning:
- `1.0.0` - Initial config
- `1.0.1` - Minor update (Redis host change)
- `1.1.0` - Feature addition (new cache TTL)
- `2.0.0` - Breaking change (config structure change)

## 📊 Monitoring

### Health Check

```bash
# Check if config is loaded
curl http://localhost:3000/api/health  # publicWeb
curl http://localhost:3001/api/health  # core
```

### Logs

The config client logs:
```
✅ Config loaded from config service { version: '1.0.0', timestamp: '...' }
⚠️  Config fetch failed, using fallback
❌ All config fetch attempts failed
```

## 🚨 Troubleshooting

### Config Service Unavailable

**Symptom**: Apps use fallback values from `.env`

**Solution**:
```bash
# Check config service is running
curl http://localhost:3330/api

# Check network connectivity
ping config

# Check logs
docker logs config-service
```

### Config Not Updating

**Symptom**: Changes not reflected after 5 minutes

**Solution**:
1. Verify config was updated in MongoDB
2. Check refresh interval setting
3. Restart app to force immediate reload
4. Check app logs for fetch errors

### Build Failures

**Symptom**: `Cannot find module '@repo/config'`

**Solution**:
```bash
# Install dependencies
npm install

# Build the monorepo
npm run build
```

## 📚 API Reference

### `configClient.get(path, fallback)`

Get configuration value by path.

```typescript
const value = await configClient.get('redis.host', 'localhost');
```

**Parameters**:
- `path` - Dot-notation path (e.g., `'redis.host'`, `'minio.internal.endpoint'`)
- `fallback` - Fallback value if path not found

**Returns**: Configuration value or fallback

### `configClient.getAll()`

Get entire configuration object.

```typescript
const config = await configClient.getAll();
```

**Returns**: `Record<string, any> | null`

### `configClient.reload()`

Force reload configuration from service.

```typescript
await configClient.reload();
```

### `getCachedConfig(path, fallback)`

React Server Component optimized version (uses `cache`).

```typescript
import { getCachedConfig } from '@repo/config';

const redisHost = await getCachedConfig('redis.host', 'localhost');
```

## 🔗 Related Documentation

- **Config Service Design**: `/Users/kaunghtet/Projects/ciapp/apps/config/QUICK_START.md`
- **PDF Service Integration**: `/Users/kaunghtet/Projects/ciapp/services/pdf-service/CONFIG_CLIENT_IMPLEMENTATION.md`
- **Project Instructions**: `CLAUDE.md`

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review config service logs
3. Verify network connectivity
4. Check MongoDB is running

---

**Last Updated**: 2025-11-06
**Version**: 1.0.0
