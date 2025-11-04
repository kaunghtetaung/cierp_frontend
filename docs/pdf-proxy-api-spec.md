# PDF Proxy API Specification

## Overview
PDF proxy service that streams PDF files from S3/MinIO storage with authentication, watermarking, and range request support for page-by-page loading.

**Purpose:** Enable secure PDF viewing with:
- Authentication & authorization
- Dynamic watermarking (user info + timestamp)
- HTTP Range requests for efficient page-by-page loading
- Support for both web and mobile apps

---

## Base URL
```
Production: https://pdf-proxy.um1ygn.edu.mm
Development: http://localhost:3002
```

---

## Authentication

The PDF proxy validates user identity through JWT tokens (either session cookies or Bearer tokens), extracts user context, then uses **MinIO root admin credentials** for S3 operations.

### Session-Based (Web Apps)

```http
Cookie: session={sessionId}
```

- Session cookie contains encrypted user session ID
- Server validates session → extracts userId, tenantId, roles from JWT

### Token-Based (Mobile Apps)

```http
Authorization: Bearer {accessToken}
```

- JWT access token contains user claims
- Server validates JWT → extracts userId, tenantId, roles from token payload

---

## Endpoints

### 1. GET /pdf

Stream a PDF file with optional watermarking and range request support.

#### Request

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `file` | string | Yes | Full S3 key path to the PDF file | `public/document.pdf` |
| `app` | string | Yes | Application identifier | `core`, `publicWeb` |
| `tenantId` | string | Yes | Tenant identifier | `68d12d98e776d47ad2004f19` |
| `watermark` | string | No | Watermark text to overlay on PDF | `CONFIDENTIAL`, `DRAFT` |

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Cookie: session={sessionId}` | Yes (Web) | Session cookie for authentication |
| `Authorization: Bearer {token}` | Yes (Mobile) | JWT access token |
| `Range: bytes={start}-{end}` | No | HTTP Range for partial content |

**Example Requests:**

```http
# Web App - Full PDF with watermark
GET /pdf?file=public/report.pdf&app=core&tenantId=68d12d98e776d47ad2004f19&watermark=CONFIDENTIAL
Cookie: session=9d5adf97e1eae7ab670fe9cf24471a7dd156c49c2bdb7b3bf769e05c2157324f
```

```http
# Mobile App - Range request for page 1
GET /pdf?file=public/report.pdf&app=core&tenantId=68d12d98e776d47ad2004f19&watermark=CONFIDENTIAL
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Range: bytes=0-65535
```

```http
# No watermark
GET /pdf?file=public/document.pdf&app=core&tenantId=68d12d98e776d47ad2004f19
Cookie: session=9d5adf97e1eae7ab670fe9cf24471a7dd156c49c2bdb7b3bf769e05c2157324f
```

#### Response

**Success Response (200 - Full Content):**

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 2548672
Accept-Ranges: bytes
Cache-Control: private, no-cache, no-store, must-revalidate
Content-Disposition: inline

{PDF binary data}
```

**Success Response (206 - Partial Content):**

```http
HTTP/1.1 206 Partial Content
Content-Type: application/pdf
Content-Length: 65536
Content-Range: bytes 0-65535/2548672
Accept-Ranges: bytes
Cache-Control: private, no-cache, no-store, must-revalidate

{PDF binary chunk}
```

**Error Responses:**

```http
# 400 Bad Request - Missing required parameters
{
  "statusCode": 400,
  "message": "Missing required parameter: file",
  "error": "Bad Request"
}
```

```http
# 401 Unauthorized - Invalid or missing authentication
{
  "statusCode": 401,
  "message": "Invalid or missing authentication token",
  "error": "Unauthorized"
}
```

```http
# 403 Forbidden - User doesn't have access to this file
{
  "statusCode": 403,
  "message": "You do not have permission to access this file",
  "error": "Forbidden"
}
```

```http
# 404 Not Found - File doesn't exist in S3
{
  "statusCode": 404,
  "message": "File not found: public/document.pdf",
  "error": "Not Found"
}
```

```http
# 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Failed to fetch PDF",
  "error": "Internal Server Error",
  "details": "Error details here"
}
```

---

## Watermarking Specification

### Watermark Layout

When `watermark` parameter is provided, the service adds two watermarks to each page:

#### 1. Center Diagonal Watermark
- **Text**: Value from `watermark` parameter (e.g., "CONFIDENTIAL")
- **Position**: Center of page, rotated -45 degrees
- **Font**: Helvetica Bold, 48pt
- **Color**: RGB(0.85, 0.85, 0.85) - Light gray
- **Opacity**: 0.3

