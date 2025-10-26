# Required Environment Variables

**Last Updated:** 2025-10-26
**Error Reporting System:** stdout → Promtail → Loki → Grafana

---

## 🔴 CRITICAL - Both publicWeb & core

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` / `production` | ✅ Yes |
| `REDIS_HOST` | Redis server host | `localhost` / `192.168.200.32` | ✅ Yes |
| `REDIS_PORT` | Redis server port | `6379` | ✅ Yes |
| `REDIS_DB` | Redis database number | `0` | ✅ Yes |
| `REDIS_USERNAME` | Redis username (ACL) | `cidbaccess` | Optional |
| `REDIS_PASSWORD` | Redis password | `your-password` | Production |
| `TENANT_API_CLIENT_ID` | Tenant API authentication ID | `f636728...` | ✅ Yes |
| `TENANT_API_CLIENT_SECRET` | Tenant API authentication secret | `T7uAqmC...` | ✅ Yes |

---

## 🟡 IMPORTANT - Multi-Tenant Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ALLOWED_DOMAINS` | Comma-separated allowed domains | `localhost,um1ygn.edu.mm` | ✅ Yes |
| `API_SUBDOMAIN` | API subdomain name | `api` / `api-dev` | ✅ Yes |
| `AUTH_SUBDOMAIN` | Auth subdomain name | `auth` / `auth-dev` | ✅ Yes |
| `WWW_SUBDOMAIN` | WWW subdomain (core only) | `www` / `www-dev` | ✅ Yes (core) |
| `NEXT_PUBLIC_API_SUBDOMAIN` | Public API subdomain (client-side) | `api` | ✅ Yes |
| `NEXT_PUBLIC_AUTH_SUBDOMAIN` | Public auth subdomain (client-side) | `auth` | ✅ Yes |

---

## 🟢 LOGGING - Promtail → Loki → Grafana

| Variable | Description | Values | Required |
|----------|-------------|--------|----------|
| `LOG_FORMAT` | Log output format | `json` (prod) / `pretty` (dev) | ✅ Yes |

**Log Format Details:**
- `json` - Structured JSON logs for Loki ingestion (production)
- `pretty` - Human-readable logs with emojis (development)

**Architecture:**
```
ApplicationError → stdout (LOG_FORMAT) → Promtail → Loki → Grafana
```

---

## 🟣 OPTIONAL - Service Configuration

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `PORT_GATEWAY` | Gateway service port | `3331` | Optional |
| `PORT_AUTH` | Auth service port | `3332` | Optional |
| `API_GATEWAY_KEY` | API Gateway auth key | - | Optional |
| `API_GATEWAY_SECRET` | API Gateway auth secret | - | Optional |

---

## 🔵 OPTIONAL - Authentication

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `OIDC_CLIENT_ID` | OIDC client identifier | - | For OIDC flow |
| `OIDC_CLIENT_SECRET` | OIDC client secret | - | For OIDC flow |
| `AUTH_SESSION_TIMEOUT_MINUTES` | Session timeout in minutes | `60` | Optional |
| `AUTH_SESSION_IP_VALIDATION` | Enable IP validation | `false` | Optional |
| `AUTH_SESSION_USER_AGENT_VALIDATION` | Enable user agent validation | `false` | Optional |

---

## 🟠 OPTIONAL - Next.js Configuration

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `NEXT_PUBLIC_API_URL` | Public API base URL | `/api` | Client-side |
| `FORCE_HTTPS` | Force HTTPS protocol | `false` | Production: `true` |

---

## Minimal Configuration

### Development (.env.development)

```bash
# Critical
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
TENANT_API_CLIENT_ID=your-dev-client-id
TENANT_API_CLIENT_SECRET=your-dev-client-secret

# Multi-tenant
ALLOWED_DOMAINS=localhost,um1ygn.edu.mm
API_SUBDOMAIN=api-dev
AUTH_SUBDOMAIN=auth-dev
WWW_SUBDOMAIN=www-dev
NEXT_PUBLIC_API_SUBDOMAIN=api-dev
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth-dev

# Service Ports
PORT_GATEWAY=3331
PORT_AUTH=3332

# Logging (stdout → Promtail → Loki)
LOG_FORMAT=pretty
```

### Production (.env.production)

```bash
# Critical
NODE_ENV=production
REDIS_HOST=192.168.200.32
REDIS_PORT=6379
REDIS_PASSWORD=cidb1234
REDIS_USERNAME=cidbaccess
REDIS_DB=0
TENANT_API_CLIENT_ID=f63672873ab7908f14f889c9a4d1b0747b8036257aa08c3568f5b1aa102f75d2
TENANT_API_CLIENT_SECRET=T7uAqmC0utEiQO4ifCDvlnscjFTxaV8/XLPngmA7phCCif8mZy25MrTTu9OaDRPs

# Multi-tenant
ALLOWED_DOMAINS=um1ygn.edu.mm
API_SUBDOMAIN=api
AUTH_SUBDOMAIN=auth
WWW_SUBDOMAIN=www
NEXT_PUBLIC_API_SUBDOMAIN=api
NEXT_PUBLIC_AUTH_SUBDOMAIN=auth

# Service Ports
PORT_GATEWAY=3331
PORT_AUTH=3332

# Logging (stdout → Promtail → Loki → Grafana)
LOG_FORMAT=json

# Optional Production Settings
AUTH_SESSION_TIMEOUT_MINUTES=60
FORCE_HTTPS=true
```

---

## Notes

### ❌ Removed Variables (Not Used)

The following variables were removed as the external HTTP error reporting system has been disabled:

- `ERROR_REPORTING_ENDPOINT` - External error service URL
- `ERROR_REPORTING_API_KEY` - External error service API key
- `NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT` - Client-side error endpoint
- `NEXT_PUBLIC_BUILD_VERSION` - Build version tracking
- `NEXT_PUBLIC_SERVICE_NAME` - Service identifier

**Reason:** System now uses stdout → Promtail → Loki → Grafana for all error logging.

### 🔧 Dynamic URL Construction

`API_GATEWAY_URL` is **not required** because the system dynamically constructs API URLs based on:
- Hostname from request headers
- Environment-based subdomain configuration
- Protocol detection (HTTP in dev, HTTPS in prod)

Only set `API_GATEWAY_URL` if using bare `localhost` without tenant domain resolution.

### 🏗️ Multi-Tenant Architecture

This is a multi-tenant application using hostname-based tenant resolution:
- **Development:** Uses hosts file (e.g., `www-dev.tenant1.local`)
- **Production:** Uses actual domains (e.g., `app.tenant1.um1ygn.edu.mm`)

Error logs include tenant context via the `service` field:
- **publicWeb:** `publicWeb-{hostname}`
- **core:** `{hostname}`

---

**For more details, see:**
- [Error Handling Flow](ERROR_HANDLING_FLOW.md)
- [Loki Setup Guide](LOKI_SETUP.md)
- [Environment Examples](.env.example)
