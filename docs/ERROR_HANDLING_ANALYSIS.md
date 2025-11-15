# Complete Error Handling Analysis

**Date:** 2025-10-26
**Purpose:** Analyze all error handling across publicWeb and core apps to identify gaps

---

## Current Error Handling Status

### ✅ CLIENT-SIDE (Browser) - COVERED

| Layer | Handler | Coverage | Output |
|-------|---------|----------|--------|
| **React Error Boundaries** | `global-error.tsx` | ✅ App initialization errors | ApplicationError → stdout → Loki |
| **React Error Boundaries** | `error.tsx` | ✅ Page/component render errors | ApplicationError → stdout → Loki |
| **Window Errors** | `error-handler.ts` | ✅ Uncaught JS errors | console.error (legacy) |
| **Promise Rejections** | `error-handler.ts` | ✅ Unhandled rejections | console.error (legacy) |

**Status:** ✅ **FULLY COVERED** - Error boundaries use ApplicationError with full context

---

### ⚠️ SERVER-SIDE - PARTIALLY COVERED

#### ✅ **Covered Areas**

| Layer | File | Error Handling | Output |
|-------|------|----------------|--------|
| **API Routes (core)** | `apps/core/src/app/api/modules/[module]/route.ts` | ✅ ApplicationError with full context | stdout → Loki |
| **Server Actions (libs)** | `libs/appModules/server-actions/module-actions.ts` | ✅ ApplicationError with full context | stdout → Loki |

#### ❌ **NOT Covered (Missing ApplicationError)**

##### 1. Middleware - Both Apps

**publicWeb:**
- File: `apps/publicWeb/src/middleware.ts`
- Error Handling: ❌ **None** - Only try/catch in helper functions
- Issues:
  - No error logging for middleware failures
  - Silent failures in `getAppInfo()` (line 97-99)
  - No structured error reporting

**core:**
- File: `apps/core/src/middleware.ts`
- Error Handling: ❌ **None** - Only try/catch in `handleAuthRedirect()`
- Issues:
  - No error logging for middleware failures
  - Auth redirect errors only console.error (line 166-168)
  - No structured error reporting

**Tenant Middleware (libs):**
- File: `libs/tenant/middleware-core.ts`
- Error Handling: ⚠️ **Basic** - console.error only (line 165-170)
- Issues:
  - Uses console.error instead of ApplicationError
  - Returns generic error response
  - No tenant/user context in logs

##### 2. API Routes - publicWeb

**Files:**
- `apps/publicWeb/src/app/api/lang/route.ts`
- `apps/publicWeb/src/app/api/verify-email/route.ts`
- `apps/publicWeb/src/app/api/auth/*/route.ts` (multiple files)

**Error Handling:** ❌ **console.error only**

Example from `lang/route.ts`:
```typescript
catch (error) {
  console.error("Language change API error:", error);  // ❌ Not ApplicationError
  return NextResponse.json({ success: false, error: ... }, { status: 500 });
}
```

##### 3. API Routes - core

**Files:**
- `apps/core/src/app/api/auth/*/route.ts` (multiple auth routes)
- `apps/core/src/app/api/lang/route.ts`
- `apps/core/src/app/api/test-tenant/route.ts`
- `apps/core/src/app/[appId]/[module]/[id]/print/route.ts`

**Error Handling:** ❌ **Likely console.error only** (need to verify)

##### 4. Server Actions - publicWeb

**Files:**
- `apps/publicWeb/src/actions/student-registration.ts`
- `apps/publicWeb/src/actions/library/*.actions.ts`
- `apps/publicWeb/src/app/(register)/*/actions.ts`
- `apps/publicWeb/src/app/profile/student/actions.ts`

**Error Handling:** ❌ **console.error only**

Example from `student-registration.ts`:
```typescript
catch (error) {
  console.error("Error fetching students module schema:", error);  // ❌ Not ApplicationError
  return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
}
```

##### 5. Server Actions - core

**File:** `apps/core/src/lib/server-actions.ts`

**Status:** ❌ **Need to analyze**

---

## Error Handling Gaps Summary

### Critical Gaps (High Priority)

| Component | Files Affected | Issue | Impact |
|-----------|----------------|-------|--------|
| **Middleware** | Both apps + libs | No ApplicationError, no stdout logs | Middleware errors invisible in Loki |
| **API Routes** | ~15+ files | console.error only, no context | API errors not searchable in Grafana |
| **Server Actions** | ~10+ files | console.error only, no context | Action errors lack tenant/user info |

### Coverage Statistics

```
✅ Client-Side Error Boundaries:     100% (global-error, error.tsx)
✅ Core API Routes:                   20% (1/5 - only modules route)
✅ PublicWeb API Routes:               0% (0/15+)
✅ Core Server Actions:              100% (module-actions.ts)
✅ PublicWeb Server Actions:           0% (0/10+)
✅ Middleware:                         0% (0/3)

Overall Server-Side Coverage:        ~25%
```

---

## Required Fixes

### 1. Create Common Server Error Handler

**Purpose:** Unified error handler for all server-side code

