# Environment Variables Analysis Report

## Multi-Tenant URL Architecture
Your application uses multi-tenant URLs with the pattern:
- **API**: `api.{tenantDomain}` (production) / `api-dev.{tenantDomain}` (development)
- **Auth**: `auth.{tenantDomain}` (production) / `auth-dev.{tenantDomain}` (development)
- **Storage**: `storage.{tenantDomain}` (MinIO public URLs)

## 🔍 Environment Variables Comparison

### ✅ CORE Application (`apps/core`)

| Variable | .env (Dev) | .env.production | Status | Notes |
|----------|------------|-----------------|--------|-------|
| **Basic Configuration** |
| NODE_ENV | development | production | ✅ Correct | |
| PORT | 3001 | 3001 | ✅ Correct | |
| **Config Service** |
| ENABLE_CONFIG_HOT_RELOAD | true | true | ✅ Correct | |
| CONFIG_SERVICE_URL | http://localhost:3330 | http://config.ciapp-backend.svc.cluster.local:3330 | ✅ Correct | K8s internal URL |
| CONFIG_SERVICE_APP_NAME | coreWeb | coreWeb | ✅ Correct | |
| CONFIG_SERVICE_ENVIRONMENT | development | production | ✅ Correct | |
| CONFIG_REFRESH_INTERVAL | 300000 | 300000 | ✅ Correct | 5 minutes |
| CONFIG_DEBUG | true | false | ✅ Correct | |
| **OIDC Configuration** |
| TENANT_API_CLIENT_ID | ❌ Commented | ✅ Present | ⚠️ MISSING in dev | Required for API auth |
| TENANT_API_CLIENT_SECRET | ❌ Commented | ✅ Present | ⚠️ MISSING in dev | Required for API auth |
| **Redis** |
| REDIS_HOST | localhost | 192.168.200.32 | ✅ Correct | |
| REDIS_PORT | 6379 | 6379 | ✅ Correct | |
| REDIS_PASSWORD | cidb1234 | cidb1234 | ✅ Correct | |
| REDIS_USERNAME | cidbaccess | cidbaccess | ✅ Correct | |
| REDIS_DB | 0 | 0 | ✅ Correct | |
| **Cache TTL** |
| CACHE_TTL_DEFAULT | 3600 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_TENANT_SETTINGS | 1800 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_USER_SESSION | 7200 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_AUTH_TOKEN | 900 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_CONTENT | 600 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| **MinIO/S3** |
| MINIO_ENDPOINT | ❌ Commented | 192.168.200.33 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_PORT | ❌ Commented | 9000 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_USE_SSL | ❌ Commented | false | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_REGION | ❌ Commented | us-east-1 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_ROOT_USER | ❌ Commented | minioadmin | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_ROOT_PASSWORD | ❌ Commented | cidb1234 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_PUBLIC_ENDPOINT_TEMPLATE | ❌ Commented | storage.{tenantRootDomain} | ✅ Correct | Multi-tenant storage URLs |
| MINIO_PUBLIC_PORT | ❌ Commented | 443 | ✅ Correct | |
| MINIO_PUBLIC_USE_SSL | ❌ Commented | true | ✅ Correct | |
| **API Subdomains** |
| API_SUBDOMAIN | ❌ Commented | api | ⚠️ MISSING in dev | Uncomment for dev |
| AUTH_SUBDOMAIN | ❌ Commented | auth | ⚠️ MISSING in dev | Uncomment for dev |
| WWW_SUBDOMAIN | ❌ Commented | www | ⚠️ MISSING in dev | Uncomment for dev |
| NEXT_PUBLIC_API_SUBDOMAIN | api-dev | api | ✅ Correct | Client-side subdomain |
| NEXT_PUBLIC_AUTH_SUBDOMAIN | auth-dev | auth | ✅ Correct | Client-side subdomain |
| **Logging** |
| LOG_FORMAT | ❌ Commented | json | ⚠️ MISSING in dev | Add for consistency |
| NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER | 'true' | 'true' | ✅ Correct | |
| **Next.js** |
| NEXT_PUBLIC_APP_URL | http://localhost:3001 | https://app.um1ygn.edu.mm | ✅ Correct | |

---

### ✅ PUBLICWEB Application (`apps/publicWeb`)