#### 2. Footer Watermark (User Tracking)
- **Text**: `{userEmail} - {timestamp}`
- **Example**: `admin@crystal-image.net - Oct 29, 2025, 04:30 PM`
- **Position**: Bottom left corner (x: 50, y: 30)
- **Font**: Helvetica Bold, 9pt
- **Color**: RGB(0.4, 0.4, 0.4) - Dark gray
- **Opacity**: 0.6

### Watermark Behavior

1. **Encrypted PDFs**: If PDF is password-protected or encrypted, watermarking is skipped and original PDF is returned
2. **Multi-Page**: Watermark is applied to ALL pages in the PDF
3. **Performance**: Watermarking adds 2-10 seconds processing time depending on page count

---

## Authentication Flow

### Web Apps (Session-Based)

```mermaid
sequenceDiagram
    Client->>Next.js: Request page
    Next.js->>Client: Set session cookie
    Client->>PDF Proxy: GET /pdf (with session cookie)
    PDF Proxy->>Session Store: Validate session
    Session Store-->>PDF Proxy: User info
    PDF Proxy->>S3: Fetch PDF
    S3-->>PDF Proxy: PDF data
    PDF Proxy->>PDF Proxy: Add watermark
    PDF Proxy-->>Client: Stream PDF
```

### Mobile Apps (Token-Based)

```mermaid
sequenceDiagram
    Mobile App->>Auth API: Login
    Auth API-->>Mobile App: JWT Access Token
    Mobile App->>PDF Proxy: GET /pdf (Authorization: Bearer token)
    PDF Proxy->>Auth API: Validate JWT
    Auth API-->>PDF Proxy: User info
    PDF Proxy->>S3: Fetch PDF
    S3-->>PDF Proxy: PDF data
    PDF Proxy->>PDF Proxy: Add watermark
    PDF Proxy-->>Mobile App: Stream PDF
```

---

## Authentication & Authorization Flow

### How It Works

```
1. Client Request → PDF Proxy
   ├─ Cookie: session={sessionId} (Web)
   └─ Authorization: Bearer {jwt} (Mobile)

2. PDF Proxy validates JWT/Session
   ├─ Extract session cookie OR Bearer token
   ├─ Validate JWT signature & expiration
   └─ Extract user context from JWT claims

3. JWT Claims Extracted:
   ├─ userId: "68e0b62131f65aa7c3783438"
   ├─ tenantId: "68d12d98e776d47ad2004f19"
   ├─ roles: ["admin", "viewer"]
   └─ userEmail: "admin@example.com"

4. Authorization Check
   ├─ Verify user belongs to requested tenant
   ├─ Check file path permissions based on roles
   └─ Validate access to public/private/personal folders

5. S3 Access (Using Root Admin Credentials)
   ├─ Connect to MinIO with MINIO_ROOT_USER/PASSWORD
   ├─ Access tenant bucket (tenantSlug)
   ├─ Fetch file at path: {app}/{folder}/{file}
   └─ Return PDF with optional watermark
```

### What JWT/Session Provides

The JWT token (from session cookie or Bearer token) contains:

```typescript
interface JWTClaims {
  userId: string;          // User ID for watermark & audit
  userEmail?: string;      // User email for watermark
  tenantId: string;        // Tenant ID for bucket resolution
  tenantSlug: string;      // Tenant slug = MinIO bucket name
  roles: string[];         // User roles for permission check
  departments: string[];   // User departments for file access
  exp: number;            // Token expiration timestamp
}
```

### What MinIO Credentials Are Used

**Important**: The PDF proxy does NOT use per-user MinIO credentials. Instead:

- ✅ **JWT provides**: User identity, tenant context, roles
- ✅ **MinIO credentials used**: Root admin (from env vars)
- ✅ **Security enforced by**: Application-level access control
- ✅ **Tenant isolation**: Each tenant = separate MinIO bucket

```typescript
// S3 client uses root admin credentials
const s3Config = {
  accessKey: process.env.MINIO_ROOT_USER,     // Admin credential
  secretKey: process.env.MINIO_ROOT_PASSWORD, // Admin credential
  endpoint: process.env.MINIO_ENDPOINT
};

// Tenant isolation via bucket selection
const bucketName = tenantSlug; // From JWT, not credentials
```

---

## File Access Control

