# Final JWT Requirements for S3 Access Control

## ✅ **UPDATED**: Tenant ID from Headers, Not JWT

### Request Structure

```
GET /api/media/list HTTP/1.1
Host: app.um1ygn.edu.mm
x-tenant-id: 507f1f77bcf86cd799439011    ← Tenant ID (MongoDB ObjectID)
Cookie: auth_token=eyJhbGc...             ← JWT with user info
```

---

## JWT Token Structure (Simplified)

### ✅ Required Claims

```json
{
  // User identification
  "sub": "user-123",              // User ID (for personal folder access)

  // User roles (array of strings)
  "roles": [
    "organizationMember",
    "departmentMember"
  ],

  // Department access (array of department IDs)
  "departmentIds": [
    "dept-cs",
    "dept-it"
  ],

  // Standard JWT claims
  "iat": 1698000000,
  "exp": 1698003600
}
```

### ❌ NOT Required in JWT

- ~~`tenantId`~~ → Get from `x-tenant-id` header
- ~~`tenantRootDomain`~~ → Extract from `host` header
- ~~`organizationId`~~ → Optional

---

## How It Works

### 1. Request Flow

```typescript
// Client sends request
fetch('/api/media/list', {
  headers: {
    'x-tenant-id': '507f1f77bcf86cd799439011',  // Set by your frontend
    'Cookie': 'auth_token=...'                   // JWT cookie
  }
})

// Server extracts tenant info
const tenantInfo = resolveTenantFromHeaders(request);
// { tenantId: "507f...", tenantRootDomain: "um1ygn.edu.mm" }

// Server decodes JWT
const jwt = await getJWTFromSession(request);
// { sub: "user-123", roles: [...], departmentIds: [...] }

// Combine into user context
const userContext = createUserContextFromJWT(
  jwt,
  tenantInfo.tenantId,
  tenantInfo.tenantRootDomain
);

// Validate access
validateS3Access(userContext, 'read', 'core/public/file.jpg');
```

### 2. Tenant Resolution

```typescript
// From headers
x-tenant-id: "507f1f77bcf86cd799439011"  // MongoDB ObjectID
host: "app.um1ygn.edu.mm"

// Extracted
tenantId: "507f1f77bcf86cd799439011"     // Used for bucket name
tenantRootDomain: "um1ygn.edu.mm"        // Used for storage URL

// S3 Bucket
bucket: "tenant-507f1f77bcf86cd799439011"

// Public URL
https://storage.um1ygn.edu.mm/tenant-507f1f77bcf86cd799439011/...
```

---

## JWT Role Examples

### Organization Admin (Full Access)

```json
{
  "sub": "admin-001",
  "roles": ["organizationAdmin"],
  "departmentIds": []
}
```

**Can access**: Everything in tenant bucket

---

### Organization Member (Regular User)

```json
{
  "sub": "user-123",
  "roles": ["organizationMember"],
  "departmentIds": []
}
```

**Can access**:
- ✅ Read: `core/public/*`, `core/private/common/*`
- ✅ Write: `core/private/personal/user-123/*` (own folder only)

---

### Department Admin

```json
{
  "sub": "dept-admin-cs",
  "roles": ["departmentAdmin", "organizationMember"],
  "departmentIds": ["dept-cs"]
}
```

**Can access**:
- ✅ Read/Write: `core/private/departments/dept-cs/*`
- ✅ Plus all organizationMember permissions

---

### Department Member (Student)

```json
{
  "sub": "student-456",
  "roles": ["departmentMember", "organizationMember"],
  "departmentIds": ["dept-cs", "dept-it"]
}
```

**Can access**:
- ✅ Read: `core/private/departments/dept-cs/*` (read-only)
- ✅ Read: `core/private/departments/dept-it/*` (read-only)
- ✅ Plus all organizationMember permissions

---

## Alternative JWT Claim Names (Supported)

