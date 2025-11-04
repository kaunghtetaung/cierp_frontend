# Media Library URL Strategy - Public vs Private Files

## ✅ Implementation Complete

The system now correctly handles two types of file access:

### 1. **PUBLIC FILES** - Simple URLs (No Signature)

**Path Pattern:** `*/public/*`

**Example Files:**
```
core/public/logo.png
core/public/banner.jpg
publicWeb/public/hero-image.png
```

**URL Format:**
```
https://storage.{tenantRootDomain}/{tenantSlug}/{app}/public/{filename}
```

**Example URL:**
```
https://storage.um1ygn.edu.mm/um1ygn/core/public/logo.png
```

**Characteristics:**
- ✅ **No signature** - Simple clean URL
- ✅ **No expiration** - Works forever
- ✅ **Publicly accessible** - Anyone can access
- ✅ **Can be shared** - Safe to share URL publicly
- ✅ **No authentication** - Bucket policy allows access
- ✅ **Faster** - No signature generation overhead

**When to Use:**
- Website assets (logos, images, CSS, JS)
- Public downloads
- Marketing materials
- Public documentation
- Open resources

**Code Example:**
```typescript
// Generate URL for public file
const url = await s3Client.getPreSignedUrl('logo.png');
// Returns: https://storage.um1ygn.edu.mm/um1ygn/core/public/logo.png

// Use directly in HTML
<img src={url} alt="Logo" />
```

---

### 2. **PRIVATE FILES** - Pre-signed URLs (With Signature)

**Path Patterns:**
- `*/private/common/*` - Organization-wide private files
- `*/private/personal/{userId}/*` - User-specific files
- `*/private/departments/{deptId}/*` - Department files
- `*/library/*` - Protected library resources

**Example Files:**
```
core/private/common/policy.pdf
core/private/personal/user123/resume.pdf
core/private/departments/hr/payroll.xlsx
core/library/ebook.pdf
```

**URL Format:**
```
https://storage.{tenantRootDomain}/{tenantSlug}/{app}/private/{path}?
  X-Amz-Algorithm=AWS4-HMAC-SHA256&
  X-Amz-Credential=...&
  X-Amz-Date=20251027T090000Z&
  X-Amz-Expires=3600&
  X-Amz-SignedHeaders=host&
  X-Amz-Signature=f3b8c7d2a1e9...
```

**Example URL:**
```
https://storage.um1ygn.edu.mm/um1ygn/core/private/common/policy.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin/20251027/us-east-1/s3/aws4_request&X-Amz-Date=20251027T090000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=abc123def456...
```

**Characteristics:**
- ✅ **Temporary access** - Expires after set time
- ✅ **Authenticated** - Requires valid signature
- ✅ **Secure** - Cannot be forged without secret key
- ✅ **Controlled sharing** - Time-limited sharing
- ✅ **Auditable** - Can track access via signatures
- ❌ **Longer URLs** - Contains query parameters
- ❌ **Expires** - Need to regenerate periodically

**When to Use:**
- Confidential documents
- User-uploaded files
- Internal company resources
- Protected educational content
- Temporary file sharing
- Download links in emails

**Code Example:**
```typescript
// Generate pre-signed URL for private file
const url = await s3Client.getPreSignedUrl('policy.pdf', {
  expiresIn: 3600 // 1 hour
});
// Returns: https://storage.um1ygn.edu.mm/um1ygn/core/private/common/policy.pdf?X-Amz-Signature=...

// Use in download link
<a href={url} download>Download Policy</a>
```

---

## Implementation Details

### Code Location

**File:** `libs/s3/src/client/tenant-s3-client.ts`

```typescript
async getPreSignedUrl(relativePath: string, options?: PreSignedUrlOptions): Promise<string> {
  const key = this.buildKey(relativePath);

  // PUBLIC FILES: Return simple URL (no signature)
  const isPublicPath = key.includes('/public/');

  if (isPublicPath && this.context.tenantRootDomain) {
    const publicEndpoint = `storage.${this.context.tenantRootDomain}`;
    const protocol = process.env.MINIO_PUBLIC_USE_SSL !== 'false' ? 'https' : 'http';
    const port = process.env.MINIO_PUBLIC_PORT;
    const portSuffix = (port && port !== '443' && port !== '80') ? `:${port}` : '';

    // Simple public URL
    return `${protocol}://${publicEndpoint}${portSuffix}/${this.context.tenantSlug}/${key}`;
  }

  // PRIVATE FILES: Return pre-signed URL with signature
  return this.client.getPreSignedUrl(key, options);
}
```

### Decision Logic

```
┌─────────────────────────────────────┐
│ File path contains "/public/" ?     │
└──────────┬──────────────────────────┘
           │
     Yes   │   No
     ┌─────▼─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│ PUBLIC  │  │   PRIVATE    │
│  FILE   │  │    FILE      │
└─────────┘  └──────────────┘
     │               │
     ▼               ▼
Simple URL    Pre-signed URL
No signature  With signature
No expiration Expires in 1 hour
```

---

## Testing

### Test Public File Access

```bash
# Upload public file
echo "Public content" > test.txt
mc cp test.txt myminio/um1ygn/core/public/test.txt