### Public Files
- **Path Pattern**: `{app}/public/*`
- **Access**: All authenticated users
- **Example**: `core/public/annual-report.pdf`

### Private Files
- **Path Pattern**: `{app}/private/*`
- **Access**: Based on sub-folder:
  - `private/common/*` - All organization users
  - `private/departments/{deptSlug}/*` - Department members only
  - `private/shared/{userId}/*` - Specific user only
- **Example**: `core/private/departments/hr/policy.pdf`

### Personal Files
- **Path Pattern**: `personal/{username}/*`
- **Access**: File owner only
- **Example**: `personal/john.doe/my-document.pdf`

---

## S3/MinIO Configuration

### Bucket Structure
```
{tenantSlug}/                          # e.g., "um1/"
├── {app}/                             # e.g., "core/"
│   ├── public/                        # Public files
│   │   └── document.pdf
│   └── private/
│       ├── common/                    # All org users
│       ├── departments/               # Department-specific
│       │   └── hr/
│       │       └── policy.pdf
│       └── shared/                    # User-to-user sharing
│           └── {userId}/
└── personal/                          # User-specific
    └── {username}/
        └── my-file.pdf
```

### S3 Credentials Required

**Root Admin Credentials** (Not per-user credentials):

```env
MINIO_ENDPOINT=s3.um1ygn.edu.mm
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ROOT_USER=minioadmin              # Root admin username
MINIO_ROOT_PASSWORD=minioadmin-secret    # Root admin password
MINIO_REGION=us-east-1
```

**Security Model:**

- PDF proxy uses **root admin credentials** for all S3 operations
- User authentication happens via **JWT validation** (not MinIO credentials)
- Tenant isolation via **bucket selection** (tenantSlug from JWT)
- File access control via **application-level permission checks** (roles, departments)

---

## HTTP Range Request Support

### How Range Requests Work

PDF viewers (like PDF.js) request specific byte ranges to load pages on-demand:

```http
# First request - Get document header and first page
Range: bytes=0-65535

# Subsequent requests - Get specific pages
Range: bytes=65536-131071
Range: bytes=131072-196607
```

### Implementation Requirements

1. **Accept Range Header**: Parse `Range: bytes={start}-{end}` header
2. **Validate Range**: Ensure start/end are within file bounds
3. **Return Partial Content**:
   - Status code: 206
   - Header: `Content-Range: bytes {start}-{end}/{total}`
   - Header: `Content-Length: {chunkSize}`
4. **Support Open-Ended Ranges**: `bytes={start}-` means "from start to end of file"

---

## Performance Requirements

### Response Times (Target)

| Scenario | Without Cache | With Cache |
|----------|--------------|------------|
| Small PDF (< 1MB) | < 1 second | < 100ms |
| Medium PDF (1-10MB) | 1-3 seconds | < 200ms |
| Large PDF (10-50MB) | 3-10 seconds | < 500ms |
| Very Large PDF (> 50MB) | 10-30 seconds | < 1 second |

### Caching Strategy (Recommended)

**Redis Cache Implementation:**

```typescript
// Cache key format
const cacheKey = `pdf:${tenantId}:${userId}:${fileKey}:${watermark}`;

// TTL (Time To Live)
const cacheTTL = 15 * 60; // 15 minutes

// Cache workflow
1. Check Redis cache first
2. If cache hit: Return cached PDF instantly
3. If cache miss:
   a. Fetch from S3
   b. Add watermark
   c. Store in Redis (with TTL)
   d. Return PDF
```

**Cache Size Estimate:**
- Average PDF: 5MB
- 100 concurrent users viewing 10 different PDFs = ~5GB cache
- Redis memory requirement: 8-16GB recommended

---

## Error Handling

### Error Categories

1. **Client Errors (4xx)**
   - 400: Invalid request parameters
   - 401: Authentication failed
   - 403: Permission denied
   - 404: File not found

2. **Server Errors (5xx)**
   - 500: S3 fetch failed
   - 500: Watermark processing failed
   - 503: Service temporarily unavailable

### Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: string;        // Optional technical details
  timestamp?: string;      // ISO 8601 timestamp
  path?: string;          // Request path
}
```

**Example:**

```json
{
  "statusCode": 404,
  "message": "File not found: public/missing.pdf",
  "error": "Not Found",
  "details": "NoSuchKey: The specified key does not exist.",
  "timestamp": "2025-10-29T10:30:15.123Z",
  "path": "/pdf"
}
```

---

## Security Considerations

### 1. Authentication
- ✅ Always validate session/token before serving PDF
- ✅ Check token expiration
- ✅ Verify user belongs to tenant

### 2. Authorization
- ✅ Check file path permissions based on user role
- ✅ Prevent path traversal attacks (`../` in file parameter)
- ✅ Validate tenant isolation (users can't access other tenants' files)

### 3. Rate Limiting
- ✅ Implement rate limits per user/IP
- ✅ Suggested: 100 requests per minute per user
- ✅ Return 429 (Too Many Requests) when exceeded

### 4. Input Validation
- ✅ Sanitize file path parameter
- ✅ Validate app parameter (whitelist: 'core', 'publicWeb', etc.)
- ✅ Validate tenantId format (MongoDB ObjectId)
- ✅ Limit watermark text length (max 100 characters)

### 5. Audit Logging
- ✅ Log all PDF access attempts
- ✅ Include: userId, tenantId, fileKey, timestamp, IP address
- ✅ Store logs for compliance/forensics

---

## Logging Requirements

### Log Format (JSON)

```json
{
  "timestamp": "2025-10-29T10:30:15.123Z",
  "level": "info",
  "service": "pdf-proxy",
  "operation": "fetch-pdf",
  "userId": "68e0b62131f65aa7c3783438",
  "userEmail": "admin@crystal-image.net",
  "tenantId": "68d12d98e776d47ad2004f19",
  "tenantSlug": "um1",
  "fileKey": "public/report.pdf",
  "app": "core",
  "hasWatermark": true,
  "watermarkText": "CONFIDENTIAL",
  "isRangeRequest": true,
  "rangeHeader": "bytes=0-65535",
  "responseTime": 1234,
  "cacheHit": false,
  "fileSize": 2548672,
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Log Levels

- **INFO**: Successful PDF fetch
- **WARN**: Encrypted PDF (watermark skipped), cache miss
- **ERROR**: S3 fetch failed, authentication failed, permission denied
- **DEBUG**: Detailed operation flow (only in development)

---

## Mobile App Integration

### iOS (Swift)

```swift
// Using URLSession with Range requests
func fetchPDFPage(page: Int) {
    let url = URL(string: "https://pdf-proxy.um1ygn.edu.mm/pdf?file=public/report.pdf&app=core&tenantId=\(tenantId)&watermark=CONFIDENTIAL")!

    var request = URLRequest(url: url)
    request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

    // Range request for specific page (64KB chunks)
    let start = page * 65536
    let end = start + 65535
    request.addValue("bytes=\(start)-\(end)", forHTTPHeaderField: "Range")

    URLSession.shared.dataTask(with: request) { data, response, error in
        // Handle PDF data
    }.resume()
}
```

### Android (Kotlin)

```kotlin
// Using OkHttp with Range requests
fun fetchPDFPage(page: Int) {
    val client = OkHttpClient()

    val start = page * 65536
    val end = start + 65535

    val request = Request.Builder()
        .url("https://pdf-proxy.um1ygn.edu.mm/pdf?file=public/report.pdf&app=core&tenantId=$tenantId&watermark=CONFIDENTIAL")
        .addHeader("Authorization", "Bearer $accessToken")
        .addHeader("Range", "bytes=$start-$end")
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            // Handle PDF data
        }
    })
}
```

### React Native

```typescript
// Using fetch with Range requests
async function fetchPDFPage(page: number) {
  const start = page * 65536;
  const end = start + 65535;

  const response = await fetch(
    `https://pdf-proxy.um1ygn.edu.mm/pdf?file=public/report.pdf&app=core&tenantId=${tenantId}&watermark=CONFIDENTIAL`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Range': `bytes=${start}-${end}`
      }
    }
  );

  const pdfData = await response.arrayBuffer();
  return pdfData;
}
```

---

## Testing Checklist

### Unit Tests
- ✅ Session validation (valid/invalid/expired)
- ✅ JWT token validation
- ✅ S3 file fetch (success/not found)
- ✅ Watermark processing (with/without watermark)
- ✅ Range request parsing (various formats)
- ✅ Permission checks (public/private/personal)
- ✅ Input validation (malicious paths)

### Integration Tests
- ✅ Full PDF fetch with watermark
- ✅ Range request for multiple pages
- ✅ Cache hit/miss scenarios
- ✅ Different tenant isolation
- ✅ Authentication failure handling
- ✅ S3 connection failure

### Load Tests
- ✅ 100 concurrent users
- ✅ Large PDF files (> 50MB)
- ✅ Cache performance under load
- ✅ Memory usage monitoring

---

## Deployment Requirements

### Infrastructure

```yaml
# Docker Compose Example
services:
  pdf-proxy:
    image: pdf-proxy:latest
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - MINIO_ENDPOINT=s3.um1ygn.edu.mm
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    depends_on:
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --maxmemory 8gb --maxmemory-policy allkeys-lru
```

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# S3/MinIO (Root Admin Credentials)
MINIO_ENDPOINT=s3.um1ygn.edu.mm
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin-secret
MINIO_REGION=us-east-1

# Redis Cache
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
CACHE_TTL=900

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_VALIDATION_URL=https://api.um1ygn.edu.mm/auth/validate

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

---

## API Client Examples

### cURL

```bash
# Full PDF with watermark
curl -X GET \
  'http://localhost:3002/pdf?file=public/report.pdf&app=core&tenantId=68d12d98e776d47ad2004f19&watermark=CONFIDENTIAL' \
  -H 'Cookie: session=9d5adf97e1eae7ab670fe9cf24471a7dd156c49c2bdb7b3bf769e05c2157324f' \
  --output report.pdf