```json
{
  // User ID (any of these)
  "sub": "user-123",           // Preferred
  "userId": "user-123",        // Alternative
  "user_id": "user-123",       // Alternative

  // Roles (any of these)
  "roles": ["..."],            // Preferred (array)
  "role": "organizationMember", // Alternative (single string)

  // Department IDs (any of these)
  "departmentIds": ["..."],    // Preferred
  "department_ids": ["..."]    // Alternative
}
```

---

## Implementation Checklist

### ✅ Backend (Already Implemented)

- [x] `resolveTenantFromHeaders()` - Extract tenant from `x-tenant-id` header
- [x] `createUserContextFromJWT()` - Combine JWT + headers
- [x] `validateS3Access()` - Check permissions
- [x] MongoDB ObjectID validation

### ⏳ TODO: Your Auth System

- [ ] Ensure JWT includes:
  - `sub` (user ID)
  - `roles` (array of role strings)
  - `departmentIds` (array for department members)

- [ ] Ensure frontend sends:
  - `x-tenant-id` header with MongoDB ObjectID
  - `auth_token` cookie with JWT

### ⏳ TODO: Update API Routes

Replace in your API routes:

```typescript
// OLD (from example)
const tenantId = 'demo-tenant';

// NEW (use header resolver)
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';
const tenantInfo = resolveTenantFromHeaders(request);
```

---

## Files Created

1. **`libs/s3/src/middleware/tenant-resolver.ts`**
   - `resolveTenantFromHeaders()` - Extract tenant from headers
   - MongoDB ObjectID validation
   - Root domain extraction

2. **`libs/s3/src/middleware/access-control.ts`** (Updated)
   - `createUserContextFromJWT()` - Now accepts tenant params
   - Updated signature: `createUserContextFromJWT(jwt, tenantId, tenantRootDomain)`

3. **`UPDATED_API_EXAMPLE.ts`**
   - Complete working examples
   - Shows header-based tenant resolution
   - Test cases with curl

---

## Quick Reference

### Get Tenant Info

```typescript
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';

const { tenantId, tenantRootDomain } = resolveTenantFromHeaders(request);
```

### Create User Context

```typescript
import { createUserContextFromJWT } from '@repo/s3/middleware/access-control';

const userContext = createUserContextFromJWT(
  jwt,              // Decoded JWT token
  tenantId,         // From x-tenant-id header
  tenantRootDomain  // From host header
);
```

### Validate Access

```typescript
import { validateS3Access } from '@repo/s3/middleware/access-control';

const check = validateS3Access(userContext, 'write', 'core/public/file.jpg');

if (!check.allowed) {
  return NextResponse.json({ error: check.reason }, { status: 403 });
}
```

---

## Testing

```bash
# Test as organization member
curl -H "x-tenant-id: 507f1f77bcf86cd799439011" \
     -H "Cookie: auth_token=<user-jwt>" \
     https://app.um1ygn.edu.mm/api/media/list?path=core/public

# Test as organization admin
curl -H "x-tenant-id: 507f1f77bcf86cd799439011" \
     -H "Cookie: auth_token=<admin-jwt>" \
     https://app.um1ygn.edu.mm/api/media/list?path=core/private

# Test invalid tenant ID
curl -H "x-tenant-id: invalid" \
     https://app.um1ygn.edu.mm/api/media/list
# Expected: 400 Bad Request (Invalid tenant ID format)
```

---

## Summary

**Simplified approach:**
- ✅ Tenant ID from `x-tenant-id` header (MongoDB ObjectID)
- ✅ Tenant domain from `host` header
- ✅ User info from JWT (sub, roles, departmentIds)
- ✅ All validation logic already implemented

**Your JWT only needs:**
```json
{
  "sub": "user-id",
  "roles": ["role1", "role2"],
  "departmentIds": ["dept1", "dept2"]
}
```

**That's it!** 🎉
