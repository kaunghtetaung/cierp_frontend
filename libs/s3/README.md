# @repo/s3

S3/MinIO storage library with tenant-scoped access and multiple access strategies.

## Features

- **Tenant-Scoped Client**: Automatically prefixes all operations with tenant context
- **Multiple Access Strategies**: Pre-signed URLs, Protected PDFs, Internal access
- **Type-Safe**: Full TypeScript support
- **Redis Caching**: Optional caching for pre-signed URLs
- **Path Validation**: Prevents directory traversal attacks

## Installation

Already included in the monorepo workspace.

## Configuration

Add MinIO credentials to your `.env.local`:

```bash
MINIO_ENDPOINT=s3.yourdomain.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET_NAME=tenants
```

## Usage

### Server-Side (Next.js API Routes)

```typescript
import { createTenantS3Client } from '@repo/s3';

// Create tenant-scoped client
const s3Client = createTenantS3Client({
  tenantId: 'tenant-123',
  app: 'core',
  basePath: 'public', // Optional
});

// Upload file
await s3Client.putObject('logo.png', buffer, {
  contentType: 'image/png',
});

// List files
const result = await s3Client.listObjects('uploads');

// Generate pre-signed URL
const url = await s3Client.getPreSignedUrl('logo.png', {
  expiresIn: 3600, // 1 hour
});

// Delete file
await s3Client.deleteObject('old-file.pdf');
```

### Path Structure

All files are automatically organized by tenant and app:

```
{bucketName}/
  └── {tenantId}/
      ├── core/
      │   ├── public/              # Public assets
      │   └── private/
      │       ├── common/          # Org-wide files
      │       ├── personal/{userId}/  # User files
      │       └── departments/{deptId}/  # Dept files
      └── publicWeb/
          └── public/              # Public website assets
```

## Access Strategies

### 1. Pre-signed URL Strategy

For public resources (images, documents):

```typescript
import { PreSignedUrlStrategy } from '@repo/s3/strategies';

const strategy = new PreSignedUrlStrategy(redisCache);
// Handles: JPG, PNG, PDF (non-library), public folders
// TTL: Configurable by resource type (logo: 24h, banner: 1h, etc.)
```

### 2. Protected PDF Strategy

For library PDFs with watermarking (to be implemented with `@repo/pdf`):

```typescript
import { ProtectedPdfStrategy } from '@repo/s3/strategies';

// Handles: PDFs in /library/ folder
// Features: Page-by-page rendering, watermarking, download protection
```

### 3. Internal Strategy

For server-side operations with full access:

```typescript
import { executeInternalOperation } from '@repo/s3/strategies';

const result = await executeInternalOperation({
  tenantId: 'tenant-123',
  app: 'core',
  path: 'file.pdf',
  operation: 'getObject',
});
```

## Utilities

### Path Resolution

```typescript
import { buildS3Key, validatePath, getFileName } from '@repo/s3/utils';

const key = buildS3Key({ tenantId: 't1', app: 'core' }, 'file.txt');
// Result: "t1/core/file.txt"

const isValid = validatePath('../../../etc/passwd'); // false
const fileName = getFileName('path/to/file.pdf'); // "file.pdf"
```

### MIME Types

```typescript
import { getMimeType, isImage, formatFileSize } from '@repo/s3/utils';

const mime = getMimeType('document.pdf'); // "application/pdf"
const isImg = isImage('image/jpeg'); // true
const size = formatFileSize(1536000); // "1.46 MB"
```

## API

### TenantS3Client

```typescript
class TenantS3Client {
  // File operations
  putObject(path: string, body: Buffer, options?: UploadOptions): Promise<string>
  getObject(path: string): Promise<Buffer>
  deleteObject(path: string): Promise<void>
  deleteObjects(paths: string[]): Promise<void>

  // Listing
  listObjects(path?: string, options?: ListOptions): Promise<S3ListResult>
  getObjectMetadata(path: string): Promise<S3Object>

  // URLs
  getPreSignedUrl(path: string, options?: PreSignedUrlOptions): Promise<string>
  getPreSignedPutUrl(path: string, contentType?: string): Promise<string>

  // Copy/Move
  copyObject(sourcePath: string, destPath: string): Promise<void>
  moveObject(sourcePath: string, destPath: string): Promise<void>
  renameObject(path: string, newName: string): Promise<void>

  // Folders
  createFolder(path: string): Promise<void>
  objectExists(path: string): Promise<boolean>

  // Context
  withContext(updates: Partial<TenantS3Context>): TenantS3Client
  withBasePath(additionalPath: string): TenantS3Client
}
```

## Security

- ✅ Tenant isolation via path prefixing
- ✅ Path validation to prevent traversal attacks
- ✅ Pre-signed URLs with configurable TTL
- ✅ Optional Redis caching for performance
- ✅ Strategy pattern for different access controls

## Related Libraries

- `@repo/media` - UI components for file browsing
- `@repo/cache` - Redis caching integration
- `@repo/pdf` - PDF processing (to be implemented)