| Variable | .env (Dev) | .env.production | Status | Notes |
|----------|------------|-----------------|--------|-------|
| **Basic Configuration** |
| NODE_ENV | development | production | ✅ Correct | |
| PORT | 3000 | 3000 | ✅ Correct | |
| **Config Service** |
| ENABLE_CONFIG_HOT_RELOAD | true | true | ✅ Correct | |
| CONFIG_SERVICE_URL | http://localhost:3330 | http://config.ciapp-backend.svc.cluster.local:3330 | ✅ Correct | K8s internal URL |
| CONFIG_SERVICE_APP_NAME | publicWeb | publicWeb | ✅ Correct | |
| CONFIG_SERVICE_ENVIRONMENT | development | production | ✅ Correct | |
| CONFIG_REFRESH_INTERVAL | 300000 | 300000 | ✅ Correct | |
| CONFIG_DEBUG | true | false | ✅ Correct | |
| **OIDC Configuration** |
| TENANT_API_CLIENT_ID | ❌ Commented | ✅ Present | ⚠️ MISSING in dev | Required for API auth |
| TENANT_API_CLIENT_SECRET | ❌ Commented | ✅ Present | ⚠️ MISSING in dev | Required for API auth |
| **Redis** |
| REDIS_HOST | localhost | 192.168.200.32 | ✅ Correct | |
| REDIS_PORT | 6379 | 6379 | ✅ Correct | |
| REDIS_PASSWORD | cidb1234 | cidb1234 | ✅ Correct | |
| REDIS_USERNAME | cidbaccess | cidbaccess | ✅ Correct | |
| REDIS_DB | 0 | 0 | ✅ Correct | |
| **Cache TTL** |
| CACHE_TTL_DEFAULT | 3600 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_TENANT_SETTINGS | 1800 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_USER_SESSION | 7200 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_AUTH_TOKEN | 900 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| CACHE_TTL_CONTENT | 600 | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| **PDF Service** |
| PDF_SERVICE_URL | http://localhost:3338 | http://pdf-service.ciapp-backend.svc.cluster.local:3338 | ✅ Correct | K8s internal URL |
| PDF_SERVICE_TIMEOUT | 30000 | 30000 | ✅ Correct | |
| **MinIO/S3** |
| MINIO_ENDPOINT | ❌ Commented | 192.168.200.33 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_PORT | ❌ Commented | 9000 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_USE_SSL | ❌ Commented | false | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_REGION | ❌ Commented | us-east-1 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_ROOT_USER | ❌ Commented | minioadmin | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_ROOT_PASSWORD | ❌ Commented | cidb1234 | ⚠️ MISSING in dev | Uncomment for dev |
| MINIO_BUCKET_STRATEGY | ❌ Commented | per-tenant | ⚠️ MISSING in dev | Important for multi-tenant |
| MINIO_PUBLIC_ENDPOINT_TEMPLATE | ❌ Commented | storage.{tenantRootDomain} | ✅ Correct | Multi-tenant storage URLs |
| MINIO_PUBLIC_PORT | ❌ Commented | 443 | ✅ Correct | |
| MINIO_PUBLIC_USE_SSL | ❌ Commented | true | ✅ Correct | |
| **API Subdomains** |
| API_SUBDOMAIN | api-dev | api | ✅ Correct | Server-side subdomain |
| AUTH_SUBDOMAIN | auth-dev | auth | ✅ Correct | Server-side subdomain |
| NEXT_PUBLIC_API_SUBDOMAIN | api-dev | api | ✅ Correct | Client-side subdomain |
| NEXT_PUBLIC_AUTH_SUBDOMAIN | auth-dev | auth | ✅ Correct | Client-side subdomain |
| **Logging** |
| LOG_FORMAT | pretty | ❌ Missing | ⚠️ Inconsistent | Should be 'json' in prod |
| NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER | 'true' | ❌ Missing | ⚠️ MISSING in prod | Add to production |
| **Next.js** |
| NEXT_PUBLIC_APP_URL | http://localhost:3000 | https://www.um1ygn.edu.mm | ✅ Correct | |

---

## 🚨 Critical Issues to Fix

