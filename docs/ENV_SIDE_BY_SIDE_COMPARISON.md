# Environment Variables Side-by-Side Comparison

## CORE Application Environment Variables

### Development (.env) vs Production (.env.production)

```bash
# ============================================================================
# BASIC CONFIGURATION
# ============================================================================
# Development                                    | Production
NODE_ENV=development                            | NODE_ENV=production
PORT=3001                                       | PORT=3001

# ============================================================================
# CONFIG SERVICE
# ============================================================================
# Development                                    | Production
ENABLE_CONFIG_HOT_RELOAD=true                   | ENABLE_CONFIG_HOT_RELOAD=true
CONFIG_SERVICE_URL=http://localhost:3330        | CONFIG_SERVICE_URL=http://config.ciapp-backend.svc.cluster.local:3330
CONFIG_SERVICE_APP_NAME=coreWeb                 | CONFIG_SERVICE_APP_NAME=coreWeb
CONFIG_SERVICE_ENVIRONMENT=development          | CONFIG_SERVICE_ENVIRONMENT=production
CONFIG_REFRESH_INTERVAL=300000                  | CONFIG_REFRESH_INTERVAL=300000
CONFIG_DEBUG=true                                | CONFIG_DEBUG=false

# ============================================================================
# OIDC CONFIGURATION
# ============================================================================
# Development                                    | Production
# TENANT_API_CLIENT_ID=xxx (COMMENTED)           | TENANT_API_CLIENT_ID=f636728...102f75d2
# TENANT_API_CLIENT_SECRET=xxx (COMMENTED)       | TENANT_API_CLIENT_SECRET=T7uAqmC0...aDRPs

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
# Development                                    | Production
REDIS_HOST=localhost                            | REDIS_HOST=192.168.200.32
REDIS_PORT=6379                                 | REDIS_PORT=6379
REDIS_PASSWORD=cidb1234                         | REDIS_PASSWORD=cidb1234
REDIS_USERNAME=cidbaccess                       | REDIS_USERNAME=cidbaccess
REDIS_DB=0                                       | REDIS_DB=0

# ============================================================================
# CACHE TTL SETTINGS
# ============================================================================
# Development                                    | Production
CACHE_TTL_DEFAULT=3600                          | [MISSING]
CACHE_TTL_TENANT_SETTINGS=1800                  | [MISSING]
CACHE_TTL_USER_SESSION=7200                     | [MISSING]
CACHE_TTL_AUTH_TOKEN=900                        | [MISSING]
CACHE_TTL_CONTENT=600                           | [MISSING]

# ============================================================================
# LOGGING
# ============================================================================
# Development                                    | Production
# LOG_FORMAT=pretty (COMMENTED)                  | LOG_FORMAT=json
# GEMINI_API_KEY=xxx (COMMENTED)                 | [NOT PRESENT]
NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER='true'        | NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER='true'

# ============================================================================
# MINIO/S3 CONFIGURATION
# ============================================================================
# Development                                    | Production
# MINIO_ENDPOINT=203.81.66.116 (COMMENTED)       | MINIO_ENDPOINT=192.168.200.33
# MINIO_PORT=9000 (COMMENTED)                    | MINIO_PORT=9000
# MINIO_USE_SSL=false (COMMENTED)                | MINIO_USE_SSL=false
# MINIO_REGION=us-east-1 (COMMENTED)             | MINIO_REGION=us-east-1
# MINIO_ROOT_USER=minioadmin (COMMENTED)         | MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=cidb1234 (COMMENTED)       | MINIO_ROOT_PASSWORD=cidb1234
# MINIO_PUBLIC_ENDPOINT_TEMPLATE (COMMENTED)     | MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
# MINIO_PUBLIC_PORT=443 (COMMENTED)              | MINIO_PUBLIC_PORT=443
# MINIO_PUBLIC_USE_SSL=true (COMMENTED)          | MINIO_PUBLIC_USE_SSL=true

# ============================================================================
# API SUBDOMAINS
# ============================================================================
# Development                                    | Production
# API_SUBDOMAIN=api-dev (COMMENTED)              | API_SUBDOMAIN=api
# AUTH_SUBDOMAIN=auth-dev (COMMENTED)            | AUTH_SUBDOMAIN=auth
# WWW_SUBDOMAIN=www-dev (COMMENTED)              | WWW_SUBDOMAIN=www
NEXT_PUBLIC_API_SUBDOMAIN=api-dev               | NEXT_PUBLIC_API_SUBDOMAIN=api
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth-dev             | NEXT_PUBLIC_AUTH_SUBDOMAIN=auth

# ============================================================================
# NEXT.JS CONFIGURATION
# ============================================================================
# Development                                    | Production
NEXT_PUBLIC_APP_URL=http://localhost:3001       | NEXT_PUBLIC_APP_URL=https://app.um1ygn.edu.mm
```

