# S3 Access Control Based on JWT Roles

## Overview

Your media system implements **application-level access control** based on JWT role claims. The system uses MinIO root admin credentials for all S3 operations, but enforces granular permissions by validating JWT roles before allowing access.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Client Request with JWT Token                │
│  Cookie: session={sessionId} OR Authorization: Bearer     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│            Next.js API Route / Server Action              │
│  1. Validate JWT signature & expiration                   │
│  2. Extract claims: { userId, roles, username, ... }      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Access Control Check (NEW)                   │
│  checkS3Access({ claims, bucketName, filePath, op })      │
│  • System Admin → Full access to all buckets             │
│  • Org Admin → Full access to org bucket (with limits)   │
│  • Dept Admin → Full access to dept folder               │
│  • User → Access to personal folder only                 │
└────────────────────────┬─────────────────────────────────┘
                         │
                    [ALLOWED] ✓
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              S3 Client (Root Admin Credentials)           │
│  Uses: MINIO_ROOT_USER + MINIO_ROOT_PASSWORD              │
│  Accesses: {bucketName}/{filePath}                        │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                      MinIO Server                         │
│  Bucket Policy: Public read for */public/* only           │
│  All other access: Root admin credentials                 │
└──────────────────────────────────────────────────────────┘
```

---

## JWT Token Structure

### Example JWT Claims

```json
{
  "sub": "68e0b62131f65aa7c3783438",
  "username": "admin",
  "name": "System Administrator",
  "email": "admin@crystal-image.net",
  "roles": [
    {
      "Organization": "*",
      "OrgSlug": "all",
      "Department": "*",
      "DeptSlug": "all",
      "Role": "systemAdmin"
    }
  ],
  "role": "systemAdmin",
  "exp": 1761796066,
  "iat": 1761792466
}
```

### Role Types

```typescript
type RoleType =
  | 'systemAdmin'          // Super admin across all organizations
  | 'organizationAdmin'    // Admin for specific organization
  | 'departmentAdmin'      // Admin for specific department
  | 'user';                // Regular user
```

---

## Access Control Matrix

### 1. System Admin (`role: "systemAdmin"`, `OrgSlug: "all"`)

**Can Access:**
- ✅ **All buckets** (any tenant/organization)
- ✅ **All paths** (public, private, personal)
- ✅ **All operations** (read, write, delete)

**Example Allowed Paths:**
```
um1ygn/core/public/*           → Full access
um1ygn/core/private/common/*   → Full access
um1ygn/core/private/departments/hr/* → Full access
um1ygn/personal/john.doe/*     → Full access
another-org/core/private/*     → Full access (cross-tenant)
```

---

### 2. Organization Admin (`role: "organizationAdmin"`, `OrgSlug: "{orgSlug}"`)

**Can Access:**
- ✅ `{orgSlug}/core/private/common/*` → **Full access** (read, write, delete)
- ✅ `{orgSlug}/core/private/departments/*` → **Read-only**
- ✅ `{orgSlug}/core/public/*` → **Full access**
- ✅ `{orgSlug}/personal/{username}/*` → **Full access** (own files only)
- ❌ Other organizations' buckets → **No access**

**Examples:**

```typescript
// JWT: { OrgSlug: "um1ygn", Role: "organizationAdmin" }

✅ um1ygn/core/private/common/policy.pdf       → Full access
✅ um1ygn/core/private/departments/hr/doc.pdf  → Read-only
❌ um1ygn/core/private/departments/hr/doc.pdf  → Write denied
✅ um1ygn/core/public/report.pdf               → Full access
✅ um1ygn/personal/admin/my-file.pdf           → Full access (if username="admin")
❌ another-org/core/private/*                  → Access denied
```

---

### 3. Department Admin (`role: "departmentAdmin"`, `OrgSlug: "{orgSlug}"`, `DeptSlug: "{deptSlug}"`)

**Can Access:**
- ✅ `{orgSlug}/core/private/departments/{deptSlug}/*` → **Full access**
- ✅ `{orgSlug}/core/private/common/*` → **Read-only**
- ✅ `{orgSlug}/core/public/*` → **Full access**
- ✅ `{orgSlug}/personal/{username}/*` → **Full access** (own files only)
- ❌ Other departments' folders → **No access**
- ❌ Other organizations' buckets → **No access**

**Examples:**

```typescript
// JWT: { OrgSlug: "um1ygn", DeptSlug: "hr", Role: "departmentAdmin" }

✅ um1ygn/core/private/departments/hr/*      → Full access
❌ um1ygn/core/private/departments/finance/* → Access denied
✅ um1ygn/core/private/common/handbook.pdf   → Read-only
❌ um1ygn/core/private/common/handbook.pdf   → Write denied
✅ um1ygn/core/public/announcement.pdf       → Full access
✅ um1ygn/personal/hr-manager/report.pdf     → Full access (if username="hr-manager")
```

---

### 4. Regular User (`role: "user"`)

**Can Access:**
- ✅ `{orgSlug}/core/public/*` → **Read-only**
- ✅ `{orgSlug}/personal/{username}/*` → **Full access** (own folder only)
- ❌ All private folders → **No access**

**Examples:**

```typescript
// JWT: { OrgSlug: "um1ygn", username: "john.doe", Role: "user" }

✅ um1ygn/core/public/document.pdf      → Read-only
❌ um1ygn/core/public/document.pdf      → Write denied
✅ um1ygn/personal/john.doe/my-file.pdf → Full access
❌ um1ygn/personal/jane.smith/*         → Access denied
❌ um1ygn/core/private/common/*         → Access denied
```

---

## Implementation

### Access Control Function

Located at: `/libs/s3/src/utils/access-control.ts`

```typescript
import { checkS3Access } from '@repo/s3/utils';

// In your API route or server action
const accessCheck = checkS3Access({
  claims: jwtClaims,              // From validated JWT
  bucketName: 'um1ygn',           // Tenant slug
  filePath: 'core/private/common/file.pdf',
  operation: 'read'               // 'read' | 'write' | 'delete'
});

if (!accessCheck.allowed) {
  throw new Error(accessCheck.reason);
}

// Proceed with S3 operation
await s3Client.getObject(filePath);
```

### Usage in PDF Proxy

```typescript
// apps/core/src/app/api/media/pdf-proxy/route.ts

import { checkS3Access } from '@repo/s3/utils';

export async function GET(request: NextRequest) {
  // 1. Validate JWT session
  const sessionInfo = await validateRequest(sessionId, { ... });

  // 2. Extract JWT claims
  const claims = {
    sub: sessionInfo.session.userId,
    username: sessionInfo.user.username,
    roles: sessionInfo.user.roles,  // Assumes user object has roles
    role: sessionInfo.user.roles[0]?.Role,
    email: sessionInfo.user.email,
  };

  // 3. Check access
  const filePath = searchParams.get('file'); // e.g., "core/private/common/doc.pdf"
  const accessCheck = checkS3Access({
    claims,
    bucketName: tenantSlug,
    filePath,
    operation: 'read'
  });

  if (!accessCheck.allowed) {
    return NextResponse.json(
      { error: 'Access denied', reason: accessCheck.reason },
      { status: 403 }
    );
  }

  // 4. Fetch PDF from S3 (using root admin credentials)
  const s3Client = createTenantS3Client({ ... });
  const pdfBuffer = await s3Client.getObject(filePath);

  // 5. Return PDF
  return new NextResponse(pdfBuffer, { ... });
}
```

### Usage in Media Actions

```typescript
// apps/core/src/actions/media.ts

import { checkS3Access } from '@repo/s3/utils';

export async function listMediaAction(params: { ... }) {
  // 1. Get session and validate
  const session = await getServerSession();
  const claims = extractJWTClaims(session);

  // 2. Check access to the folder
  const accessCheck = checkS3Access({
    claims,
    bucketName: tenantSlug,
    filePath: params.path,  // e.g., "core/private/departments/hr"
    operation: 'read'
  });

  if (!accessCheck.allowed) {
    throw new Error(`Access denied: ${accessCheck.reason}`);
  }

  // 3. List files (using root admin credentials)
  const s3Client = createTenantS3Client({ ... });
  const files = await s3Client.listObjects(params.path);

  return files;
}
```

---

## MinIO Bucket Policy (Static)

Your current bucket policy only handles **public read access**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": ["*"] },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::{bucketName}/*/public/*"]
    }
  ]
}
```

**What this does:**
- ✅ Allows anonymous public read access to `*/public/*` paths
- ❌ Does NOT enforce role-based access (handled by application)
- ❌ Does NOT restrict write access (handled by application)

---

## Why Not Use MinIO IAM Users?

You asked if this can be done with S3 bucket policies. The answer is **partially, but with significant complexity**:

### Option A: Application-Level (Current - Recommended ✅)

**Pros:**
- ✅ Simple architecture
- ✅ Flexible - can change rules without updating S3
- ✅ Dynamic access based on JWT claims
- ✅ No user lifecycle management
- ✅ Works with your existing JWT system

**Cons:**
- ⚠️ Application must be trusted as security boundary
- ⚠️ No S3-level enforcement (relies on Next.js)

### Option B: MinIO IAM Users (Complex ❌)

**How it would work:**
```
1. Create MinIO IAM user for each application user
2. Generate MinIO access key + secret for each user
3. Store credentials in your database
4. Create per-user bucket policies:
   - systemAdmin → Policy: Allow all actions on all buckets
   - orgAdmin → Policy: Allow read/write on {orgSlug}/private/common/*
   - deptAdmin → Policy: Allow read/write on {orgSlug}/private/departments/{deptSlug}/*
5. Use user-specific credentials for S3 operations
```

**Pros:**
- ✅ S3-level security enforcement
- ✅ No need to trust application layer

**Cons:**
- ❌ Complex user lifecycle (create/update/delete)
- ❌ Credential management (storage, rotation)
- ❌ Policy management for thousands of users
- ❌ Can't use dynamic JWT claims in MinIO policies
- ❌ Performance overhead
- ❌ MinIO policy language limitations

**Example MinIO Policy for Department Admin:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::um1ygn/core/private/departments/hr/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::um1ygn/core/private/common/*"]
    }
  ]
}
```

**Problem:** You'd need to create and manage this policy for EVERY user, and update it when roles change.

---

## Recommendation

**Stick with Application-Level Access Control (Option A)**

Reasons:
1. Your JWT system already has all the role information
2. You can make dynamic decisions based on runtime context
3. No MinIO user management overhead
4. Easier to audit and debug
5. Flexible for future requirements

**To enhance security:**
1. ✅ Implement `checkS3Access()` in all S3 operations
2. ✅ Log all access attempts for audit trail
3. ✅ Use HTTPS for all API communications
4. ✅ Rotate JWT secrets regularly
5. ✅ Implement rate limiting on API endpoints
6. ✅ Monitor for suspicious access patterns

---

## Migration Checklist

To implement this access control system:

- [ ] Import `checkS3Access` in all media API routes
- [ ] Add access checks before S3 operations
- [ ] Update PDF proxy to check access
- [ ] Update media upload action
- [ ] Update media list action
- [ ] Update media delete action
- [ ] Update media move action
- [ ] Add audit logging for denied access
- [ ] Test each role's access permissions
- [ ] Document role assignment process

---

## Testing

### Test Cases

```typescript
// Test 1: System Admin - Full access
expect(checkS3Access({
  claims: { roles: [{ Role: 'systemAdmin', OrgSlug: 'all' }] },
  bucketName: 'um1ygn',
  filePath: 'core/private/common/file.pdf',
  operation: 'write'
})).toEqual({ allowed: true });

// Test 2: Org Admin - Private common (write allowed)
expect(checkS3Access({
  claims: { roles: [{ Role: 'organizationAdmin', OrgSlug: 'um1ygn' }] },
  bucketName: 'um1ygn',
  filePath: 'core/private/common/file.pdf',
  operation: 'write'
})).toEqual({ allowed: true });

// Test 3: Org Admin - Department folder (read only)
expect(checkS3Access({
  claims: { roles: [{ Role: 'organizationAdmin', OrgSlug: 'um1ygn' }] },
  bucketName: 'um1ygn',
  filePath: 'core/private/departments/hr/file.pdf',
  operation: 'write'
})).toEqual({
  allowed: false,
  reason: 'Organization admin has read-only access to department folders'
});

// Test 4: Dept Admin - Own department (full access)
expect(checkS3Access({
  claims: {
    roles: [{ Role: 'departmentAdmin', OrgSlug: 'um1ygn', DeptSlug: 'hr' }]
  },
  bucketName: 'um1ygn',
  filePath: 'core/private/departments/hr/file.pdf',
  operation: 'write'
})).toEqual({ allowed: true });

// Test 5: Dept Admin - Other department (denied)
expect(checkS3Access({
  claims: {
    roles: [{ Role: 'departmentAdmin', OrgSlug: 'um1ygn', DeptSlug: 'hr' }]
  },
  bucketName: 'um1ygn',
  filePath: 'core/private/departments/finance/file.pdf',
  operation: 'read'
})).toEqual({
  allowed: false,
  reason: "Department admin can only access their department 'hr'"
});

// Test 6: User - Personal folder (allowed)
expect(checkS3Access({
  claims: { username: 'john.doe', roles: [{ Role: 'user' }] },
  bucketName: 'um1ygn',
  filePath: 'personal/john.doe/file.pdf',
  operation: 'write'
})).toEqual({ allowed: true });

// Test 7: User - Other user's personal folder (denied)
expect(checkS3Access({
  claims: { username: 'john.doe', roles: [{ Role: 'user' }] },
  bucketName: 'um1ygn',
  filePath: 'personal/jane.smith/file.pdf',
  operation: 'read'
})).toEqual({
  allowed: false,
  reason: "Personal folder 'jane.smith' belongs to different user"
});
```

---

## Summary

✅ **Application-level access control** enforces role-based permissions
✅ **MinIO root credentials** used for all S3 operations
✅ **JWT claims** provide user identity and role information
✅ **Static bucket policy** only for public read access
✅ **Flexible & maintainable** - no MinIO user management needed

This approach provides strong security while remaining simple and maintainable for your multi-tenant application.
