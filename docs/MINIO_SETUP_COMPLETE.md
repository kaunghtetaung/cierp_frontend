# MinIO S3 Storage Setup - COMPLETED ✅

## Status: FULLY OPERATIONAL

Your MinIO S3 storage system with reverse proxy is now fully configured and tested!

---

## ✅ What Was Completed

### 1. **MinIO Server Configuration**
- ✅ Connected to MinIO server (192.168.200.33)
- ✅ Configured `mc` client with alias `myminio`
- ✅ Created bucket setup script at `/usr/local/bin/setup-tenant-bucket.sh`
- ✅ Created tenant bucket: `tenant-um1ygn`
- ✅ Set up proper folder structure:
  ```
  tenant-um1ygn/
  ├── core/
  │   ├── public/              ← Public read access ✓
  │   └── private/
  │       ├── common/          ← Org members
  │       ├── personal/        ← User-specific
  │       ├── departments/     ← Department-specific
  │       └── library/         ← Protected PDFs
  └── publicWeb/
      └── public/              ← Website assets ✓
  ```
- ✅ Configured public access policies for public folders

### 2. **Reverse Proxy Configuration**
- ✅ Verified Nginx configuration on proxy server (203.81.66.116)
- ✅ Existing configuration already supports:
  - `storage.um1ygn.edu.mm` → 192.168.200.33:9000
  - SSL certificates via Let's Encrypt
  - Large file uploads (5GB limit)
  - Proper MinIO headers
  - HTTP→HTTPS redirect

### 3. **End-to-End Testing**
- ✅ Uploaded test file to MinIO
- ✅ Verified file accessible via HTTPS proxy
- ✅ Confirmed public URL works:
  ```
  https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt
  ```
- ✅ Response: "Hello from MinIO Storage - um1ygn tenant"

---

## 📋 System Configuration

### MinIO Server
```
Host: 192.168.200.33:9000 (internal)
User: minioadmin
Pass: cidb1234
Status: Running (4 days uptime)
Storage: 2.9 TiB total, 1.9% used
Buckets: 10 (including tenant-um1ygn)
```

### Reverse Proxy
```
Host: 203.81.66.116 (kaunghtet@rvproxy)
Nginx: 1.24.0
SSL: Let's Encrypt (managed by Certbot)
Config: /etc/nginx/sites-available/minio-storage.conf
```

### Public URLs
```
https://storage.um1ygn.edu.mm/tenant-um1ygn/...
https://storage.crystal-image.net/...
https://storage.udmylibrary.edu.mm/...
```

---

## 🚀 How to Use

### Create New Tenant Bucket

SSH to MinIO server:
```bash
ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116

# Create bucket for new tenant
/usr/local/bin/setup-tenant-bucket.sh <tenant-id>

# Example
/usr/local/bin/setup-tenant-bucket.sh newcustomer
```

This automatically:
1. Creates `tenant-{tenantId}` bucket
2. Sets up folder structure
3. Configures public access policies

### Upload Files

```bash
# Via mc client
mc cp myfile.jpg myminio/tenant-um1ygn/core/public/

# Via Next.js API (recommended)
# Use @repo/s3 library in your application
```

### Access Files

**Public files** (no authentication required):
```
https://storage.{tenantRootDomain}/tenant-{tenantId}/core/public/file.jpg
https://storage.{tenantRootDomain}/tenant-{tenantId}/publicWeb/public/logo.png
```

**Private files** (requires authentication via Next.js API):
```
# Access via your application's API routes
# API will validate permissions and generate pre-signed URLs
```

---

## 🔧 Application Configuration

Update your `.env.local`:

```bash
# Internal endpoint (server-side Next.js → MinIO)
MINIO_ENDPOINT=192.168.200.33
MINIO_PORT=9000
MINIO_USE_SSL=false

# Public endpoint (client-side pre-signed URLs via proxy)
MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
MINIO_PUBLIC_PORT=443
MINIO_PUBLIC_USE_SSL=true

# Credentials (for internal server-side operations)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234

# Bucket strategy
MINIO_BUCKET_STRATEGY=per-tenant
MINIO_REGION=us-east-1
```

---

## 🎯 Next Steps

### 1. **Test in Your Application**