---

## PUBLICWEB Application Environment Variables

### Development (.env) vs Production (.env.production)

```bash
# ============================================================================
# BASIC CONFIGURATION
# ============================================================================
# Development                                    | Production
NODE_ENV=development                            | NODE_ENV=production
PORT=3000                                       | PORT=3000

# ============================================================================
# CONFIG SERVICE
# ============================================================================
# Development                                    | Production
ENABLE_CONFIG_HOT_RELOAD=true                   | ENABLE_CONFIG_HOT_RELOAD=true
CONFIG_SERVICE_URL=http://localhost:3330        | CONFIG_SERVICE_URL=http://config.ciapp-backend.svc.cluster.local:3330
CONFIG_SERVICE_APP_NAME=publicWeb               | CONFIG_SERVICE_APP_NAME=publicWeb
CONFIG_SERVICE_ENVIRONMENT=development          | CONFIG_SERVICE_ENVIRONMENT=production
CONFIG_REFRESH_INTERVAL=300000                  | CONFIG_REFRESH_INTERVAL=300000
CONFIG_DEBUG=true                                | CONFIG_DEBUG=false

# ============================================================================
# OIDC CONFIGURATION
# ============================================================================
# Development                                    | Production
# TENANT_API_CLIENT_ID=xxx (COMMENTED)           | TENANT_API_CLIENT_ID=f636728...102f75d2
# TENANT_API_CLIENT_SECRET=xxx (COMMENTED)       | TENANT_API_CLIENT_SECRET=T7uAqmC0...aDRPs

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
# Development                                    | Production
REDIS_HOST=localhost                            | REDIS_HOST=192.168.200.32
REDIS_PORT=6379                                 | REDIS_PORT=6379
REDIS_PASSWORD=cidb1234                         | REDIS_PASSWORD=cidb1234
REDIS_USERNAME=cidbaccess                       | REDIS_USERNAME=cidbaccess
REDIS_DB=0                                       | REDIS_DB=0

# ============================================================================
# CACHE TTL SETTINGS
# ============================================================================
# Development                                    | Production
CACHE_TTL_DEFAULT=3600                          | [MISSING]
CACHE_TTL_TENANT_SETTINGS=1800                  | [MISSING]
CACHE_TTL_USER_SESSION=7200                     | [MISSING]
CACHE_TTL_AUTH_TOKEN=900                        | [MISSING]
CACHE_TTL_CONTENT=600                           | [MISSING]

# ============================================================================
# PDF SERVICE
# ============================================================================
# Development                                    | Production
PDF_SERVICE_URL=http://localhost:3338           | PDF_SERVICE_URL=http://pdf-service.ciapp-backend.svc.cluster.local:3338
PDF_SERVICE_TIMEOUT=30000                       | PDF_SERVICE_TIMEOUT=30000

# ============================================================================
# LOGGING
# ============================================================================
# Development                                    | Production
LOG_FORMAT=pretty                                | [MISSING]
NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER='true'        | [MISSING]

# ============================================================================
# MINIO/S3 CONFIGURATION
# ============================================================================
# Development                                    | Production
# MINIO_ENDPOINT=203.81.66.116 (COMMENTED)       | MINIO_ENDPOINT=192.168.200.33
# MINIO_PORT=9000 (COMMENTED)                    | MINIO_PORT=9000
# MINIO_USE_SSL=false (COMMENTED)                | MINIO_USE_SSL=false
# MINIO_REGION=us-east-1 (COMMENTED)             | MINIO_REGION=us-east-1
# MINIO_ROOT_USER=minioadmin (COMMENTED)         | MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=cidb1234 (COMMENTED)       | MINIO_ROOT_PASSWORD=cidb1234
# MINIO_BUCKET_STRATEGY=per-tenant (COMMENTED)   | MINIO_BUCKET_STRATEGY=per-tenant
# MINIO_PUBLIC_ENDPOINT_TEMPLATE (COMMENTED)     | MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
# MINIO_PUBLIC_PORT=443 (COMMENTED)              | MINIO_PUBLIC_PORT=443
# MINIO_PUBLIC_USE_SSL=true (COMMENTED)          | MINIO_PUBLIC_USE_SSL=true

# ============================================================================
# API SUBDOMAINS
# ============================================================================
# Development                                    | Production
API_SUBDOMAIN=api-dev                           | API_SUBDOMAIN=api
AUTH_SUBDOMAIN=auth-dev                         | AUTH_SUBDOMAIN=auth
# API_SUBDOMAIN=api-dev (DUPLICATE COMMENT)      | [NOT PRESENT]
# AUTH_SUBDOMAIN=auth-dev (DUPLICATE COMMENT)    | [NOT PRESENT]
NEXT_PUBLIC_API_SUBDOMAIN=api-dev               | NEXT_PUBLIC_API_SUBDOMAIN=api
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth-dev             | NEXT_PUBLIC_AUTH_SUBDOMAIN=auth

# ============================================================================
# NEXT.JS CONFIGURATION
# ============================================================================
# Development                                    | Production
NEXT_PUBLIC_APP_URL=http://localhost:3000       | NEXT_PUBLIC_APP_URL=https://www.um1ygn.edu.mm
```