### 1. **OIDC Credentials (Both Apps)**
```env
# Uncomment these in development .env files
TENANT_API_CLIENT_ID=f63672873ab7908f14f889c9a4d1b0747b8036257aa08c3568f5b1aa102f75d2
TENANT_API_CLIENT_SECRET=T7uAqmC0utEiQO4ifCDvlnscjFTxaV8/XLPngmA7phCCif8mZy25MrTTu9OaDRPs
```

### 2. **Cache TTL Settings (Both Apps - Production)**
Add to `.env.production`:
```env
# Cache TTL Settings (in seconds)
CACHE_TTL_DEFAULT=3600
CACHE_TTL_TENANT_SETTINGS=1800
CACHE_TTL_USER_SESSION=7200
CACHE_TTL_AUTH_TOKEN=900
CACHE_TTL_CONTENT=600
```

### 3. **MinIO Configuration (Both Apps - Development)**
Uncomment in development `.env` files:
```env
# MinIO/S3 Configuration
MINIO_ENDPOINT=203.81.66.116
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234
MINIO_BUCKET_STRATEGY=per-tenant  # PublicWeb only
MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
MINIO_PUBLIC_PORT=443
MINIO_PUBLIC_USE_SSL=true
```

### 4. **API Subdomains (Core - Development)**
Uncomment in core development `.env`:
```env
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev
WWW_SUBDOMAIN=www-dev
```

### 5. **Logging Configuration**
- **Core Dev**: Add `LOG_FORMAT=pretty`
- **PublicWeb Prod**: Add `LOG_FORMAT=json` and `NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER='false'`

---

## 🔧 Variables to Remove (Not Used)

### Core Application
- `GEMINI_API_KEY` - Commented out, appears to be unused

### Both Applications
- Duplicate subdomain definitions in comments can be removed

---

## ✅ Multi-Tenant URL Configuration

Your multi-tenant architecture is correctly configured:

1. **Dynamic Subdomain Resolution**:
   - Server-side: Uses `API_SUBDOMAIN` and `AUTH_SUBDOMAIN` env vars
   - Client-side: Uses `NEXT_PUBLIC_API_SUBDOMAIN` and `NEXT_PUBLIC_AUTH_SUBDOMAIN`
   - Falls back to config service values

2. **URL Pattern**:
   ```
   Development:
   - api-dev.{tenantDomain}
   - auth-dev.{tenantDomain}
   - storage.{tenantDomain}

   Production:
   - api.{tenantDomain}
   - auth.{tenantDomain}
   - storage.{tenantDomain}
   ```

3. **Storage URLs**:
   - Template: `storage.{tenantRootDomain}`
   - SSL enabled in production (port 443)
   - Per-tenant bucket strategy

---

## 📋 Recommended Actions

1. **Immediate**: Uncomment OIDC credentials in development environments
2. **High Priority**: Add missing Cache TTL settings to production
3. **Medium Priority**: Uncomment MinIO configuration in development
4. **Low Priority**: Standardize logging configuration across environments

## 🔐 Security Notes

1. **Never commit real credentials** - Use environment-specific values
2. **TENANT_API_CLIENT_SECRET** should be different per environment
3. **Redis and MinIO passwords** should be rotated and stored securely
4. **Use K8s Secrets** for production deployments instead of hardcoding in .env.production

---

## Updated Kubernetes Deployment Configuration

For your K8s deployments, ensure these environment variables are set:

```yaml
env:
# Core Service URLs (K8s internal)
- name: CONFIG_SERVICE_URL
  value: "http://config.ciapp-backend.svc.cluster.local:3330"
- name: PDF_SERVICE_URL  # PublicWeb only
  value: "http://pdf-service.ciapp-backend.svc.cluster.local:3338"

# Multi-tenant Configuration
- name: API_SUBDOMAIN
  value: "api"  # Production: api, Development: api-dev
- name: AUTH_SUBDOMAIN
  value: "auth"  # Production: auth, Development: auth-dev
- name: NEXT_PUBLIC_API_SUBDOMAIN
  value: "api"
- name: NEXT_PUBLIC_AUTH_SUBDOMAIN
  value: "auth"

# Storage Multi-tenant Template
- name: MINIO_PUBLIC_ENDPOINT_TEMPLATE
  value: "storage.{tenantRootDomain}"

# OIDC Credentials (use K8s secrets)
- name: TENANT_API_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: oidc-secrets
      key: client-id
- name: TENANT_API_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: oidc-secrets
      key: client-secret
```