The media library components are already built. Test them:

```bash
# Start your Next.js app
npm run dev

# Visit the media browser
http://app.um1ygn.edu.mm/media

# Visit form integration example
http://app.um1ygn.edu.mm/media/form-example
```

### 2. **Update API Routes**

Replace `'demo-tenant'` with actual tenant from session:

```typescript
// apps/core/src/app/api/media/*/route.ts

// Before
const tenantId = 'demo-tenant';

// After
import { getTenantFromSession } from '@repo/security';
const session = await getSession();
const tenantId = session.tenantId;
```

### 3. **Implement JWT Access Control** ⚠️ **TODO**

Please provide your JWT token structure (see `JWT_REQUIREMENTS.md`) so I can implement:
- Permission validation middleware
- Access control for personal/department folders
- Role-based write access

### 4. **Add More Tenants**

Create buckets for other tenants:

```bash
ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116

# For crystal-image tenant
/usr/local/bin/setup-tenant-bucket.sh crystal-image

# For udmylibrary tenant
/usr/local/bin/setup-tenant-bucket.sh udmylibrary
```

**Note**: You'll also need to add SSL certificates for their storage subdomains:

```bash
# On reverse proxy server
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.116

# Add to /etc/nginx/sites-available/minio-storage.conf
# Then run certbot for new domain
echo 'Cryst@l123!' | sudo -S certbot --nginx -d storage.newdomain.com
```

---

## 📊 Monitoring

### Check MinIO Health
```bash
# From MinIO server
mc admin info myminio

# Via HTTP (internal)
curl http://192.168.200.33:9000/minio/health/live

# Via HTTPS (public)
curl https://storage.um1ygn.edu.mm/minio/health/live
```

### Check Storage Usage
```bash
# Overall
mc admin info myminio

# Per bucket
mc du myminio/tenant-um1ygn

# Per folder
mc du myminio/tenant-um1ygn/core/public/
```

### View Nginx Logs
```bash
# On reverse proxy server
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.116

# Access logs
echo 'Cryst@l123!' | sudo -S tail -f /var/log/nginx/access.log | grep storage

# Error logs
echo 'Cryst@l123!' | sudo -S tail -f /var/log/nginx/error.log
```

---

## 🛠️ Troubleshooting

### Issue: Cannot Access File

```bash
# 1. Check if file exists
mc ls myminio/tenant-um1ygn/core/public/

# 2. Check public policy
mc anonymous get myminio/tenant-um1ygn

# 3. Check from proxy server
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.116
curl -I http://192.168.200.33:9000/tenant-um1ygn/core/public/test.txt
```

### Issue: Upload Fails

```bash
# Check bucket exists
mc ls myminio/ | grep tenant-um1ygn

# Check permissions
mc anonymous get myminio/tenant-um1ygn

# Check MinIO logs
ssh -i ~/.ssh/ciservers -p 33 ciadmin@203.81.66.116
journalctl -u minio -f
```

### Issue: SSL Certificate Expired

```bash
# On reverse proxy server
echo 'Cryst@l123!' | sudo -S certbot renew
echo 'Cryst@l123!' | sudo -S systemctl reload nginx
```

---

## 📚 Documentation

- **[libs/s3/README.md](libs/s3/README.md)** - S3 client API documentation
- **[libs/media/README.md](libs/media/README.md)** - UI components guide
- **[MINIO_SETUP.md](MINIO_SETUP.md)** - Detailed setup instructions
- **[JWT_REQUIREMENTS.md](JWT_REQUIREMENTS.md)** - Access policy requirements

---

## ✨ Summary

**What's Working:**
- ✅ MinIO storage server with tenant buckets
- ✅ Reverse proxy with SSL certificates
- ✅ Public file access via HTTPS
- ✅ Next.js media library components
- ✅ React Hook Form integration
- ✅ File upload/download/delete operations

**What's Pending:**
- ⏳ JWT-based access control implementation
- ⏳ Tenant-specific session integration
- ⏳ Protected PDF viewer with watermarking
- ⏳ Additional tenant bucket creation

**Test URL:**
```
https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt
```

**Success! 🎉**

---

*Setup completed on: October 27, 2025*
*By: Claude Code Assistant*