---

## 🔍 Key Differences Summary

### CORE vs PUBLICWEB Differences

| Variable | CORE | PUBLICWEB | Note |
|----------|------|-----------|------|
| **PORT** | 3001 | 3000 | Different ports for local development |
| **CONFIG_SERVICE_APP_NAME** | coreWeb | publicWeb | Different app identifiers |
| **NEXT_PUBLIC_APP_URL (dev)** | http://localhost:3001 | http://localhost:3000 | Different local ports |
| **NEXT_PUBLIC_APP_URL (prod)** | https://app.um1ygn.edu.mm | https://www.um1ygn.edu.mm | Different subdomains |
| **PDF_SERVICE_URL** | Not present | Present | Only publicWeb needs PDF service |
| **LOG_FORMAT** | Commented (dev) / json (prod) | pretty (dev) / Missing (prod) | Inconsistent |
| **WWW_SUBDOMAIN** | Present (commented) | Not present | Core has extra subdomain |
| **MINIO_BUCKET_STRATEGY** | Not present | per-tenant | PublicWeb needs bucket strategy |

### Development vs Production Differences

| Category | Development | Production |
|----------|------------|------------|
| **Config Service URL** | http://localhost:3330 | http://config.ciapp-backend.svc.cluster.local:3330 |
| **Redis Host** | localhost | 192.168.200.32 |
| **MinIO Endpoint** | 203.81.66.116 (commented) | 192.168.200.33 |
| **API Subdomain** | api-dev | api |
| **Auth Subdomain** | auth-dev | auth |
| **SSL/HTTPS** | HTTP (localhost) | HTTPS (production domains) |
| **Config Debug** | true | false |
| **Log Format** | pretty | json |

---

## 🚨 Variables Status Legend

- **[MISSING]** - Variable not present but should be
- **(COMMENTED)** - Variable is commented out
- **Present** - Variable exists and has a value
- **xxx** - Value truncated for brevity

---

## 📊 Quick Fix Priority Matrix

### HIGH Priority (Breaking Issues)
1. **OIDC Credentials** - Uncomment in development for both apps
2. **Cache TTL Settings** - Add to production for both apps

### MEDIUM Priority (Feature Issues)
1. **MinIO Configuration** - Uncomment in development for both apps
2. **Log Format** - Add to publicWeb production
3. **Console Logger** - Add to publicWeb production

### LOW Priority (Cleanup)
1. Remove duplicate commented subdomain entries in publicWeb
2. Remove unused GEMINI_API_KEY from core
3. Standardize LOG_FORMAT across environments