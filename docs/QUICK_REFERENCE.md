# MinIO S3 Storage - Quick Reference Card

## 🔗 Quick Access

```bash
# MinIO Server
ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116

# Reverse Proxy
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.116

# Test File
curl https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt
```

## 📦 Create New Tenant Bucket

```bash
ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116
/usr/local/bin/setup-tenant-bucket.sh <tenant-id>
```

## 📤 Upload File

```bash
# Via mc (from MinIO server)
mc cp localfile.jpg myminio/tenant-um1ygn/core/public/

# Via Next.js API
POST /api/media/upload
```

## 📥 Access File

```
# Public files (direct access)
https://storage.{domain}/tenant-{id}/core/public/file.jpg

# Private files (via API)
GET /api/media/list?path=private/personal/user123
```

## ⚙️ Environment Variables

```bash
MINIO_ENDPOINT=192.168.200.33
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234
MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
MINIO_BUCKET_STRATEGY=per-tenant
```

## 📊 Quick Commands

```bash
# List buckets
mc ls myminio/

# List files in bucket
mc ls myminio/tenant-um1ygn/core/public/

# Check storage usage
mc du myminio/tenant-um1ygn

# Check MinIO health
mc admin info myminio

# Generate pre-signed URL (1 hour)
mc share download --expire 1h myminio/tenant-um1ygn/core/public/file.jpg
```

## 🗂️ Folder Structure

```
tenant-{tenantId}/
├── core/
│   ├── public/              # Public read
│   └── private/
│       ├── common/          # Org members
│       ├── personal/{userId}/  # Owner only
│       ├── departments/{deptId}/  # Dept members
│       └── library/         # Protected PDFs
└── publicWeb/
    └── public/              # Website assets
```

## 🔐 Access Rules

| Path | Write | Read |
|------|-------|------|
| `*/public/` | Admin | Public |
| `private/common/` | Admin | Members |
| `private/personal/{userId}/` | Owner | Owner + Admin |
| `private/departments/{deptId}/` | Dept Admin | Dept Members |
| `private/library/` | Admin | Members (with watermark) |

## 🚀 React Components

```tsx
// Full file browser
import { FileBrowser } from '@repo/media';
<FileBrowser tenantId="um1ygn" app="core" basePath="public" />

// Form field
import { FilePickerField } from '@repo/media';
<FilePickerField control={control} name="logo" basePath="public/logos" />

// Modal picker
import { FilePickerModal } from '@repo/media';
<FilePickerModal isOpen={open} onSelect={handleSelect} basePath="public" />
```

## 📍 Important URLs

- **Setup Guide**: `MINIO_SETUP_COMPLETE.md`
- **API Docs**: `libs/s3/README.md` & `libs/media/README.md`
- **JWT Requirements**: `JWT_REQUIREMENTS.md`

## ☎️ Support

MinIO Console: `http://192.168.200.33:9001`
Credentials: `minioadmin / cidb1234`
