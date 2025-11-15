# Server Error Handler Usage Guide

**Purpose:** Unified error handling for all server-side code (middleware, API routes, server actions)

**Output:** All errors → stdout (JSON) → Promtail → Loki → Grafana

---

## Installation

Error handlers are available from `@repo/utils/server`:

```typescript
import {
  // Middleware error handling
  wrapMiddleware,
  logMiddlewareError,

  // API route error handling
  handleApiError,
  withApiErrorHandler,

  // Server action error handling
  handleServerActionError,
  withServerActionErrorHandler,

  // Manual error logging
  logServerError
} from '@repo/utils/server';
```

---

## 1. Middleware Error Handling

### Using `wrapMiddleware` (Recommended)

Automatically catches and logs all middleware errors.

**Before:**
```typescript
// apps/publicWeb/src/middleware.ts
export async function middleware(request: NextRequest) {
  // Your middleware logic
  const response = await createTenantMiddleware(request, config);
  return response;
}
```

**After:**
```typescript
// apps/publicWeb/src/middleware.ts
import { wrapMiddleware } from '@repo/utils/server';

export async function middleware(request: NextRequest) {
  return wrapMiddleware(request, 'publicWeb-middleware', async (req) => {
    // Your middleware logic - errors are automatically caught and logged
    const response = await createTenantMiddleware(req, config);
    return response;
  });
}
```