# Range request (first 64KB)
curl -X GET \
  'http://localhost:3002/pdf?file=public/report.pdf&app=core&tenantId=68d12d98e776d47ad2004f19' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Range: bytes=0-65535' \
  --output page1.pdf
```

### JavaScript/TypeScript

```typescript
// Axios example
import axios from 'axios';

async function fetchPDF(fileKey: string, tenantId: string, accessToken: string) {
  const response = await axios.get('/pdf', {
    params: {
      file: fileKey,
      app: 'core',
      tenantId,
      watermark: 'CONFIDENTIAL'
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    responseType: 'arraybuffer'
  });

  return response.data;
}
```

### Python

```python
# requests example
import requests

def fetch_pdf(file_key: str, tenant_id: str, access_token: str):
    response = requests.get(
        'http://localhost:3002/pdf',
        params={
            'file': file_key,
            'app': 'core',
            'tenantId': tenant_id,
            'watermark': 'CONFIDENTIAL'
        },
        headers={
            'Authorization': f'Bearer {access_token}'
        }
    )

    return response.content
```

---

## Migration from Next.js to NestJS

### Current Next.js Route
```
/apps/core/src/app/api/media/pdf-proxy/route.ts
```

### New NestJS Structure
```
pdf-proxy-service/
├── src/
│   ├── modules/
│   │   ├── pdf/
│   │   │   ├── pdf.controller.ts      # GET /pdf endpoint
│   │   │   ├── pdf.service.ts         # Business logic
│   │   │   └── pdf.module.ts
│   │   ├── auth/
│   │   │   ├── auth.guard.ts          # Session/JWT validation
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── s3/
│   │   │   ├── s3.service.ts          # S3/MinIO client
│   │   │   └── s3.module.ts
│   │   ├── cache/
│   │   │   ├── cache.service.ts       # Redis caching
│   │   │   └── cache.module.ts
│   │   └── watermark/
│   │       ├── watermark.service.ts   # PDF watermarking
│   │       └── watermark.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-29 | Initial specification based on Next.js implementation |

---

## Contact & Support

**Maintainer**: Development Team
**Email**: dev@um1ygn.edu.mm
**Documentation**: https://docs.um1ygn.edu.mm/pdf-proxy

---

## Appendix A: Current Implementation (Next.js)

### File Location
```
/apps/core/src/app/api/media/pdf-proxy/route.ts
```

### Key Features
- ✅ Session-based authentication
- ✅ S3/MinIO integration
- ✅ PDF watermarking with pdf-lib
- ✅ HTTP Range request support
- ✅ Encrypted PDF detection
- ❌ No caching (needs to be added)
- ❌ No token-based auth (needs to be added for mobile)

### Dependencies
```json
{
  "pdf-lib": "^1.17.1",
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x"
}
```

---

## Appendix B: Future Enhancements

1. **PDF Annotation**: Allow users to add notes/highlights
2. **Thumbnail Generation**: Generate page thumbnails for quick preview
3. **Text Extraction**: OCR support for searchable text
4. **Compression**: Optimize PDF size before sending
5. **Multi-Format Support**: Support other document types (DOCX, XLSX)
6. **WebSocket Streaming**: Real-time streaming for large files
7. **Analytics**: Track which pages users view most
8. **Collaborative Viewing**: Multiple users viewing same PDF with sync
