# PublicWeb and Core Service Configuration Dependencies

## Overview
Both `publicWeb` and `core` services are Next.js 15.4 applications in a monorepo that share most configuration. They use **subdomain-based URL construction** instead of hardcoded base URLs.

---

## **Critical Dependencies (Both Services)**

### 🔴 Required - Application Will Not Start Without These

| Category | Variable | Purpose | Example Value |
|----------|----------|---------|---------------|
| **Environment** | `NODE_ENV` | Environment mode | `development` / `production` |
| | `PORT` | Service port | `3000` (publicWeb) / `3001` (core) |
| **OIDC Auth** | `TENANT_API_CLIENT_ID` | OIDC client ID for tenant API | `f63672873ab7...` |
| | `TENANT_API_CLIENT_SECRET` | OIDC client secret | `T7uAqmC0ut...` |
| **Redis Cache** | `REDIS_HOST` | Redis server host | `localhost` |
| | `REDIS_PORT` | Redis server port | `6379` |
| | `REDIS_PASSWORD` | Redis password | `cidb1234` |
| | `REDIS_USERNAME` | Redis username | `cidbaccess` |
| | `REDIS_DB` | Redis database number | `0` |
| **Subdomain Config** | `API_SUBDOMAIN` | API subdomain (env-based) | `api-dev` (dev) / `api` (prod) |
| | `AUTH_SUBDOMAIN` | Auth subdomain (env-based) | `auth-dev` (dev) / `auth` (prod) |
| | `NEXT_PUBLIC_API_SUBDOMAIN` | Client-side API subdomain | `api-dev` (dev) / `api` (prod) |
| | `NEXT_PUBLIC_AUTH_SUBDOMAIN` | Client-side Auth subdomain | `auth-dev` (dev) / `auth` (prod) |
| **Security** | `SESSION_SECRET` | Session encryption secret | `your-session-secret-here` |
| | `JWT_SECRET` | JWT signing secret | `your-jwt-secret-here` |
| | `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| | `ENCRYPTION_KEY` | Data encryption key | `32-char-key` |

### 🟡 Optional - Has Sensible Defaults

| Category | Variable | Purpose | Default |
|----------|----------|---------|---------|
| **Cache TTL** | `CACHE_TTL_DEFAULT` | Default cache TTL (seconds) | `3600` |
| | `CACHE_TTL_TENANT_SETTINGS` | Tenant settings cache | `1800` |
| | `CACHE_TTL_USER_SESSION` | User session cache | `7200` |
| | `CACHE_TTL_AUTH_TOKEN` | Auth token cache | `900` |
| | `CACHE_TTL_CONTENT` | Content cache | `600` |
| **Development** | `DEVELOPMENT_MODE` | Enable dev features | `false` |
| **Ports** | `PORT_GATEWAY` | API gateway port (info only) | `3331` |
| | `PORT_AUTH` | Auth service port (info only) | `3332` |
| **Next.js** | `NEXT_PUBLIC_API_URL` | Public API URL | Constructed dynamically |
| | `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:{PORT}` |

---

## **Service-Specific Configuration**

### **PublicWeb Service (Port 3000)**

```bash
# apps/publicWeb/.env
NODE_ENV=development
PORT=3000

# OIDC Configuration
TENANT_API_CLIENT_ID=f63672873ab7908f14f889c9a4d1b0747b8036257aa08c3568f5b1aa102f75d2
TENANT_API_CLIENT_SECRET=T7uAqmC0utEiQO4ifCDvlnscjFTxaV8/XLPngmA7phCCif8mZy25MrTTu9OaDRPs

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=cidb1234
REDIS_USERNAME=cidbaccess
REDIS_DB=0

# Subdomain Configuration (Development)
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev
NEXT_PUBLIC_API_SUBDOMAIN=api-dev
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth-dev

# Security
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Optional
DEVELOPMENT_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Purpose**: Public-facing student registration portal
**Access**: `http://app.um1ygn.edu.mm/cpms/students/new`
**Authentication**: Optional (allows unauthenticated student registration)

---

### **Core Service (Port 3001)**

```bash
# apps/core/.env
NODE_ENV=development
PORT=3001

# OIDC Configuration (same as publicWeb)
TENANT_API_CLIENT_ID=f63672873ab7908f14f889c9a4d1b0747b8036257aa08c3568f5b1aa102f75d2
TENANT_API_CLIENT_SECRET=T7uAqmC0utEiQO4ifCDvlnscjFTxaV8/XLPngmA7phCCif8mZy25MrTTu9OaDRPs

# Redis Configuration (same as publicWeb)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=cidb1234
REDIS_USERNAME=cidbaccess
REDIS_DB=0

# Subdomain Configuration (Development)
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev
WWW_SUBDOMAIN=www-dev              # ⚠️ UNIQUE TO CORE
NEXT_PUBLIC_API_SUBDOMAIN=api-dev
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth-dev

# Security (same as publicWeb)
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Optional
DEVELOPMENT_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Purpose**: Enterprise Resource Planning (ERP) application
**Access**: Internal system, authenticated users only
**Unique Feature**: `WWW_SUBDOMAIN` for fallback redirects to public login page
**Authentication**: Required for all routes

---

## **Environment-Based Configuration**

### Development Environment
```bash
NODE_ENV=development
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev
WWW_SUBDOMAIN=www-dev        # Core only
DEVELOPMENT_MODE=true
```

**URLs Generated**:
- API: `http://api-dev.{domain}`
- Auth: `http://auth-dev.{domain}`
- WWW: `http://www-dev.{domain}`

