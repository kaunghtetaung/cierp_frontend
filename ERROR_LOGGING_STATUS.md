# Error Logging Implementation Status

## ✅ Completed

### 1. Enhanced Error Context
- ✅ Added new fields to `ErrorContext` interface:
  - `hostname`, `appName`, `service`
  - `sessionId`, `requestId`, `path`, `method`, `userAgent`
- ✅ File: `libs/utils/common/error-types.ts`

### 2. Request Context Utilities
- ✅ Created `libs/utils/server/error-context.ts` for server-side
  - `getRequestContext()` - Extract from Next.js headers
  - `getMiddlewareRequestContext()` - Extract from middleware
  - `getApiRouteRequestContext()` - Extract from API routes
  - Service field builder: `publicWeb-{hostname}` or `{hostname}`

- ✅ Created `libs/utils/client/error-context.ts` for client-side
  - `getClientRequestContext()` - Extract from browser
  - Detects app name from URL patterns
  - Extracts hostname, path, userAgent from window

### 3. Error Reporter Updates
- ✅ Updated `StandardErrorReporter.logToConsole()` to include:
  - service, hostname, appName
  - sessionId, requestId, path, method, userAgent
- ✅ File: `libs/utils/common/error-reporter.ts`

### 4. Error Boundaries with Context
- ✅ `apps/publicWeb/src/app/global-error.tsx` - Uses client context
- ⏳ `apps/publicWeb/src/app/error.tsx` - **TODO: Add client context**
- ⏳ `apps/core/src/app/global-error.tsx` - **TODO: Add client context**
- ⏳ `apps/core/src/app/error.tsx` - **TODO: Add client context**

### 5. API Routes with Context
- ✅ `apps/core/src/app/api/modules/[module]/route.ts` - Has basic error reporting
- ⏳ **TODO: Add full request context extraction**
- ⏳ **TODO: Add to all publicWeb API routes**

### 6. Server Actions with Context
- ✅ `libs/appModules/server-actions/module-actions.ts` - Has basic error reporting
- ⏳ **TODO: Add full request context extraction**

### 7. Environment Configuration
- ✅ Added `LOG_FORMAT=json` to `.env.production`
- ✅ Added `LOG_FORMAT=pretty` to `.env.development`

### 8. Documentation
- ✅ Created `ERROR_HANDLING_FLOW.md` - Complete error flow diagram
- ✅ Created `LOKI_SETUP.md` - Grafana Loki integration guide
- ✅ Created this status document

## ⏳ TODO - Next Steps

### Immediate (High Priority)

#### 1. Update Remaining Error Boundaries
```typescript
// Pattern to use in all error.tsx and global-error.tsx files:
import { getClientRequestContext } from '@repo/utils/client/error-context';

const requestContext = getClientRequestContext();
const appError = new ApplicationError({
  // ...existing fields...
  hostname: requestContext.hostname,
  appName: requestContext.appName,
  service: requestContext.service,
  tenantId: requestContext.tenantId,
  userId: requestContext.userId,
  path: requestContext.path,
  userAgent: requestContext.userAgent,
});
```

**Files to update:**
- [ ] `apps/publicWeb/src/app/error.tsx`
- [ ] `apps/core/src/app/global-error.tsx`
- [ ] `apps/core/src/app/error.tsx`

#### 2. Update API Routes with Request Context
```typescript
// Pattern for API routes:
import { getApiRouteRequestContext } from '@repo/utils/server/error-context';

// In catch block:
const requestContext = getApiRouteRequestContext(request);
const appError = new ApplicationError({
  // ...existing fields...
  ...requestContext, // Spread all context fields
});
```

**Files to update:**
- [ ] `apps/core/src/app/api/modules/[module]/route.ts` (enhance existing)
- [ ] All routes in `apps/publicWeb/src/app/api/**/route.ts`
- [ ] All routes in `apps/core/src/app/api/**/route.ts`

#### 3. Update Server Actions with Request Context
```typescript
// Pattern for server actions:
import { getRequestContext } from '@repo/utils/server/error-context';

// In catch block:
const requestContext = await getRequestContext();
const appError = new ApplicationError({
  // ...existing fields...
  ...requestContext,
});
```