**Features:**
- Uses ApplicationError with full context
- Extracts request context (hostname, tenant, user, session)
- Outputs to stdout → Loki
- Works in middleware, API routes, server actions

**Location:** `libs/utils/server/error-handler.ts`

### 2. Middleware Error Handling

**Files to Update:**
- `apps/publicWeb/src/middleware.ts`
- `apps/core/src/middleware.ts`
- `libs/tenant/middleware-core.ts`
- `libs/tenant/middleware/tenant-resolver.ts`

**Required Changes:**
- Wrap middleware logic in try/catch
- Report errors using ApplicationError
- Include request context (hostname, path, headers)
- Log to stdout for Loki

### 3. API Routes Error Handling

**publicWeb Files (~15 files):**
- `apps/publicWeb/src/app/api/lang/route.ts`
- `apps/publicWeb/src/app/api/verify-email/route.ts`
- `apps/publicWeb/src/app/api/auth/callback/route.ts`
- `apps/publicWeb/src/app/api/auth/debug/route.ts`
- `apps/publicWeb/src/app/api/auth/login/route.ts`
- `apps/publicWeb/src/app/api/auth/logout/route.ts`
- `apps/publicWeb/src/app/api/auth/refresh/route.ts`
- `apps/publicWeb/src/app/api/auth/session/route.ts`
- And more...

**core Files (~8 files):**
- `apps/core/src/app/api/auth/*/route.ts` (5 files)
- `apps/core/src/app/api/lang/route.ts`
- `apps/core/src/app/api/test-tenant/route.ts`
- `apps/core/src/app/[appId]/[module]/[id]/print/route.ts`

**Required Changes:**
- Replace console.error with ApplicationError
- Use getApiRouteRequestContext()
- Include full error context

### 4. Server Actions Error Handling

**publicWeb Files (~10 files):**
- `apps/publicWeb/src/actions/student-registration.ts`
- `apps/publicWeb/src/actions/library/books.actions.ts`
- `apps/publicWeb/src/actions/library/catalog-types.actions.ts`
- `apps/publicWeb/src/actions/library/news.actions.ts`
- `apps/publicWeb/src/app/(register)/profileSetup/staff/staff-actions.ts`
- `apps/publicWeb/src/app/(register)/profileSetup/student/actions.ts`
- `apps/publicWeb/src/app/(register)/profileSetup/student/student-actions.ts`
- `apps/publicWeb/src/app/(register)/signup/actions.ts`
- `apps/publicWeb/src/app/profile/student/actions.ts`

**core Files:**
- `apps/core/src/lib/server-actions.ts` (need to analyze)

**Required Changes:**
- Replace console.error with ApplicationError
- Use getRequestContext()
- Include operation context

---

## Recommended Implementation Plan

### Phase 1: Infrastructure (Priority 1)
1. ✅ Create `libs/utils/server/error-context.ts` - DONE
2. ✅ Create `libs/utils/client/error-context.ts` - DONE
3. ⏳ Create `libs/utils/server/error-handler.ts` - Common server error handler
4. ⏳ Create middleware error wrapper utility

### Phase 2: Core Infrastructure (Priority 2)
1. ⏳ Update `libs/tenant/middleware-core.ts` - Use ApplicationError
2. ⏳ Update `libs/tenant/middleware/tenant-resolver.ts` - Use ApplicationError

### Phase 3: App Middleware (Priority 3)
1. ⏳ Update `apps/publicWeb/src/middleware.ts`
2. ⏳ Update `apps/core/src/middleware.ts`

### Phase 4: API Routes (Priority 4)
1. ⏳ Update core API routes (8 files)
2. ⏳ Update publicWeb API routes (15 files)

### Phase 5: Server Actions (Priority 5)
1. ⏳ Update publicWeb server actions (10 files)
2. ⏳ Update core server actions (analyze first)

---

## Benefits After Implementation

### 1. Unified Logging
- All errors in same format (JSON)
- All errors have same context fields
- Easy to query in Grafana

### 2. Complete Visibility
- No silent failures
- All layers logged to Loki
- Middleware errors visible

### 3. Better Debugging
- Full request context in every error
- Tenant/user/session always included
- Stack traces preserved

### 4. Grafana Queries
```logql
# All middleware errors
{service=~"publicWeb-.*|.*"} | json | level="error" | component="middleware"

# All API errors for specific tenant
{service="publicWeb-tenant1.um1ygn.edu.mm"} | json | category="api"

# All server action errors
{service=~".*"} | json | category="server-action"
```

---

## Next Steps

1. **Review this analysis** - Confirm the gaps identified
2. **Create common server error handler** - Foundation for all fixes
3. **Prioritize implementation** - Start with middleware (highest impact)
4. **Update files systematically** - Phase by phase
5. **Test error reporting** - Verify logs appear in Loki
6. **Update documentation** - Reflect new error handling patterns

---

**Files Requiring Updates:** ~40-50 files
**Estimated Effort:** 4-6 hours (if done systematically)
**Impact:** Critical - Makes all server errors visible in Grafana