# Access without signature
curl https://storage.um1ygn.edu.mm/um1ygn/core/public/test.txt
# ✅ Returns: Public content
```

### Test Private File Access

```bash
# Upload private file
echo "Private content" > secret.txt
mc cp secret.txt myminio/um1ygn/core/private/common/secret.txt

# Try to access without signature
curl https://storage.um1ygn.edu.mm/um1ygn/core/private/common/secret.txt
# ❌ Returns: AccessDenied

# Access with pre-signed URL (generated from app)
curl "https://storage.um1ygn.edu.mm/um1ygn/core/private/common/secret.txt?X-Amz-Signature=..."
# ✅ Returns: Private content (if signature valid and not expired)
```

---

## Bucket Policy

### Public Access Policy

**Bucket:** `um1ygn`

**Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::um1ygn/*/public/*"]
    }
  ]
}
```

**What it does:**
- Allows **anyone** (`"*"`) to perform `s3:GetObject` (read/download)
- Only for paths matching `*/public/*`
- Private paths are NOT covered by this policy
- Private files require pre-signed URLs

**Set Policy:**
```bash
cat > /tmp/policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::um1ygn/*/public/*"]
  }]
}
EOF

mc anonymous set-json /tmp/policy.json myminio/um1ygn
```

---

## Security Considerations

### Public Files

**Risks:**
- Anyone can access if they know the URL
- No access logs (standard HTTP access)
- Cannot revoke access once URL is shared

**Mitigations:**
- Only use for truly public content
- Don't store sensitive data in public folders
- Use obscure filenames if needed (not security, but helps)
- Monitor S3 access logs

**Best Practices:**
```typescript
// ✅ Good - Public assets
'core/public/logo.png'
'core/public/brochure.pdf'
'publicWeb/public/banner.jpg'

// ❌ Bad - Sensitive data in public folder
'core/public/employee-list.xlsx'  // Move to private!
'core/public/internal-memo.pdf'   // Move to private!
```

### Private Files

**Security Features:**
- Signature prevents unauthorized access
- Time-limited (default 1 hour)
- Cannot be forged without secret key
- Automatic expiration

**Best Practices:**
```typescript
// Short expiration for sensitive files
await s3Client.getPreSignedUrl('salary-data.xlsx', {
  expiresIn: 300 // 5 minutes
});

// Longer expiration for downloads
await s3Client.getPreSignedUrl('report.pdf', {
  expiresIn: 86400 // 24 hours
});

// Add content disposition for downloads
await s3Client.getPreSignedUrl('document.pdf', {
  expiresIn: 3600,
  responseContentDisposition: 'attachment; filename="document.pdf"'
});
```

---

## Use Case Examples

### Example 1: Website Logo

```typescript
// Upload to public folder
await s3Client.putObject('logo.png', logoBuffer, {
  contentType: 'image/png'
});

// Get URL (no signature needed)
const logoUrl = await s3Client.getPreSignedUrl('logo.png');
// Returns: https://storage.um1ygn.edu.mm/um1ygn/core/public/logo.png

// Use in frontend
<img src={logoUrl} alt="Logo" />
```

### Example 2: User's Private Document

```typescript
// Upload to user's private folder
const userId = 'user123';
await s3Client.putObject(
  `private/personal/${userId}/resume.pdf`,
  pdfBuffer,
  { contentType: 'application/pdf' }
);

// Generate temporary download link (1 hour)
const downloadUrl = await s3Client.getPreSignedUrl(
  `private/personal/${userId}/resume.pdf`,
  { expiresIn: 3600 }
);
// Returns: https://storage...?X-Amz-Signature=...

// Send via email
await sendEmail({
  to: user.email,
  subject: 'Your Resume',
  body: `Download your resume here: ${downloadUrl} (link expires in 1 hour)`
});
```

### Example 3: Department Shared File

```typescript
// Upload to department folder
const deptId = 'hr';
await s3Client.putObject(
  `private/departments/${deptId}/policy.pdf`,
  pdfBuffer,
  { contentType: 'application/pdf' }
);

// Generate URL for department members
const policyUrl = await s3Client.getPreSignedUrl(
  `private/departments/${deptId}/policy.pdf`,
  { expiresIn: 86400 } // 24 hours
);

// Share with department
await notifyDepartment(deptId, {
  message: 'New policy document available',
  url: policyUrl
});
```

---

## Summary

| Aspect | Public Files | Private Files |
|--------|-------------|---------------|
| **Path Pattern** | `*/public/*` | `*/private/*`, `*/library/*` |
| **URL Type** | Simple URL | Pre-signed URL |
| **Signature** | No | Yes (X-Amz-Signature) |
| **Expiration** | Never | Configurable (default 1 hour) |
| **Access Control** | Bucket policy | Temporary signature |
| **Use Case** | Public assets | Confidential documents |
| **Sharing** | Can share freely | Temporary sharing only |
| **Security** | Public by design | Secure, time-limited |

**Key Takeaway:**
- Public folder = Simple, permanent URLs for public content
- Private folder = Temporary, signed URLs for secure content

The implementation automatically chooses the right URL type based on the file path! 🎉
