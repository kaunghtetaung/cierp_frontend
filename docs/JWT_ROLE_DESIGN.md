# JWT Role Design for S3 Access Control

## Overview

This document describes the complete JWT token structure and role-based access control (RBAC) system for MinIO S3 storage.

---

## JWT Token Structure

### Required Claims

```json
{
  // Standard JWT claims
  "sub": "user-12345",                    // User ID (for personal folders)
  "email": "user@example.com",
  "iat": 1698000000,                      // Issued at
  "exp": 1698003600,                      // Expires at

  // Tenant identification
  "tenantId": "um1ygn",                   // Tenant ID for bucket selection
  "tenantRootDomain": "um1ygn.edu.mm",    // For building storage URLs

  // User roles
  "roles": [                              // Array of role strings
    "organizationMember",
    "departmentMember"
  ],

  // Department access
  "departmentIds": [                      // Departments user belongs to
    "dept-cs",
    "dept-it"
  ],

  // Optional
  "organizationId": "org-um1ygn"          // If different from tenantId
}
```

### Alternative Formats Supported

```json
// Single role (string instead of array)
{
  "role": "organizationAdmin"
}

// Alternative claim names
{
  "userId": "user-123",        // Instead of "sub"
  "tenant_id": "um1ygn",       // Instead of "tenantId"
  "tenant_root_domain": "...", // Instead of "tenantRootDomain"
  "department_ids": ["..."]    // Instead of "departmentIds"
}
```

---

## Role Definitions

### 1. **Organization Admin** (`organizationAdmin`)

**Description**: Top-level administrator with full access to the entire tenant bucket.

**Access Rights**:
- ✅ **Read**: All folders (public + private)
- ✅ **Write**: All folders (public + private)
- ✅ **Delete**: All files
- ✅ **Manage**: Create folders, set permissions

**Use Cases**:
- System administrators
- Organization owners
- IT managers

**Example JWT**:
```json
{
  "sub": "admin-001",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["organizationAdmin"],
  "departmentIds": []
}
```

---

### 2. **Organization Member** (`organizationMember`)

**Description**: Regular member of the organization with limited access.

**Access Rights**:
- ✅ **Read**: Public folders, common private folders, own personal folder
- ✅ **Write**: Own personal folder only
- ✅ **Delete**: Own files in personal folder
- ❌ **No Access**: Other users' personal folders, department folders (unless also departmentMember)

**Use Cases**:
- Regular staff members
- General users
- Non-department-affiliated users

**Example JWT**:
```json
{
  "sub": "user-123",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["organizationMember"],
  "departmentIds": []
}
```

---

### 3. **Department Admin** (`departmentAdmin`)

**Description**: Administrator of one or more departments with full access to department folders.

**Access Rights**:
- ✅ **Read**: Department folders (for assigned departments)
- ✅ **Write**: Department folders (for assigned departments)
- ✅ **Delete**: Files in department folders
- ✅ **Inherit**: All organizationMember permissions

**Use Cases**:
- Department heads
- Team leaders
- Faculty deans

**Example JWT**:
```json
{
  "sub": "dept-admin-cs",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["departmentAdmin", "organizationMember"],
  "departmentIds": ["dept-cs"]
}
```

---

### 4. **Department Member** (`departmentMember`)

**Description**: Member of one or more departments with read access to department folders.

**Access Rights**:
- ✅ **Read**: Department folders (for assigned departments)
- ❌ **Write**: Cannot write to department folders (read-only)
- ✅ **Inherit**: All organizationMember permissions

**Use Cases**:
- Department staff
- Students in a program
- Team members

**Example JWT**:
```json
{
  "sub": "student-456",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["departmentMember", "organizationMember"],
  "departmentIds": ["dept-cs", "dept-it"]
}
```

---

## Access Control Matrix

### Full Permission Table

| Path Pattern | Org Admin | Org Member | Dept Admin | Dept Member | Public |
|--------------|-----------|------------|------------|-------------|--------|
| **`core/public/*`** |
| Read | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`publicWeb/public/*`** |
| Read | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`core/private/common/*`** |
| Read | ✅ | ✅ | ✅ | ✅ | ❌ |
| Write | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`core/private/personal/{userId}/*`** |
| Read | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| Write | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| Delete | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| **`core/private/departments/{deptId}/*`** |
| Read | ✅ | ❌ | ✅ (if member) | ✅ (if member) | ❌ |
| Write | ✅ | ❌ | ✅ (if member) | ❌ | ❌ |
| Delete | ✅ | ❌ | ✅ (if member) | ❌ | ❌ |
| **`core/private/library/*`** |
| Read | ✅ | ✅ (watermarked) | ✅ (watermarked) | ✅ (watermarked) | ❌ |
| Write | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- ✅ (own) = Only for user's own files (userId matches JWT sub)
- ✅ (if member) = Only if user's departmentIds contains the folder's deptId
- ✅ (watermarked) = Read access with userId watermark on PDFs

