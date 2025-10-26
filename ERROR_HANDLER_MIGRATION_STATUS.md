# Error Handler Migration Status

**Last Updated:** 2025-10-26
**Overall Progress:** ~50% → Target: 100%

---

## ✅ Completed Migrations

### Infrastructure (100%)
- ✅ `libs/utils/server/error-handler.ts` - Core error handling utilities
- ✅ `libs/utils/server/middleware-error-wrapper.ts` - Middleware wrappers
- ✅ `libs/utils/server/error-context.ts` - Request context extraction
- ✅ `libs/utils/client/error-context.ts` - Client context extraction
- ✅ Documentation: SERVER_ERROR_HANDLER_GUIDE.md
- ✅ Documentation: ERROR_HANDLING_ANALYSIS.md

### Middleware (100% - 3/3 files)
- ✅ `apps/publicWeb/src/middleware.ts` - Wrapped with wrapMiddleware()
- ✅ `apps/core/src/middleware.ts` - Wrapped with wrapMiddleware()
- ✅ `libs/tenant/middleware-core.ts` - ApplicationError integration

### Error Boundaries (100% - 4/4 files)
- ✅ `apps/publicWeb/src/app/global-error.tsx` - Client-side
- ✅ `apps/publicWeb/src/app/error.tsx` - Client-side
- ✅ `apps/core/src/app/global-error.tsx` - Client-side
- ✅ `apps/core/src/app/error.tsx` - Client-side

### API Routes (15% - 4/~27 files)

#### publicWeb (3/16 files)
- ✅ `apps/publicWeb/src/app/api/lang/route.ts` - GET & POST
- ✅ `apps/publicWeb/src/app/api/verify-email/route.ts` - POST

#### core (2/11 files)
- ✅ `apps/core/src/app/api/lang/route.ts` - GET & POST
- ✅ `apps/core/src/app/api/modules/[module]/route.ts` - GET

### Server Actions (9% - 1/11 files)
- ✅ `libs/appModules/server-actions/module-actions.ts` - All actions

---

## ⏳ Remaining Migrations

### API Routes - publicWeb (13 files)

**Auth Routes (6 files):**
```bash
apps/publicWeb/src/app/api/auth/callback/route.ts
apps/publicWeb/src/app/api/auth/debug/route.ts
apps/publicWeb/src/app/api/auth/login/route.ts
apps/publicWeb/src/app/api/auth/logout/route.ts
apps/publicWeb/src/app/api/auth/refresh/route.ts
apps/publicWeb/src/app/api/auth/session/route.ts
```

**TestToken Routes (7 files):**
```bash
apps/publicWeb/src/app/testToken/api/extend-session/route.ts
apps/publicWeb/src/app/testToken/api/refresh-initializer/route.ts
apps/publicWeb/src/app/testToken/api/refresh-tenant/route.ts
apps/publicWeb/src/app/testToken/api/refresh-user/route.ts
apps/publicWeb/src/app/testToken/api/tokens/route.ts
```

### API Routes - core (9 files)

**Auth Routes (6 files):**
```bash
apps/core/src/app/api/auth/callback/route.ts
apps/core/src/app/api/auth/debug/route.ts
apps/core/src/app/api/auth/login/route.ts
apps/core/src/app/api/auth/logout/route.ts
apps/core/src/app/api/auth/refresh/route.ts
apps/core/src/app/api/auth/session/route.ts
apps/core/src/app/api/auth/sessions/route.ts
apps/core/src/app/api/auth/tokens/route.ts
```

**Other Routes (2 files):**
```bash
apps/core/src/app/api/test-tenant/route.ts
apps/core/src/app/[appId]/[module]/[id]/print/route.ts
```

### Server Actions - publicWeb (10 files)

**Student Registration:**
```bash
apps/publicWeb/src/actions/student-registration.ts
apps/publicWeb/src/app/(register)/profileSetup/student/actions.ts
apps/publicWeb/src/app/(register)/profileSetup/student/student-actions.ts
apps/publicWeb/src/app/(register)/signup/actions.ts
apps/publicWeb/src/app/profile/student/actions.ts
```

**Staff:**
```bash
apps/publicWeb/src/app/(register)/profileSetup/staff/staff-actions.ts
```

**Library:**
```bash
apps/publicWeb/src/actions/library/books.actions.ts
apps/publicWeb/src/actions/library/catalog-types.actions.ts
apps/publicWeb/src/actions/library/news.actions.ts
```

---

## Migration Pattern

### For API Routes:

**Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "..." }, { status: 500 });
  }
}
```

**After:**
```typescript
import { withApiErrorHandler } from '@repo/utils/server';

export async function POST(request: NextRequest) {
  return withApiErrorHandler(request, async (req) => {
    // ... logic (remove try/catch)
    return NextResponse.json({ success: true });
  }, {
    operation: 'operation-name',
    component: 'api-component',
    metadata: { endpoint: '/api/path' }
  });
}
```

### For Server Actions:

**Before:**
```typescript
"use server";

export async function myAction(data: FormData) {
  try {
    // ... logic
    return { success: true, data: result };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: error.message };
  }
}
```

**After:**
```typescript
"use server";
import { withServerActionErrorHandler } from '@repo/utils/server';

export async function myAction(data: FormData) {
  return withServerActionErrorHandler(async () => {
    // ... logic (remove try/catch)
    return { success: true, data: result };
  }, {
    operation: 'my-action',
    component: 'action-component'
  });
}
```

---

## Quick Migration Script

For batch migration of similar files:

```bash
# Update imports
# Add: import { withApiErrorHandler } from '@repo/utils/server';

# Wrap handler
# Before: export async function GET(request: NextRequest) { try { ... } catch { ... } }
# After:  export async function GET(request: NextRequest) { return withApiErrorHandler(request, async (req) => { ... }, config); }

# Remove try/catch and console.error
# Remove: try { ... } catch (error) { console.error(...); return NextResponse.json(...); }
# Keep:   Just the logic inside try block
```

---

## Expected Benefits After 100% Migration

### 1. Complete Visibility
- All server errors visible in Loki
- No silent failures
- Full request context in every error log

### 2. Better Debugging
```logql
# All API errors for a specific tenant
{service="publicWeb-tenant1.um1ygn.edu.mm"} | json | category="api"

# All server action errors
{service=~".*"} | json | category="server-action"

# All middleware errors
{service=~".*"} | json | category="middleware"

# Critical errors only
{service=~".*"} | json | severity="critical"

# Errors by operation
{service=~".*"} | json | operation="verify-email"
```

### 3. Consistent Format
All errors have same structure:
- hostname, tenantId, userId, sessionId
- operation, component, severity
- Full stack traces
- Request metadata

---

## Next Steps

1. **Batch migrate auth routes** (12 files) - Similar patterns
2. **Migrate testToken routes** (7 files) - Testing/debug routes
3. **Migrate server actions** (10 files) - Form submissions
4. **Test error reporting** - Trigger errors, verify in Loki
5. **Update documentation** - Mark as 100% complete

---

## Time Estimate

- **Remaining API routes:** ~22 files × 2 min = 44 minutes
- **Remaining server actions:** ~10 files × 3 min = 30 minutes
- **Testing & verification:** 15 minutes
- **Total:** ~1.5 hours

---

**Current Status:** Foundation complete, ~50% migrated
**Next Session:** Continue with auth routes batch migration