**Files to update:**
- [ ] `libs/appModules/server-actions/module-actions.ts` (all actions)
- [ ] `apps/publicWeb/src/actions/*.ts` (all actions)

#### 4. Add Error Reporting to Middleware
```typescript
// Pattern for middleware:
import { getMiddlewareRequestContext } from '@repo/utils/server/error-context';
import { reportError } from '@repo/utils/common/error-reporter';
import { ApplicationError } from '@repo/utils/common/error-types';

// In catch block:
const requestContext = getMiddlewareRequestContext(request);
const appError = new ApplicationError({
  type: 'MIDDLEWARE_ERROR',
  message: error instanceof Error ? error.message : 'Middleware error',
  severity: 'high',
  category: 'server',
  operation: 'tenant-resolution',
  component: 'middleware',
  cause: error instanceof Error ? error : undefined,
  ...requestContext,
});

reportError(appError).catch(err => {
  console.error('Failed to report middleware error:', err);
});
```

**Files to update:**
- [ ] `apps/publicWeb/src/middleware.ts`
- [ ] `apps/core/src/middleware.ts`

#### 5. Add Error Reporting to Page Components
```typescript
// Pattern for page components (server components):
import { getRequestContext } from '@repo/utils/server/error-context';
import { reportError } from '@repo/utils/common/error-reporter';
import { ApplicationError } from '@repo/utils/common/error-types';

// In catch block:
const requestContext = await getRequestContext();
const appError = new ApplicationError({
  type: 'PAGE_ERROR',
  message: error instanceof Error ? error.message : 'Page render error',
  severity: 'medium',
  category: 'server',
  operation: 'page-render',
  component: 'page-component',
  cause: error instanceof Error ? error : undefined,
  ...requestContext,
  metadata: {
    module: params.module,
    // ... other metadata
  }
});

reportError(appError);
```

**Files to update:**
- [ ] `apps/core/src/app/[appId]/[module]/page.tsx` (line 97-100)
- [ ] Other page components with try/catch blocks

### Medium Priority

#### 6. Add Error Reporting to Layout Data Fetching
**File:** `apps/core/src/lib/layout-data.ts`
- [ ] Add error reporting to `fetchLayoutData()` function

#### 7. Add Error Reporting to Component ErrorBoundary
**File:** `apps/core/src/components/error/ErrorBoundary.tsx`
- [ ] Add ApplicationError reporting to componentDidCatch

#### 8. Update Existing Console.error Calls
Search and replace pattern:
```bash
# Find all console.error calls
grep -r "console.error" apps/ libs/ --include="*.ts" --include="*.tsx"

# For each, evaluate if it should use ApplicationError instead
```

### Low Priority (Enhancements)

#### 9. Add Error Sampling
Prevent log spam for high-frequency errors:
```typescript
// In error-reporter.ts
private shouldLog(error: ApplicationError): boolean {
  // Always log critical/high
  if (error.severity === 'critical' || error.severity === 'high') {
    return true;
  }

  // Sample medium (10%)
  if (error.severity === 'medium') {
    return Math.random() < 0.1;
  }

  // Sample low (1%)
  return Math.random() < 0.01;
}
```

#### 10. Add Sensitive Data Redaction
```typescript
// In error-reporter.ts
private redactSensitiveData(metadata: any): any {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  // ... implementation
}
```

#### 11. Add Error Deduplication
```typescript
// In error-reporter.ts
private errorCache = new Map<string, number>();

private shouldReport(error: ApplicationError): boolean {
  const errorKey = `${error.type}:${error.message}`;
  const count = this.errorCache.get(errorKey) || 0;

  // Report every 10th occurrence
  if (count % 10 === 0) {
    this.errorCache.set(errorKey, count + 1);
    return true;
  }

  this.errorCache.set(errorKey, count + 1);
  return false;
}
```

#### 12. Add Correlation IDs
Extract correlation/trace IDs from headers:
```typescript
correlationId: headers.get('x-correlation-id'),
traceId: headers.get('x-trace-id'),
```

## Current Log Output Format