---

## Role Hierarchy

```
organizationAdmin (Level 4 - Full Access)
    ↓ inherits all permissions
departmentAdmin (Level 3)
    ↓ inherits
organizationMember (Level 2)
    ↓ inherits
departmentMember (Level 1 - Base Access)
```

---

## Example Scenarios

### Scenario 1: Regular User Uploads Personal File

```json
// JWT
{
  "sub": "user-123",
  "roles": ["organizationMember"]
}

// Action
POST /api/media/upload
path: "core/private/personal/user-123/photo.jpg"

// Result: ✅ Allowed
// Reason: Owner can write to own personal folder
```

### Scenario 2: User Tries to Access Another User's File

```json
// JWT
{
  "sub": "user-123",
  "roles": ["organizationMember"]
}

// Action
GET /api/media/list
path: "core/private/personal/user-456"

// Result: ❌ Denied
// Reason: Cannot access other users' personal folders
```

### Scenario 3: Department Admin Uploads to Department Folder

```json
// JWT
{
  "sub": "admin-cs",
  "roles": ["departmentAdmin"],
  "departmentIds": ["dept-cs"]
}

// Action
POST /api/media/upload
path: "core/private/departments/dept-cs/syllabus.pdf"

// Result: ✅ Allowed
// Reason: Department admin has write access to their department
```

### Scenario 4: Department Member Tries to Delete Department File

```json
// JWT
{
  "sub": "student-456",
  "roles": ["departmentMember"],
  "departmentIds": ["dept-cs"]
}

// Action
DELETE /api/media/delete
keys: ["core/private/departments/dept-cs/syllabus.pdf"]

// Result: ❌ Denied
// Reason: Department members have read-only access
```

### Scenario 5: Organization Admin Accesses Everything

```json
// JWT
{
  "sub": "admin-001",
  "roles": ["organizationAdmin"]
}

// Action: ANY operation on ANY path

// Result: ✅ Allowed
// Reason: Organization admin has full access
```

---

## Implementation Files

### Created Files

1. **`libs/s3/src/types/roles.ts`**
   - Role enum definitions
   - UserS3Context interface
   - Access control matrix
   - Helper functions (hasRole, isOrganizationAdmin, etc.)

2. **`libs/s3/src/middleware/access-control.ts`**
   - validateS3Access() - Main validation function
   - createUserContextFromJWT() - JWT parser
   - Path pattern matching
   - Permission checking logic

3. **`EXAMPLE_API_WITH_ACCESS_CONTROL.ts`**
   - Complete API route examples
   - List/Upload/Delete with access control
   - Example JWT structures

---

## Integration Steps

### Step 1: Update Your JWT Issuer

Ensure your auth system includes these claims:

```typescript
// When issuing JWT
{
  sub: user.id,
  tenantId: user.tenantId,
  tenantRootDomain: tenant.rootDomain,
  roles: user.roles, // Array: ['organizationMember', 'departmentAdmin']
  departmentIds: user.departments.map(d => d.id)
}
```

### Step 2: Update API Routes

Replace the mock JWT function:

```typescript
// apps/core/src/app/api/media/*/route.ts

import { getSession } from '@repo/security'; // Your session library

async function getJWTFromSession(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    sub: session.userId,
    tenantId: session.tenantId,
    tenantRootDomain: session.tenantRootDomain,
    roles: session.roles,
    departmentIds: session.departmentIds,
  };
}
```

### Step 3: Test Access Control

```bash
# Test as organization admin
curl -H "Cookie: auth_token=<admin-jwt>" \
  https://app.um1ygn.edu.mm/api/media/list?path=core/private/common

# Test as regular user
curl -H "Cookie: auth_token=<user-jwt>" \
  https://app.um1ygn.edu.mm/api/media/list?path=core/private/personal/user-123
```

---

## Security Considerations

1. **JWT Validation**
   - Always verify JWT signature
   - Check expiration time
   - Validate issuer

2. **Path Traversal Prevention**
   - Path validation in `validatePath()` function
   - No `..` allowed in paths
   - No absolute paths

3. **Audit Logging**
   - Log all access attempts
   - Track denied operations
   - Monitor for suspicious patterns

4. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent brute force attacks
   - Limit file upload sizes

---

## Next Steps

1. ✅ Role definitions created
2. ✅ Access control middleware implemented
3. ✅ Example API routes provided
4. ⏳ **TODO**: Update your JWT issuer with required claims
5. ⏳ **TODO**: Replace mock getJWTFromSession() in API routes
6. ⏳ **TODO**: Test with real users and different roles
7. ⏳ **TODO**: Add audit logging
8. ⏳ **TODO**: Implement PDF watermarking for library access

---

**Ready to implement!** 🚀

See `EXAMPLE_API_WITH_ACCESS_CONTROL.ts` for complete working examples.