**Features:**
- ✅ Automatic error catching
- ✅ Full request context (hostname, tenant, user, session)
- ✅ Logs to stdout → Loki
- ✅ Allows request to continue (doesn't break the app)

### Logging Non-Critical Middleware Errors

Use `logMiddlewareError` for warnings that shouldn't stop processing:

```typescript
import { logMiddlewareError } from '@repo/utils/server';

export async function middleware(request: NextRequest) {
  try {
    const appId = await detectAppId(request);
  } catch (error) {
    // Log the error but continue with default appId
    await logMiddlewareError(
      error,
      request,
      'publicWeb-middleware',
      'app-id-detection',
      { fallbackUsed: 'PublicWeb' }
    );
    appId = 'PublicWeb'; // Use fallback
  }

  // Continue processing...
}
```

---

## 2. API Route Error Handling

### Using `withApiErrorHandler` (Recommended)

Wrap your entire API route handler for automatic error handling.

**Before:**
```typescript
// apps/publicWeb/src/app/api/lang/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ... your logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Language change API error:", error);
    return NextResponse.json({ success: false, error: "..." }, { status: 500 });
  }
}
```

**After:**
```typescript
// apps/publicWeb/src/app/api/lang/route.ts
import { withApiErrorHandler } from '@repo/utils/server';

export async function POST(request: NextRequest) {
  return withApiErrorHandler(request, async (req) => {
    const body = await req.json();
    // ... your logic
    return NextResponse.json({ success: true });
  }, {
    operation: 'change-language',
    component: 'lang-api'
  });
}
```

**Features:**
- ✅ Automatic error catching
- ✅ Full request context in logs
- ✅ Proper HTTP status codes (404 for not found, 500 for errors)
- ✅ Structured error responses

### Manual API Error Handling

For more control, use `handleApiError` directly:

```typescript
import { handleApiError } from '@repo/utils/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, request, {
      operation: 'fetch-data',
      component: 'data-api',
      metadata: { endpoint: '/api/data' }
    });
  }
}
```

---

## 3. Server Action Error Handling

### Using `withServerActionErrorHandler` (Recommended)

Wrap your server action for automatic error handling.

**Before:**
```typescript
// apps/publicWeb/src/actions/student-registration.ts
"use server";

export async function getStudentSchema() {
  try {
    const schema = await fetchSchema();
    return { success: true, data: schema };
  } catch (error) {
    console.error("Error fetching schema:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
```

**After:**
```typescript
// apps/publicWeb/src/actions/student-registration.ts
"use server";

import { withServerActionErrorHandler } from '@repo/utils/server';

export async function getStudentSchema() {
  return withServerActionErrorHandler(async () => {
    const schema = await fetchSchema();
    return { success: true, data: schema };
  }, {
    operation: 'get-student-schema',
    component: 'student-registration-actions'
  });
}
```

**Features:**
- ✅ Automatic error catching
- ✅ Full request context (extracts from headers)
- ✅ Logs to stdout → Loki
- ✅ Returns standardized error response

### Manual Server Action Error Handling

For more control, use `handleServerActionError` directly:

```typescript
"use server";

import { handleServerActionError } from '@repo/utils/server';

export async function submitForm(formData: FormData) {
  try {
    const result = await processForm(formData);
    return { success: true, data: result };
  } catch (error) {
    return handleServerActionError(error, {
      operation: 'submit-form',
      component: 'form-actions',
      metadata: {
        formFields: Array.from(formData.keys())
      }
    });
  }
}
```

---

## 4. Manual Error Logging

### When to Use

Use `logServerError` when you want to log an error without:
- Returning an error response
- Throwing an exception
- Interrupting the flow

### Example

```typescript
import { logServerError, getRequestContext } from '@repo/utils/server';

export async function someFunction() {
  const requestContext = await getRequestContext();

  try {
    await riskyOperation();
  } catch (error) {
    // Log the error but continue
    await logServerError(error, requestContext, {
      operation: 'risky-operation',
      component: 'some-service',
      category: 'application',
      metadata: { attempted: true }
    });

    // Use fallback behavior
    return fallbackBehavior();
  }
}
```

---

## Error Context Automatically Included

All error handlers automatically include:

```typescript
{
  // Service identification (for Loki filtering)
  service: "publicWeb-tenant1.um1ygn.edu.mm" | "core.tenant1.um1ygn.edu.mm",
  hostname: "tenant1.um1ygn.edu.mm",
  appName: "publicWeb" | "core",

  // Request details
  path: "/api/modules",
  method: "GET",
  requestId: "req_abc123",
  userAgent: "Mozilla/5.0...",

  // User context
  tenantId: "tenant_123",
  userId: "user_456",
  sessionId: "session_789",

  // Error details
  type: "API_ERROR" | "MIDDLEWARE_ERROR" | "SERVER_ACTION_ERROR",
  message: "Database connection failed",
  severity: "high",
  category: "api" | "middleware" | "server-action",
  operation: "fetch-module-list",
  component: "api-route",

  // Timestamps
  timestamp: "2025-10-26T10:30:45.123Z"
}
```

---

## Grafana LogQL Queries

### All middleware errors
```logql
{service=~"publicWeb-.*|.*"} | json | category="middleware"
```

### All API errors for specific tenant
```logql
{service="publicWeb-tenant1.um1ygn.edu.mm"} | json | category="api"
```

### All server action errors
```logql
{service=~".*"} | json | category="server-action" | severity="high"
```

### Errors by operation
```logql
{service=~".*"} | json | operation="submit-form"
```

### Critical errors only
```logql
{service=~".*"} | json | severity="critical"
```

---

## Migration Checklist

### Middleware Files (3 files)
- [ ] `apps/publicWeb/src/middleware.ts` - Wrap with `wrapMiddleware`
- [ ] `apps/core/src/middleware.ts` - Wrap with `wrapMiddleware`
- [ ] `libs/tenant/middleware-core.ts` - Use `logMiddlewareError` for errors

### API Routes - publicWeb (~15 files)
- [ ] `apps/publicWeb/src/app/api/lang/route.ts`
- [ ] `apps/publicWeb/src/app/api/verify-email/route.ts`
- [ ] `apps/publicWeb/src/app/api/auth/callback/route.ts`
- [ ] `apps/publicWeb/src/app/api/auth/debug/route.ts`
- [ ] `apps/publicWeb/src/app/api/auth/login/route.ts`
- [ ] `apps/publicWeb/src/app/api/auth/logout/route.ts`
- [ ] `apps/publicWeb/src/app/api/auth/refresh/route.ts`
- [ ] `apps/publicWeb/src/app/api/auth/session/route.ts`
- [ ] All other API routes in testToken folder

### API Routes - core (~8 files)
- [ ] `apps/core/src/app/api/lang/route.ts`
- [ ] `apps/core/src/app/api/test-tenant/route.ts`
- [ ] `apps/core/src/app/api/auth/callback/route.ts`
- [ ] `apps/core/src/app/api/auth/debug/route.ts`
- [ ] `apps/core/src/app/api/auth/login/route.ts`
- [ ] `apps/core/src/app/api/auth/logout/route.ts`
- [ ] `apps/core/src/app/api/auth/refresh/route.ts`
- [ ] `apps/core/src/app/api/auth/session/route.ts`

### Server Actions - publicWeb (~10 files)
- [ ] `apps/publicWeb/src/actions/student-registration.ts`
- [ ] `apps/publicWeb/src/actions/library/books.actions.ts`
- [ ] `apps/publicWeb/src/actions/library/catalog-types.actions.ts`
- [ ] `apps/publicWeb/src/actions/library/news.actions.ts`
- [ ] `apps/publicWeb/src/app/(register)/profileSetup/staff/staff-actions.ts`
- [ ] `apps/publicWeb/src/app/(register)/profileSetup/student/actions.ts`
- [ ] `apps/publicWeb/src/app/(register)/profileSetup/student/student-actions.ts`
- [ ] `apps/publicWeb/src/app/(register)/signup/actions.ts`
- [ ] `apps/publicWeb/src/app/profile/student/actions.ts`

---

## Best Practices

### ✅ DO

- Use wrapper functions (`wrapMiddleware`, `withApiErrorHandler`, etc.)
- Include meaningful operation names
- Add relevant metadata for debugging
- Let errors bubble up naturally (wrappers will catch them)

### ❌ DON'T

- Don't use `console.error` directly (use error handlers)
- Don't swallow errors silently
- Don't return generic error messages without logging
- Don't duplicate error handling (use wrappers OR manual, not both)

---

## Example: Complete Migration

### Before (Old Pattern)
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processData(body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

### After (New Pattern)
```typescript
import { withApiErrorHandler } from '@repo/utils/server';

export async function POST(request: NextRequest) {
  return withApiErrorHandler(request, async (req) => {
    const body = await req.json();
    const result = await processData(body);
    return NextResponse.json({ success: true, result });
  }, {
    operation: 'process-data',
    component: 'data-api',
    metadata: { endpoint: '/api/data/process' }
  });
}
```

**Benefits:**
- ✅ Full request context automatically included
- ✅ Logs visible in Grafana
- ✅ Searchable by tenant, user, operation
- ✅ Consistent error format across all endpoints

---

**Next Steps:**
1. Review this guide
2. Start with middleware files (highest impact)
3. Migrate API routes systematically
4. Update server actions
5. Test error logging in Grafana
