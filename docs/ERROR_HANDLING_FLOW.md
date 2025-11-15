# Complete Error Handling Flow - PublicWeb & Core Apps

## Overview

Both apps are **multi-tenant** applications with comprehensive error handling at multiple layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                             │
│                    (tenant.example.com)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. MIDDLEWARE LAYER                           │
│  apps/publicWeb/src/middleware.ts (publicWeb)                   │
│  apps/core/src/middleware.ts (core)                             │
│                                                                  │
│  • Tenant resolution from hostname                              │
│  • Sets x-tenant-id header                                      │
│  • Error: Redirect to /error/tenant-not-found                  │
│  • No error reporting here (just logs)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. ROOT LAYOUT LAYER                          │
│  apps/publicWeb/src/app/layout.tsx                              │
│  apps/core/src/app/layout.tsx                                   │
│                                                                  │
│  • Server Component                                             │
│  • Tenant data fetching                                         │
│  • Error: Falls through to global-error.tsx                     │
│  • No error reporting (wrapped by global-error)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. PAGE COMPONENT LAYER                       │
│  apps/publicWeb/src/app/*/page.tsx                              │
│  apps/core/src/app/[appId]/[module]/page.tsx                   │
│                                                                  │
│  • Server Components                                            │
│  • Data fetching with getModuleList()                           │
│  • Error: Falls to error.tsx in same directory                  │
│  • Currently: console.log() only (NOT using error reporter) ❌  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. API ROUTE LAYER                            │
│  apps/publicWeb/src/app/api/*/route.ts                          │
│  apps/core/src/app/api/modules/[module]/route.ts ✅             │
│                                                                  │
│  • API endpoints for client-side fetching                       │
│  • Error: Return NextResponse with status 500/408               │
│  • Error reporting: reportError(ApplicationError) ✅            │
│  • Includes: module, endpoint, tenantId, isTimeout              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. SERVER ACTIONS LAYER                       │
│  libs/appModules/server-actions/module-actions.ts ✅            │
│  apps/publicWeb/src/actions/*.ts                                │
│                                                                  │
│  • Server-side mutations                                        │
│  • Error: Return { success: false, error: "..." }              │
│  • Error reporting: reportError(ApplicationError) ✅            │
│  • Includes: module, params, action name                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    6. SERVICE LAYER                              │
│  libs/appModules/module-service.ts                              │
│  libs/appModules/wrapper.ts                                     │
│                                                                  │
│  • HTTP client calls to microservices                           │
│  • Error: Throws Error (caught by caller)                       │
│  • No error reporting (handled by callers)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    7. HTTP CLIENT LAYER                          │
│  libs/api/server/server.ts                                      │
│  libs/api/clients/client.ts (client-side)                       │
│                                                                  │
│  • Axios HTTP calls                                             │
│  • Interceptors for auth, tenant headers                        │
│  • Error: Throws HTTP errors                                    │
│  • No error reporting (handled by API routes/actions)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    8. ERROR BOUNDARY LAYERS                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  global-error.tsx (Root level - Critical errors)         │  │
│  │  apps/publicWeb/src/app/global-error.tsx ✅              │  │
│  │  apps/core/src/app/global-error.tsx ✅                   │  │
│  │                                                           │  │
│  │  • Catches app initialization errors                     │  │
│  │  • reportError(severity: 'critical') ✅                  │  │
│  │  • Metadata: digest, errorName, timestamp                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  error.tsx (Page level - Render errors)                  │  │
│  │  apps/publicWeb/src/app/error.tsx ✅                     │  │
│  │  apps/core/src/app/error.tsx ✅                          │  │
│  │                                                           │  │
│  │  • Catches page render errors                            │  │
│  │  • reportError(severity: 'high') ✅                      │  │
│  │  • Metadata: digest, errorName                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ErrorBoundary.tsx (Component level)                     │  │
│  │  apps/core/src/components/error/ErrorBoundary.tsx        │  │
│  │                                                           │  │
│  │  • Catches component errors                              │  │
│  │  • console.error() only (NOT using error reporter) ❌    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    9. ERROR REPORTER                             │
│  libs/utils/common/error-reporter.ts                            │
│                                                                  │
│  • StandardErrorReporter class                                  │
│  • Formats: 'json' (production) | 'pretty' (development)       │
│  • Output: console.log(JSON.stringify(error))                   │
│  • Remote: POST to ERROR_REPORTING_ENDPOINT (optional)          │
│  • Batching: Queue with periodic flush                          │
└─────────────────────────────────────────────────────────────────┘
```

## Error Reporting Status by Layer

### ✅ Using ApplicationError Reporter

1. **global-error.tsx** (both apps)
   - Location: Root level
   - Severity: `critical`
   - Component: `global-error-boundary`
   - Operation: `app-initialization`

2. **error.tsx** (both apps)
   - Location: Page level
   - Severity: `high`
   - Component: `error-boundary`
   - Operation: `page-render`

3. **API Routes** (core app only)
   - Location: `apps/core/src/app/api/modules/[module]/route.ts`
   - Severity: `medium` (timeout) | `high` (other)
   - Component: `api-route`
   - Operation: `fetch-module-list`
   - Metadata: `module`, `endpoint`, `tenantId`, `isTimeout`

4. **Server Actions**
   - Location: `libs/appModules/server-actions/module-actions.ts`
   - Severity: `high`
   - Component: `module-actions`
   - Operation: `fetch-module-list` | `create-item` | etc.
   - Metadata: `module`, `params`, `action`

### ❌ NOT Using ApplicationError Reporter (Need to Add)

1. **Middleware** (both apps)
   - `apps/publicWeb/src/middleware.ts`
   - `apps/core/src/middleware.ts`
   - Currently: `console.error()` only

2. **Page Components** (both apps)
   - `apps/core/src/app/[appId]/[module]/page.tsx` (line 98-99)
   - Currently: `console.log()` only

3. **PublicWeb API Routes**
   - `apps/publicWeb/src/app/api/**/*.ts`
   - Currently: `console.error()` only

4. **Component ErrorBoundary**
   - `apps/core/src/components/error/ErrorBoundary.tsx`
   - Currently: `console.error()` only

5. **PublicWeb Actions**
   - `apps/publicWeb/src/actions/*.ts`
   - Currently: `console.error()` only

6. **Layout Data Fetching**
   - `apps/core/src/lib/layout-data.ts`
   - Currently: `console.error()` only

## Error Context Per Layer

### Current Metadata Captured

```typescript
// global-error.tsx & error.tsx
{
  digest: string,           // Next.js error digest
  errorName: string,        // Error constructor name
  timestamp: string         // ISO timestamp
}

// API routes
{
  module: string,           // Module slug (e.g., "students")
  endpoint: string,         // API path (e.g., "/api/modules/students")
  tenantId: string,         // Multi-tenant ID
  isTimeout: boolean        // Is it a timeout error?
}

// Server actions
{
  module: string,           // Module slug
  params: object,           // Request parameters
  action: string            // Action name (e.g., "getModuleListAction")
}
```

### Missing Context (Need to Add)

```typescript
{
  hostname: string,         // Request hostname (for multi-tenant service field)
  appName: string,          // "publicWeb" or "core"
  userId: string,           // Current user ID
  sessionId: string,        // Session ID
  requestId: string,        // Request correlation ID
  path: string,             // Request path
  method: string,           // HTTP method
  userAgent: string,        // Browser user agent
  ipAddress: string         // Client IP (anonymized)
}
```

## Service Field Naming Strategy

Based on your requirement:

### PublicWeb
```
service: "publicWeb-{hostname}"

Examples:
- service: "publicWeb-tenant1.example.com"
- service: "publicWeb-dept.university.edu"
- service: "publicWeb-www.school.org"
```

### Core App
```
service: "{hostname}"

Examples:
- service: "core.tenant1.example.com"
- service: "app.university.edu"
- service: "erp.school.org"
```

## Log Output Format

### Development (LOG_FORMAT=pretty)
```javascript
🔥 CRITICAL ERROR: {
  timestamp: "2025-01-21T10:30:00.000Z",
  service: "publicWeb-tenant1.example.com",
  type: "UNKNOWN_ERROR",
  message: "Database connection failed",
  severity: "critical",
  ...
}
```

### Production (LOG_FORMAT=json)
```json
{
  "level": "fatal",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "service": "publicWeb-tenant1.example.com",
  "hostname": "tenant1.example.com",
  "appName": "publicWeb",
  "type": "UNKNOWN_ERROR",
  "message": "Database connection failed",
  "severity": "critical",
  "category": "application",
  "operation": "app-initialization",
  "component": "global-error-boundary",
  "tenantId": "tenant123",
  "userId": "user456",
  "sessionId": "sess789",
  "stack": "Error: ...",
  "metadata": {}
}
```

## Loki Label Strategy for Multi-Tenant

### Recommended Labels (Low Cardinality)
```yaml
labels:
  service: publicWeb-{hostname} | {hostname}  # One per tenant
  app: publicWeb | core                       # Application name
  environment: production | staging           # Environment
  level: fatal | error | warn | info          # Log level
  severity: critical | high | medium | low    # Business severity
  component: api-route | server-action | etc  # Component type
```

### Query Examples
```logql
# All errors for specific tenant
{service="publicWeb-tenant1.example.com", level="error"}

# All errors across all tenants for publicWeb
{app="publicWeb", level="error"}

# Specific tenant in core app
{service="core.tenant1.example.com"}

# Critical errors across all services
{severity="critical"}
```

## Next Steps to Complete Error Handling

1. **Add `service` field to error reporter**
   - Modify `libs/utils/common/error-reporter.ts`
   - Detect hostname from headers
   - Format as `publicWeb-{hostname}` or `{hostname}`

2. **Add error reporting to missing layers**
   - Middleware (both apps)
   - Page components (core app)
   - PublicWeb API routes
   - Component ErrorBoundary
   - PublicWeb actions
   - Layout data fetching

3. **Add request context to all errors**
   - userId, sessionId, requestId
   - path, method, userAgent
   - Extract from Next.js headers

4. **Test error logging**
   - Trigger errors in each layer
   - Verify JSON output
   - Verify service field is correct
   - Verify all metadata is captured

Would you like me to implement the service field with hostname detection now?