### Development (LOG_FORMAT=pretty)
```
🔥 CRITICAL ERROR: {
  level: "fatal",
  timestamp: "2025-01-21T10:30:00.000Z",
  service: "publicWeb-tenant1.example.com",
  hostname: "tenant1.example.com",
  appName: "publicWeb",
  type: "UNKNOWN_ERROR",
  message: "Database connection failed",
  severity: "critical",
  component: "global-error-boundary",
  tenantId: "tenant123",
  userId: "user456",
  ...
}
```

### Production (LOG_FORMAT=json)
```json
{"level":"fatal","timestamp":"2025-01-21T10:30:00.000Z","service":"publicWeb-tenant1.example.com","hostname":"tenant1.example.com","appName":"publicWeb","type":"UNKNOWN_ERROR","message":"Database connection failed","severity":"critical","category":"application","operation":"app-initialization","component":"global-error-boundary","tenantId":"tenant123","userId":"user456","sessionId":"sess789","requestId":"req-abc","path":"/students/new","method":"POST","userAgent":"Mozilla/5.0...","stack":"Error: ..."}
```

## Loki Query Examples

### Query by service (specific tenant)
```logql
{service="publicWeb-tenant1.example.com", level="error"}
```

### Query all errors for app
```logql
{appName="publicWeb", level="error"}
```

### Query by hostname
```logql
{hostname="tenant1.example.com"}
```

### Query with JSON filtering
```logql
{appName="core"} | json | tenantId="tenant123" | level="error"
```

## Testing Checklist

Once implementation is complete, test each error layer:

- [ ] Trigger error in global-error.tsx → Check service field in logs
- [ ] Trigger error in error.tsx → Check service field in logs
- [ ] Trigger API error → Check service field and request context
- [ ] Trigger server action error → Check full context
- [ ] Trigger middleware error → Check tenant resolution context
- [ ] Verify JSON format in production
- [ ] Verify pretty format in development
- [ ] Check Loki can parse JSON logs
- [ ] Verify service field format:
  - publicWeb: `publicWeb-{hostname}`
  - core: `{hostname}`

## Quick Reference

### Import Patterns

**Client Components (error.tsx, global-error.tsx):**
```typescript
import { getClientRequestContext } from '@repo/utils/client/error-context';
```

**Server Components (pages):**
```typescript
import { getRequestContext } from '@repo/utils/server/error-context';
```

**API Routes:**
```typescript
import { getApiRouteRequestContext } from '@repo/utils/server/error-context';
```

**Middleware:**
```typescript
import { getMiddlewareRequestContext } from '@repo/utils/server/error-context';
```

**Server Actions:**
```typescript
import { getRequestContext } from '@repo/utils/server/error-context';
```

### Service Field Examples

| App       | Hostname                  | Service Field                      |
|-----------|---------------------------|------------------------------------|
| publicWeb | tenant1.example.com       | `publicWeb-tenant1.example.com`    |
| publicWeb | dept.university.edu       | `publicWeb-dept.university.edu`    |
| core      | core.tenant1.example.com  | `core.tenant1.example.com`         |
| core      | app.university.edu        | `app.university.edu`               |

## Files Modified

✅ Completed:
- `libs/utils/common/error-types.ts`
- `libs/utils/common/error-reporter.ts`
- `libs/utils/server/error-context.ts` (new)
- `libs/utils/client/error-context.ts` (new)
- `apps/publicWeb/src/app/global-error.tsx`
- `.env.production`
- `.env.development`
- `.env.example`

⏳ TODO:
- `apps/publicWeb/src/app/error.tsx`
- `apps/core/src/app/global-error.tsx`
- `apps/core/src/app/error.tsx`
- `apps/publicWeb/src/middleware.ts`
- `apps/core/src/middleware.ts`
- `apps/core/src/app/[appId]/[module]/page.tsx`
- `apps/core/src/app/api/modules/[module]/route.ts`
- All publicWeb API routes
- All server actions
- Component ErrorBoundary

---

**Last Updated:** 2025-01-21
**Status:** ~20% Complete
**Next Session:** Continue with updating remaining error boundaries and API routes