### Production Environment
```bash
NODE_ENV=production
API_SUBDOMAIN=api
AUTH_SUBDOMAIN=auth
WWW_SUBDOMAIN=www            # Core only
DEVELOPMENT_MODE=false
```

**URLs Generated**:
- API: `https://api.{domain}`
- Auth: `https://auth.{domain}`
- WWW: `https://www.{domain}`

---

## **Dependency Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Services (Required)                  │
├─────────────────────────────────────────────────────────────────┤
│  • Redis Server (localhost:6379)                                │
│    └─> Used for: Session storage, token caching, tenant cache   │
│                                                                  │
│  • API Gateway (api-dev.um1ygn.edu.mm or api.um1ygn.edu.mm)    │
│    └─> Dynamically constructed from API_SUBDOMAIN + domain      │
│                                                                  │
│  • Auth Service (auth-dev.um1ygn.edu.mm or auth.um1ygn.edu.mm) │
│    └─> Dynamically constructed from AUTH_SUBDOMAIN + domain     │
│                                                                  │
│  • OIDC Provider (for tenant API authentication)                │
│    └─> Uses TENANT_API_CLIENT_ID + TENANT_API_CLIENT_SECRET    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Shared Libraries (Monorepo Packages)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @repo/utils/server/domain.ts                                   │
│  ├─> getApiDomain() ──────────> Constructs API URL dynamically │
│  ├─> getAuthDomain() ─────────> Constructs Auth URL            │
│  └─> getPublicUrl() ──────────> Constructs WWW URL (Core)      │
│                                                                  │
│  @repo/utils/common/url.ts                                      │
│  ├─> getApiSubdomain() ───────> Returns api-dev or api         │
│  ├─> getAuthSubdomain() ──────> Returns auth-dev or auth       │
│  ├─> getWwwSubdomain() ───────> Returns www-dev or www         │
│  └─> getApiEndpoint() ────────> Full URL construction          │
│                                                                  │
│  @repo/cache                                                     │
│  └─> Redis client with tenant-scoped keys                      │
│                                                                  │
│  @repo/auth                                                      │
│  ├─> TokenManager (uses Redis + OIDC)                          │
│  └─> OIDC client initialization                                │
│                                                                  │
│  @repo/security                                                  │
│  └─> SessionManager (uses Redis + JWT)                         │
│                                                                  │
│  @repo/tenant                                                    │
│  └─> Multi-tenant middleware & resolution                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ↓                           ↓
      ┌──────────────────┐        ┌──────────────────┐
      │  PublicWeb App   │        │   Core App       │
      │  (Port 3000)     │        │  (Port 3001)     │
      ├──────────────────┤        ├──────────────────┤
      │                  │        │                  │
      │ Config Required: │        │ Config Required: │
      │ ✓ OIDC creds     │        │ ✓ OIDC creds     │
      │ ✓ Redis creds    │        │ ✓ Redis creds    │
      │ ✓ API_SUBDOMAIN  │        │ ✓ API_SUBDOMAIN  │
      │ ✓ AUTH_SUBDOMAIN │        │ ✓ AUTH_SUBDOMAIN │
      │ ✓ Security keys  │        │ ✓ WWW_SUBDOMAIN  │
      │                  │        │ ✓ Security keys  │
      │ Features:        │        │                  │
      │ • Student portal │        │ Features:        │
      │ • Registration   │        │ • ERP system     │
      │ • Public access  │        │ • Auth required  │
      │ • Form wizard    │        │ • Admin panel    │
      │                  │        │ • User mgmt      │
      └──────────────────┘        └──────────────────┘
```

---

## **URL Construction Flow**

### How Dynamic URLs Work:

```javascript
// 1. Request comes in with hostname
const hostname = "app.um1ygn.edu.mm"

// 2. System extracts base domain
const baseDomain = "um1ygn.edu.mm"

// 3. Gets environment-based subdomain
const apiSubdomain = getApiSubdomain()  // Returns "api-dev" or "api"

