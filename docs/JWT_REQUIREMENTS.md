# JWT Token Requirements for S3 Access Policies

To complete the MinIO access policy configuration, please provide the JWT token structure from your authentication system.

## What We Need

### 1. **Sample JWT Token (Decoded)**

Please provide a decoded JWT token showing all claims. You can decode it at [jwt.io](https://jwt.io).

Example format we're looking for:

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "tenantId": "tenant-abc",           // 👈 What's the claim name?
  "roles": ["organizationMember"],    // 👈 Single role or array?
  "departmentIds": ["dept-1", "dept-2"], // 👈 What's the claim name?
  "organizationId": "org-xyz",        // 👈 Do you have this?
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 2. **Specific Questions**

Please answer these questions about your JWT structure:

#### Q1: Tenant Identification
- **What claim contains the tenant ID?**
  - [ ] `tenantId`
  - [ ] `tenant_id`
  - [ ] `tenant`
  - [ ] Other: _______________

#### Q2: User Roles
- **What claim contains user roles?**
  - [ ] `roles` (array)
  - [ ] `role` (single string)
  - [ ] `authorities` (array)
  - [ ] Other: _______________

- **What are the possible role values?** (check all that apply)
  - [ ] `organizationAdmin`
  - [ ] `organizationMember`
  - [ ] `departmentAdmin`
  - [ ] `departmentMember`
  - [ ] Other: _______________

#### Q3: Department Access
- **What claim contains department IDs the user belongs to?**
  - [ ] `departmentIds` (array)
  - [ ] `department_ids` (array)
  - [ ] `departments` (array)
  - [ ] Single department only in `departmentId`
  - [ ] Not applicable (no department-level access)
  - [ ] Other: _______________

#### Q4: User Identification
- **What claim should be used as the user ID for personal folders?**
  - [ ] `sub` (JWT standard)
  - [ ] `userId`
  - [ ] `user_id`
  - [ ] Other: _______________

#### Q5: Organization
- **Do you have a separate organization ID from tenant ID?**
  - [ ] Yes, claim name: _______________
  - [ ] No, organization = tenant

## Current Access Requirements (From Your Specs)

Based on your initial requirements, here's what we need to implement:

### Folder Access Matrix

| Path | Write Access | Read Access |
|------|-------------|-------------|
| `{tenant}/*/public/` | organizationAdmin | Public (everyone) |
| `{tenant}/*/private/common/` | organizationAdmin | organizationMember |
| `{tenant}/*/private/personal/{userId}/` | Owner (userId) | Owner + organizationAdmin |
| `{tenant}/*/private/departments/{deptId}/` | departmentAdmin | departmentMember |
| `{tenant}/*/private/library/` | organizationAdmin | organizationMember (with watermark) |

### Implementation Approach

Once we have the JWT structure, we'll implement:

#### Option A: Server-Side Authorization (Recommended)
- All S3 requests go through Next.js API routes
- API validates JWT claims and enforces access rules
- Uses admin MinIO credentials internally
- **Pros**: Full control, easier debugging, works with existing session
- **Cons**: Higher server load

#### Option B: MinIO IAM Policies + STS
- MinIO issues temporary credentials based on JWT
- Direct client-to-S3 access with scoped permissions
- **Pros**: Better performance, less server load
- **Cons**: More complex setup, requires MinIO STS configuration

## Example: What We'll Generate

Once you provide the JWT structure, we'll generate:

### 1. **Access Control Middleware**
```typescript
// libs/s3/src/middleware/access-control.ts
export function validateS3Access(
  jwt: DecodedJWT,
  operation: 'read' | 'write',
  path: string
): boolean {
  // Uses your JWT structure to check permissions
}
```

### 2. **MinIO IAM Policies** (if using Option B)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::tenant-${jwt:tenantId}/*/private/personal/${jwt:sub}/*"]
  }]
}
```

### 3. **Updated API Routes**
API routes will extract JWT, validate claims, and enforce access rules.

## Next Steps

1. **Provide JWT structure** using the questions above
2. We'll implement the access control logic
3. Update API routes with permission checks
4. Generate MinIO policies (if needed)
5. Test with real tenant data

## Where to Send JWT Info

Please reply with:
- A decoded JWT sample (sanitized if needed)
- Answers to the questions above
- Any additional custom claims we should know about
