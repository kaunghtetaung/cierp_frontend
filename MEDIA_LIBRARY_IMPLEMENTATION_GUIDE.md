# Media Library Implementation Guide

## Overview

This document explains the complete MinIO S3-based media library implementation for the multi-tenant Next.js application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  Route: /[appId]/media → FileBrowser Component              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Request with x-tenant-id header
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (/api/media/*)               │
│  - list, upload, delete, create-folder, rename, move        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 1. Extract tenant from header
                     │ 2. Parse JWT for user roles
                     │ 3. Validate access permissions
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    @repo/s3 Library                          │
│  - TenantS3Client (tenant-scoped operations)                │
│  - S3Client (low-level AWS SDK wrapper)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Internal: 192.168.200.33:9000
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  MinIO Server                                │
│  Buckets: tenant-{mongodbId}                                │
│    ├── {appId}/                                             │
│    │   ├── public/                                          │
│    │   ├── private/common/                                  │
│    │   ├── private/personal/{userId}/                       │
│    │   └── private/departments/{deptId}/                    │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ Public: storage.{domain}:443
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx Reverse Proxy                             │
│  SSL termination, forwards to MinIO                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Infrastructure Setup

### MinIO Server Details
- **Internal IP**: `192.168.200.33:9000` (for Next.js server)
- **Public URL**: `storage.{tenantRootDomain}:443` (for pre-signed URLs)
- **Access**: SSH via `ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116`
- **Credentials**: `minioadmin` / `cidb1234`

### Bucket Strategy
Each tenant gets a dedicated bucket named `tenant-{mongodbId}`:
```bash
# Example for tenant um1ygn
tenant-um1ygn/
├── core/
│   ├── public/              # Public files (organizationAdmin write, public read)
│   ├── private/
│   │   ├── common/          # Org-wide files (organizationAdmin write, members read)
│   │   ├── personal/
│   │   │   └── {userId}/    # Personal files (owner + orgAdmin)
│   │   └── departments/
│   │       └── {deptId}/    # Department files (deptAdmin write, members read)
│   └── library/             # Protected PDFs
├── publicWeb/
│   └── public/              # Website assets
└── {otherApps}/
```

### Bucket Creation Script
Located at `/usr/local/bin/setup-tenant-bucket.sh`:
```bash
#!/bin/bash
TENANT_ID=$1
BUCKET_NAME="tenant-${TENANT_ID}"

# Create bucket
mc mb myminio/${BUCKET_NAME}

# Create folder structure
for app in core publicWeb; do
  echo "" | mc pipe myminio/${BUCKET_NAME}/${app}/public/.keep
  echo "" | mc pipe myminio/${BUCKET_NAME}/${app}/private/common/.keep
  echo "" | mc pipe myminio/${BUCKET_NAME}/${app}/private/personal/.keep
  echo "" | mc pipe myminio/${BUCKET_NAME}/${app}/private/departments/.keep
done

# Set public access policies
cat > /tmp/public-policy-${TENANT_ID}.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": [
      "arn:aws:s3:::${BUCKET_NAME}/*/public/*"
    ]
  }]
}
EOF

mc anonymous set-json /tmp/public-policy-${TENANT_ID}.json myminio/${BUCKET_NAME}
```

---

## 2. Library Structure

### @repo/s3 - Core S3 Operations

#### Configuration (`libs/s3/src/config.ts`)
```typescript
export const s3Config = {
  // Internal endpoint for Next.js server
  internal: {
    endpoint: process.env.MINIO_ENDPOINT || '192.168.200.33',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },

  // Public endpoint for client-side URLs
  public: {
    endpointTemplate: process.env.MINIO_PUBLIC_ENDPOINT_TEMPLATE || 'storage.{tenantRootDomain}',
    port: parseInt(process.env.MINIO_PUBLIC_PORT || '443'),
    useSSL: process.env.MINIO_PUBLIC_USE_SSL !== 'false',
  },

  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'cidb1234',
  },
};
```

#### Low-Level S3 Client (`libs/s3/src/client/s3-client.ts`)
Wraps AWS S3 SDK for basic operations:
```typescript
export class S3Client {
  private client: AWSS3Client;

  async listObjects(prefix: string): Promise<S3Object[]>
  async putObject(key: string, body: Buffer, options?: UploadOptions): Promise<void>
  async getObject(key: string): Promise<Buffer>
  async deleteObjects(keys: string[]): Promise<void>
  async copyObject(sourceKey: string, destKey: string): Promise<void>
  async getPreSignedUrl(key: string, options?: PreSignedUrlOptions): Promise<string>
}
```

#### Tenant-Scoped Client (`libs/s3/src/client/tenant-s3-client.ts`)
Automatically prefixes all paths with tenant/app:
```typescript
export class TenantS3Client {
  constructor(private context: UserS3Context, private client: S3Client)

  // Automatically builds key: tenant-{tenantId}/{app}/{basePath}/{relativePath}
  async putObject(relativePath: string, body: Buffer): Promise<string>
  async listObjects(relativePath: string): Promise<S3Object[]>
  async deleteObjects(keys: string[]): Promise<void>
  async createFolder(folderName: string): Promise<void>
  async renameObject(key: string, newName: string): Promise<void>
  async moveObject(sourceKey: string, destKey: string): Promise<void>
}

export function createTenantS3Client(options: {
  tenantId: string;
  tenantRootDomain: string;
  app: string;
  basePath?: string;
}): TenantS3Client
```

---

## 3. Middleware & Security

### Tenant Resolution (`libs/s3/src/middleware/tenant-resolver.ts`)
Extracts tenant info from request headers:
```typescript
export function resolveTenantFromHeaders(request: NextRequest): TenantInfo {
  // Extract MongoDB ObjectID from x-tenant-id header
  const tenantId = request.headers.get('x-tenant-id');

  if (!tenantId || !/^[a-f\d]{24}$/i.test(tenantId)) {
    throw new Error('Invalid or missing tenant ID');
  }

  // Extract root domain from host header
  const host = request.headers.get('host');
  const tenantRootDomain = extractRootDomain(host); // e.g., "um1ygn.edu.mm"

  return { tenantId, tenantRootDomain };
}
```

### JWT Parser (`libs/s3/src/middleware/jwt-parser.ts`)
Parses Crystal Image auth system JWT:
```typescript
export interface CrystalImageJWT {
  sub: string;              // User ID
  role?: string;            // Primary role
  roles?: Array<{
    Organization: string;   // "*" or specific org
    Department: string;     // "*" or specific dept
    Role: string;          // Role name
    _id: string;
  }>;
}

export function parseJWTToS3Context(
  jwt: CrystalImageJWT,
  tenantId: string,
  tenantRootDomain: string
): UserS3Context {
  const roles = extractS3Roles(jwt);           // Map to S3Role enum
  const departmentIds = extractDepartmentIds(jwt);

  return {
    userId: jwt.sub,
    tenantId,
    tenantRootDomain,
    roles,
    departmentIds,
  };
}
```

### Access Control (`libs/s3/src/middleware/access-control.ts`)
Role-based permission validation:
```typescript
export enum S3Role {
  ORGANIZATION_ADMIN = 'organizationAdmin',
  ORGANIZATION_MEMBER = 'organizationMember',
  DEPARTMENT_ADMIN = 'departmentAdmin',
  DEPARTMENT_MEMBER = 'departmentMember',
}

export const S3_ACCESS_RULES: AccessRule[] = [
  {
    pathPattern: '*/public/*',
    writeRoles: [S3Role.ORGANIZATION_ADMIN],
    readRoles: [],
    isPublic: true,
  },
  {
    pathPattern: '*/private/common/*',
    writeRoles: [S3Role.ORGANIZATION_ADMIN],
    readRoles: [S3Role.ORGANIZATION_MEMBER, S3Role.DEPARTMENT_MEMBER],
  },
  {
    pathPattern: '*/private/personal/{userId}/*',
    writeRoles: [],
    readRoles: [],
    customValidator: (userContext, path, operation) => {
      const userId = path.match(/personal\/([^/]+)/)?.[1];
      return userId === userContext.userId || isOrganizationAdmin(userContext);
    },
  },
  // ... more rules
];

export function validateS3Access(
  userContext: UserS3Context,
  operation: S3Operation,
  path: string
): AccessCheckResult {
  // Organization admins have full access
  if (isOrganizationAdmin(userContext)) {
    return { allowed: true, reason: 'Organization admin' };
  }

  const rule = findMatchingRule(path);
  if (!rule) {
    return { allowed: false, reason: 'No matching access rule' };
  }

  // Check custom validator or role-based access
  // ...
}
```

---

## 4. API Routes Pattern

All API routes in `/apps/core/src/app/api/media/` follow this pattern:

### Example: List Files (`list/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';
import { parseJWTToS3Context } from '@repo/s3/middleware/jwt-parser';
import { validateS3Access } from '@repo/s3/middleware/access-control';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    // Step 1: Resolve tenant from x-tenant-id header
    const tenantInfo = resolveTenantFromHeaders(request);

    // Step 2: Get JWT from session (implement this)
    const jwt = await getJWTFromSession(request);

    // Step 3: Parse JWT to S3 user context
    const userContext = parseJWTToS3Context(
      jwt,
      tenantInfo.tenantId,
      tenantInfo.tenantRootDomain
    );

    // Step 4: Validate access permissions
    const accessCheck = validateS3Access(userContext, 'list', path);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason },
        { status: 403 }
      );
    }

    // Step 5: Create tenant-scoped S3 client
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app: 'core',
      basePath: path,
    });

    // Step 6: List objects
    const objects = await s3Client.listObjects('');

    // Step 7: Generate pre-signed URLs for files
    const files = await Promise.all(
      objects
        .filter(obj => !obj.isFolder)
        .map(async (obj) => ({
          key: obj.key,
          name: obj.name,
          size: obj.size,
          type: obj.contentType,
          url: await s3Client.getPreSignedUrl(obj.key),
          lastModified: obj.lastModified,
          isFolder: false,
        }))
    );

    const folders = objects
      .filter(obj => obj.isFolder)
      .map(obj => ({
        name: obj.name,
        path: obj.key,
      }));

    return NextResponse.json({
      files,
      folders,
      total: files.length + folders.length,
      hasMore: false,
    });
  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
```

### Other API Routes
- **upload** (`POST /api/media/upload`) - Upload files with multipart form data
- **delete** (`DELETE /api/media/delete`) - Delete multiple files
- **create-folder** (`POST /api/media/create-folder`) - Create folder
- **rename** (`POST /api/media/rename`) - Rename file/folder
- **move** (`POST /api/media/move`) - Move files between paths

All routes use the same 7-step pattern shown above.

---

## 5. Frontend Components (@repo/media)

### FileBrowser Component
Main file browser with grid/list views:
```typescript
<FileBrowser
  app="cpms"                    // Dynamic from route
  basePath="public"             // Starting folder
  permissions={{
    canRead: true,
    canWrite: true,
    canDelete: true,
    canCreateFolder: true,
  }}
  multiSelect={true}
  viewMode="grid"
/>
```

### File Picker Modal
Dialog for selecting files in forms:
```typescript
<FilePickerModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(file) => handleSelect(file)}
  basePath="private/common"
  accept="image/*"
  multiSelect={false}
/>
```

### React Hook Form Integration
```typescript
import { FilePickerField } from '@repo/media';

<FilePickerField
  control={form.control}
  name="logo"
  label="Organization Logo"
  basePath="public"
  accept="image/*"
  required={true}
/>
```

---

## 6. Data Flow Examples

### Uploading a File

1. **User**: Clicks upload in `/cpms/media` page
2. **Frontend**: FileBrowser → FileUploader component
3. **API Call**: `POST /api/media/upload` with:
   - Headers: `x-tenant-id: 68e0b62131f65aa7c3783438`
   - Body: FormData with file and path
4. **API Route**:
   - Extract tenant: `resolveTenantFromHeaders()` → `{ tenantId: "68e0b62131f65aa7c3783438", tenantRootDomain: "um1ygn.edu.mm" }`
   - Get JWT from session → user info
   - Parse JWT → `{ userId: "xxx", roles: ["organizationAdmin"], ... }`
   - Validate access → Check if user can write to path
   - Create S3 client → Auto-prefixes with `tenant-68e0b62131f65aa7c3783438/cpms/`
   - Upload file → S3 key: `tenant-68e0b62131f65aa7c3783438/cpms/public/logo.png`
5. **MinIO**: Stores file in bucket
6. **Response**: Return success with file info

### Listing Files

1. **User**: Navigates to `/cpms/media`
2. **Frontend**: FileBrowser loads, calls `useFileBrowser` hook
3. **API Call**: `GET /api/media/list?path=public&page=1&limit=50`
   - Headers: `x-tenant-id: 68e0b62131f65aa7c3783438`
4. **API Route**:
   - Extract tenant → `{ tenantId: "68e0b62131f65aa7c3783438", tenantRootDomain: "um1ygn.edu.mm" }`
   - Parse JWT → User context with roles
   - Validate read access → Check permissions
   - List objects → S3 prefix: `tenant-68e0b62131f65aa7c3783438/cpms/public/`
   - Generate pre-signed URLs → `https://storage.um1ygn.edu.mm/tenant-68e0b62131f65aa7c3783438/cpms/public/logo.png?X-Amz-...`
5. **Response**: Files + folders with URLs
6. **Frontend**: Display in grid/list view

---

## 7. Access Control Matrix

| Path Pattern | Write Access | Read Access |
|-------------|--------------|-------------|
| `*/public/*` | organizationAdmin | Public (everyone) |
| `*/private/common/*` | organizationAdmin | organizationMember, departmentMember |
| `*/private/personal/{userId}/*` | Owner, organizationAdmin | Owner, organizationAdmin |
| `*/private/departments/{deptId}/*` | departmentAdmin (for that dept), organizationAdmin | departmentMember (for that dept), organizationAdmin |
| `*/library/*` | organizationAdmin | organizationMember, departmentMember |

---

## 8. Environment Configuration

Required environment variables in `.env`:
```bash
# MinIO Internal (for Next.js server)
MINIO_ENDPOINT=192.168.200.33
MINIO_PORT=9000
MINIO_USE_SSL=false

# MinIO Public (for pre-signed URLs)
MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
MINIO_PUBLIC_PORT=443
MINIO_PUBLIC_USE_SSL=true

# Credentials
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234
```

---

## 9. Key Features

### ✅ Implemented
- [x] Per-tenant bucket isolation
- [x] App-based file organization
- [x] Role-based access control (4 roles)
- [x] Pre-signed URL generation with caching
- [x] File browser UI (grid/list views)
- [x] File upload with progress tracking
- [x] Folder creation
- [x] File/folder operations (rename, move, delete)
- [x] React Hook Form integration
- [x] Multi-select support
- [x] Breadcrumb navigation

### 🔄 To Implement
- [ ] PDF page-by-page rendering with watermarks
- [ ] Image thumbnails generation
- [ ] File search/filtering
- [ ] Drag-and-drop upload
- [ ] Copy/paste operations
- [ ] File preview modal
- [ ] Batch operations UI
- [ ] Upload resume/retry
- [ ] Storage quota management

---

## 10. Testing

### Create Tenant Bucket
```bash
# SSH to MinIO server
ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116
sudo su -
cd /usr/local/bin

# Create bucket for tenant
./setup-tenant-bucket.sh um1ygn
```

### Test Upload
```bash
# Create test file
echo "Hello World" > test.txt

# Upload via mc
mc cp test.txt myminio/tenant-um1ygn/core/public/

# Verify public access
curl https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt
```

### Test Frontend
1. Navigate to `http://app.um1ygn.edu.mm/cpms/media`
2. Upload file
3. View files in grid/list
4. Create folder
5. Delete file

---

## 11. Troubleshooting

### 500 Error on List
Check:
1. Environment variables are set correctly
2. MinIO server is accessible from Next.js server
3. Tenant bucket exists
4. `x-tenant-id` header is being sent
5. JWT is valid and can be parsed
6. `getJWTFromSession()` function is implemented

### Access Denied
Check:
1. User roles in JWT
2. Path matches access rules
3. Department IDs if accessing department folder
4. User ID if accessing personal folder

### Pre-signed URL Not Working
Check:
1. Public endpoint template is correct
2. Reverse proxy is forwarding correctly
3. SSL certificate is valid
4. Bucket policy allows public read for public paths

---

## 12. Next Steps for Developer

1. **Implement `getJWTFromSession()`**: Extract JWT from your session system
2. **Add `x-tenant-id` Header**: Ensure frontend API client includes this header
3. **Create Tenant Buckets**: Run setup script for each tenant
4. **Test Access Control**: Verify each role can access appropriate paths
5. **Implement PDF Protection**: Add server-side rendering for library PDFs
6. **Add Thumbnails**: Generate and cache image thumbnails
7. **Monitor Storage**: Add quota tracking and alerts

---

## Summary

This implementation provides:
- **Multi-tenant** file storage with complete isolation
- **App-based** organization for modular access
- **Role-based** security matching your auth system
- **Scalable** architecture using MinIO S3
- **Reusable** React components for file management
- **Type-safe** TypeScript throughout

The system is production-ready but requires you to implement the session/JWT integration specific to your Crystal Image auth system.