// 4. Constructs full URL
const apiUrl = `https://${apiSubdomain}.${baseDomain}`
// Result: https://api-dev.um1ygn.edu.mm (dev)
//     or: https://api.um1ygn.edu.mm (prod)
```

### Key Functions:

| Function | Location | Purpose | Example Output |
|----------|----------|---------|----------------|
| `getApiDomain()` | `@repo/utils/server` | Server-side API URL | `http://api-dev.um1ygn.edu.mm` |
| `getAuthDomain()` | `@repo/utils/server` | Server-side Auth URL | `http://auth-dev.um1ygn.edu.mm` |
| `getPublicUrl()` | `@repo/utils/server` | Server-side WWW URL | `http://www-dev.um1ygn.edu.mm` |
| `getApiEndpoint()` | `@repo/utils/common` | Generic API endpoint | `http://api-dev.um1ygn.edu.mm` |
| `buildAuthApiUrl()` | `@repo/utils/common` | Auth API with path | `http://auth-dev.um1ygn.edu.mm/login` |

---

## **What's NOT Needed**

### ❌ Removed/Deprecated Variables

| Variable | Why Not Needed | Replacement |
|----------|----------------|-------------|
| `API_BASE_URL` | Hardcoded URL, not dynamic | Use `API_SUBDOMAIN` + dynamic construction |
| `API_GATEWAY_URL` | Duplicate of above | Use `getApiDomain()` |
| `PORT_GATEWAY` | Info only, not used in code | Removed |
| `PORT_AUTH` | Info only, not used in code | Removed |

### Why Dynamic Construction is Better:

1. ✅ **Multi-tenant support**: Works with any domain
2. ✅ **Environment flexibility**: Same config works for dev/prod
3. ✅ **No hardcoding**: URLs adapt to current hostname
4. ✅ **Simpler config**: Just set subdomains, not full URLs
5. ✅ **Protocol detection**: Automatically uses http/https based on environment

---

## **Configuration Validation**

### Startup Checks (Both Services):

```bash
# Required checks at startup
✓ Redis connection established
✓ OIDC credentials present
✓ Subdomain configuration set
✓ Security secrets defined
✓ JWT secret is strong (not default)
✓ Session secret is strong (not default)
```

### Runtime Checks:

```bash
# On each request
✓ Tenant resolved from domain
✓ API URL constructed correctly
✓ Redis cache accessible
✓ Session valid and not expired
```

---

## **Common Configuration Issues**

### Issue 1: "Cannot connect to Redis"
**Cause**: Redis credentials incorrect or server not running
**Fix**: Verify `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`

### Issue 2: "Tenant not found"
**Cause**: API subdomain misconfigured
**Fix**: Ensure `API_SUBDOMAIN` matches your environment (api-dev for dev, api for prod)

### Issue 3: "Authentication failed"
**Cause**: OIDC credentials incorrect
**Fix**: Check `TENANT_API_CLIENT_ID` and `TENANT_API_CLIENT_SECRET`

### Issue 4: "Session expired immediately"
**Cause**: JWT or session secret changed
**Fix**: Use consistent secrets across restarts, don't regenerate on each deploy

---

## **Best Practices**

### 1. Environment Separation
```bash
# Development
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev

# Production
API_SUBDOMAIN=api
AUTH_SUBDOMAIN=auth
```

### 2. Shared Secrets
- Use **same OIDC credentials** for both publicWeb and core
- Use **same Redis instance** for both services
- Use **same JWT/Session secrets** for consistent auth

### 3. Security
- Never commit `.env` files
- Use strong, unique secrets in production
- Rotate secrets periodically
- Use environment variables in CI/CD

### 4. Testing
- Test with actual domain names, not localhost
- Verify subdomain construction in logs
- Check Redis connection on startup
- Validate OIDC token exchange

---

## **Minimum Working Configuration**

### For Both Services:

```bash
# .env (minimum required)
NODE_ENV=development
PORT=3000  # or 3001 for core

# OIDC
TENANT_API_CLIENT_ID=your-client-id
TENANT_API_CLIENT_SECRET=your-client-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_USERNAME=your-username
REDIS_DB=0

# Subdomains
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev
NEXT_PUBLIC_API_SUBDOMAIN=api-dev
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth-dev

# Core only
WWW_SUBDOMAIN=www-dev

# Security
SESSION_SECRET=your-session-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=your-32-char-encryption-key!!
```

---

## **Summary**

### Critical Takeaways:

1. **No hardcoded URLs needed** - System uses dynamic subdomain construction
2. **Both services share most config** - Only difference is `WWW_SUBDOMAIN` for core
3. **Environment-based subdomains** - `-dev` suffix for development, no suffix for production
4. **Redis and OIDC are required** - Application won't start without them
5. **Security secrets must be strong** - Use 32+ character random strings

### Configuration Philosophy:

> **Dynamic over Static**: Instead of hardcoding API URLs, we construct them dynamically from the current domain and environment-specific subdomains. This enables true multi-tenancy and environment flexibility.

---

**Last Updated**: 2025-10-14
**Version**: 2.0
**Maintained by**: Claude Code Sessions
