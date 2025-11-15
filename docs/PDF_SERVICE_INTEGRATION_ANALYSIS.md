# PDF Service Integration Analysis

**Date**: 2025-11-06
**Purpose**: Analyze the new PDF watermark service and plan integration with frontend page-by-page viewer

---

## Current State Analysis

### 1. **Existing Frontend Implementation** (publicWeb)

**File**: `apps/publicWeb/src/app/api/media/pdf-proxy/route.ts`

**Current Approach**:
- Next.js API route handles watermarking
- Uses pdf-lib for server-side watermarking
- Triple watermark system:
  1. Center "CONFIDENTIAL" (red, 60pt)
  2. Center book title (gray, 36pt)
  3. Footer with user email + timestamp
- Caches full PDF in Redis (24h TTL)
- Extracts single page on demand
- Returns watermarked PDF page

**Limitations**:
- Watermarking logic embedded in API route
- Limited configurability
- No watermark pattern repetition
- Tightly coupled to Next.js
- No separate service management

### 2. **New Backend PDF Service** (ciapp/services/pdf-service)

**Service URL**: `http://localhost:3338`
**Main Endpoint**: `POST /watermark`

**Key Features**:
- ✅ Standalone Node.js service
- ✅ Redis caching (3-minute TTL)
- ✅ Config service integration with hot-reload
- ✅ Diagonal watermark pattern (repeated across page)
- ✅ Supports PDF and JPG output
- ✅ Comprehensive metrics and logging
- ✅ Multi-tenant support (per-tenant buckets)
- ✅ Configurable watermark properties

**Watermark Implementation**:
```javascript
// Diagonal pattern that repeats across entire page
fullWatermarkText = `${watermarkText} | ${timestamp} | Page ${pageNum} | ${userName} | ${tenantName}`;

// Calculates diagonal coverage
const diagonal = Math.sqrt(width * width + height * height);
const spacing = textWidth + 100;
const count = Math.ceil(diagonal / spacing);

// Draws watermark in grid pattern
for (let i = -count; i <= count; i++) {
  for (let j = -count; j <= count; j++) {
    // Draw at each grid position with rotation
  }
}
```

**Configuration Options** (from config service or .env):
- `watermark.fontSize`: Font size (default: 12)
- `watermark.fontColor`: RGB color (default: gray)
- `watermark.opacity`: Transparency (default: 0.5)
- `watermark.rotation`: Rotation angle (default: 45°)
- `watermark.includeTimestamp`: Add timestamp (default: true)
- `watermark.includePageNumber`: Add page number (default: true)

**Request Format**:
```json
{
  "filePath": "documents/report.pdf",
  "pageNumber": 1,
  "userName": "John Doe",
  "userId": "user123",
  "watermarkText": "CONFIDENTIAL",
  "tenantId": "tenant1",
  "tenantName": "Acme Corporation",
  "outputFormat": "jpg"  // or "pdf"
}
```

**Response**:
- Content-Type: `application/pdf` or `image/jpeg`
- Binary data (watermarked page)

---

## Comparison: Current vs New Service

| Feature | Current (Next.js Route) | New (PDF Service) |
|---------|------------------------|-------------------|
| **Location** | Frontend API route | Standalone service |
| **Watermark Pattern** | Static (3 positions) | Diagonal grid (repeated) |
| **Output Formats** | PDF only | PDF or JPG |
| **Caching** | Redis 24h TTL | Redis 3min TTL |
| **Configuration** | Hardcoded | Hot-reload from config service |
| **Multi-tenant** | Bucket per tenant | Configurable strategy |
| **Metrics** | None | Prometheus metrics |
| **Logging** | Basic console.log | Winston structured logging |
| **Scalability** | Limited by Next.js | Independent service |
| **Watermark Text** | Triple layout | Diagonal repeated pattern |

---

## Integration Strategy

### **Option 1: Replace Frontend Route with Proxy (Recommended)**

**Approach**: Keep the frontend `PageByPagePdfViewer` but replace the watermarking logic in `/api/media/pdf-proxy` with calls to the new PDF service.

**Pros**:
- ✅ Minimal frontend changes
- ✅ Better watermark pattern (diagonal grid)
- ✅ Centralized watermarking logic
- ✅ Better metrics and monitoring
- ✅ Configurable via config service
- ✅ Can scale independently

**Cons**:
- ⚠️ Additional network hop (Next.js → PDF Service → S3)
- ⚠️ Two services to manage

**Implementation**:
```typescript
// apps/publicWeb/src/app/api/media/pdf-proxy/route.ts

export async function GET(request: NextRequest) {
  // 1. Validate session (same as before)
  // 2. Get query parameters

  const { filePath, pageNum, watermarkText } = parseParams(request);
  const { userId, userEmail, tenantId } = session;

  // 3. Call PDF watermark service instead of doing watermarking locally
  const response = await fetch('http://pdf-service:3338/watermark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath: relativePath,
      pageNumber: parseInt(pageNum, 10),
      userName: userEmail || userId,
      userId: userId,
      watermarkText: watermarkText || 'CONFIDENTIAL',
      tenantId: tenantId,
      tenantName: tenantSlug,
      outputFormat: 'pdf',  // or 'jpg' for better performance
    }),
  });

  if (!response.ok) {
    throw new Error('PDF service failed');
  }

  // 4. Return the watermarked page
  const watermarkedPage = await response.arrayBuffer();

  return new NextResponse(new Uint8Array(watermarkedPage), {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, no-cache',
    },
  });
}
```

### **Option 2: Direct Frontend → PDF Service (Alternative)**

**Approach**: Update `PageByPagePdfViewer` to call PDF service directly, bypassing Next.js API route.

**Pros**:
- ✅ Fewer network hops
- ✅ Simpler architecture
- ✅ Better performance

**Cons**:
- ⚠️ CORS configuration needed
- ⚠️ Session validation must move to PDF service
- ⚠️ More frontend changes
- ⚠️ Exposes PDF service URL to client

**Not Recommended** due to security concerns (session validation should stay in Next.js).

---

## Detailed Integration Plan (Option 1)

### Phase 1: Update API Route

**File**: `apps/publicWeb/src/app/api/media/pdf-proxy/route.ts`

**Changes**:
1. Remove pdf-lib watermarking code
2. Remove Redis caching of full PDF (PDF service handles caching)
3. Add PDF service client call
4. Map session data to PDF service request format
5. Handle PDF service errors
6. Return watermarked page

**Key Considerations**:
- Keep session validation in Next.js (security)
- Map tenantId/tenantSlug correctly
- Handle PDF service unavailability (fallback?)
- Update cache TTL strategy (3min vs 24h)

### Phase 2: Update Environment Configuration

**File**: `apps/publicWeb/.env`

Add:
```env
# PDF Watermark Service
PDF_SERVICE_URL=http://localhost:3338
PDF_SERVICE_TIMEOUT=30000
```

**File**: `apps/publicWeb/next.config.js`

Update if using Docker:
```javascript
env: {
  PDF_SERVICE_URL: process.env.PDF_SERVICE_URL || 'http://pdf-service:3338',
}
```

### Phase 3: Handle Output Format Decision

**Decision**: PDF or JPG?

**For Web Viewing** (PageByPagePdfViewer):
- Use `outputFormat: 'jpg'`
- Smaller file size
- Faster transmission
- Better for responsive design
- Already using react-pdf which can render images

**For Downloads**:
- Use `outputFormat: 'pdf'`
- Preserves vector quality
- Printable format

**Implementation**:
```typescript
// Detect if viewer or download
const outputFormat = pageNum ? 'jpg' : 'pdf';
```

### Phase 4: Testing Checklist

- [ ] Session validation still works
- [ ] Tenant isolation verified
- [ ] Watermarks appear correctly
- [ ] Page navigation works
- [ ] Bookmarks still save/restore
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] Multi-tenant scenarios tested
- [ ] Large PDFs (500+ pages) work
- [ ] PDF service restart doesn't break frontend

---

## Migration Considerations

### 1. **Watermark Visual Changes**

**Current**: Triple watermark (2 center + 1 footer)
```
[CONFIDENTIAL - large red diagonal]
[Book Title - medium gray diagonal]
[Footer: CONFIDENTIAL - email - timestamp - Page X/Y]
```

**New**: Repeated diagonal pattern
```
CONFIDENTIAL | 2025-11-06 | Page 1 | john@example.com | Org Name
[Repeated across entire page in grid pattern]
```

**User Impact**: More coverage, harder to remove, but may be too dense.

**Solution**: Make watermark configurable via config service:
```javascript
// pdf-service config
{
  "watermark": {
    "fontSize": 12,
    "opacity": 0.3,
    "rotation": 45,
    "fontColor": "rgb(128, 128, 128)"
  }
}
```

### 2. **Cache TTL Change**

**Current**: 24 hours (full PDF cached)
**New**: 3 minutes (per page)

**Impact**: More S3 calls after 3 minutes

**Recommendation**:
- Increase PDF service cache TTL to match current (24h)
- Or keep 3min for pages, cache full PDF separately

### 3. **Error Handling**

**New Error Scenarios**:
- PDF service unavailable
- PDF service timeout
- PDF service internal error

**Mitigation**:
```typescript
try {
  const response = await fetch(pdfServiceUrl, { timeout: 30000 });
  // ...
} catch (error) {
  logger.error('PDF service failed', error);

  // Fallback option 1: Return error to user
  return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });

  // Fallback option 2: Use old watermarking (if kept as backup)
  // return await fallbackWatermark(pdfBuffer, pageNum);
}
```

### 4. **Service Discovery**

**Development**:
```
PDF_SERVICE_URL=http://localhost:3338
```

**Docker Compose**:
```
PDF_SERVICE_URL=http://pdf-service:3338
```

**Kubernetes**:
```
PDF_SERVICE_URL=http://pdf-service.default.svc.cluster.local:3338
```

---

## Configuration Updates Needed

### PDF Service Config (MongoDB)

Create config entry for pdf-service:

```bash
# Initialize PDF service config
cd /Users/kaunghtet/Projects/ciapp/services/pdf-service
node init-mongodb-config.js production
```

**Config Structure**:
```json
{
  "appName": "pdf-service",
  "environment": "production",
  "config": {
    "redis": {
      "host": "192.168.200.32",
      "port": 6379,
      "password": "cidb1234",
      "ttl": 86400,  // 24 hours
      "keyPrefix": "pdf:"
    },
    "s3": {
      "endpoint": "192.168.200.33",
      "port": 9000,
      "bucket": "ciapp-documents",
      "bucketStrategy": "single",
      "region": "us-east-1",
      "useSSL": false,
      "accessKeyId": "minioadmin",
      "secretAccessKey": "cidb1234"
    },
    "watermark": {
      "fontSize": 12,
      "fontColor": "rgb(128, 128, 128)",
      "opacity": 0.3,
      "rotation": 45,
      "includeTimestamp": true,
      "includePageNumber": true
    },
    "processing": {
      "jpegQuality": 85,
      "maxConcurrentJobs": 10,
      "timeout": 60000
    }
  }
}
```

---

## Performance Comparison

### Current Architecture
```
Browser → Next.js API Route → S3 (fetch full PDF)
                           ↓
                        Redis Cache (24h)
                           ↓
                        Extract Page
                           ↓
                        Watermark (pdf-lib)
                           ↓
                        Return PDF Page
```

**Latency**: ~200-500ms (first request), ~50ms (cached)

### New Architecture
```
Browser → Next.js API Route → PDF Service → S3
                                    ↓
                                Redis Cache (3min)
                                    ↓
                                Extract Page
                                    ↓
                                Watermark (pdf-lib)
                                    ↓
                                Return JPG/PDF
                                    ↓
        Next.js API Route → Browser
```

**Latency**: ~300-700ms (first request), ~100ms (cached)

**Analysis**:
- Additional network hop adds ~50-100ms
- JPG output reduces transmission time
- Better caching strategy needed to match current performance

---

## Security Considerations

### 1. **Service Authentication**

**Question**: Should Next.js → PDF Service be authenticated?

**Options**:
- **A**: Internal network, no auth (trust boundary)
- **B**: API key for PDF service
- **C**: JWT token forwarding

**Recommendation**: Option A for internal services, Option B for production.

### 2. **Tenant Isolation**

**PDF Service** validates tenant via `tenantId` in request.

**Next.js** must ensure:
- User's tenantId matches request
- User has permission to access file
- File path is validated (no path traversal)

### 3. **Rate Limiting**

**PDF Service** has built-in metrics but no rate limiting.

**Recommendation**: Add rate limiting in Next.js API route:
```typescript
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

await limiter.check(userId, 30); // 30 requests per minute
```

---

## Rollback Plan

If integration fails:

```bash
git checkout dailyDev
git reset --hard 4d003ca  # PDF backup commit
```

Restore files:
- `apps/publicWeb/src/app/api/media/pdf-proxy/route.ts`
- `apps/publicWeb/src/components/pdf-viewer/PageByPagePdfViewer.tsx`

---

## Recommended Implementation Steps

### Step 1: Environment Setup
- [ ] Start PDF service: `cd ciapp/services/pdf-service && npm start`
- [ ] Verify service health: `curl http://localhost:3338/health`
- [ ] Initialize PDF service config in MongoDB
- [ ] Test watermark endpoint with curl

### Step 2: Backend Integration
- [ ] Create PDF service client utility in frontend
- [ ] Update `pdf-proxy/route.ts` to call PDF service
- [ ] Remove old watermarking code (pdf-lib logic)
- [ ] Update error handling
- [ ] Add logging

### Step 3: Frontend Updates
- [ ] Update PageByPagePdfViewer if needed (JPG support)
- [ ] Test page navigation
- [ ] Test bookmarks
- [ ] Test error scenarios

### Step 4: Testing
- [ ] Unit tests for PDF service client
- [ ] Integration tests for API route
- [ ] E2E tests for viewer
- [ ] Performance testing
- [ ] Multi-tenant testing

### Step 5: Configuration
- [ ] Add PDF service config to config service
- [ ] Update .env files
- [ ] Update Docker Compose
- [ ] Document configuration options

### Step 6: Deployment
- [ ] Deploy PDF service
- [ ] Deploy frontend updates
- [ ] Monitor metrics
- [ ] Monitor logs
- [ ] Gather user feedback

---

## Questions for Implementation

1. **Cache TTL**: Keep 3min or increase to 24h to match current?
2. **Output Format**: Use JPG for viewer or keep PDF?
3. **Watermark Pattern**: Use diagonal grid or customize to match current triple layout?
4. **Fallback**: Keep old watermarking code as fallback or fail fast?
5. **Service Auth**: Add API key or trust internal network?
6. **Error UX**: Show error message or retry automatically?

---

## Next Steps

1. **Decision Point**: Approve Option 1 (proxy approach) or Option 2 (direct)?
2. **Start Implementation**: Begin with Step 1 (Environment Setup)
3. **Create Tasks**: Break down into specific coding tasks
4. **Timeline**: Estimate implementation time

**Estimated Effort**:
- Backend integration: 4-6 hours
- Frontend updates: 2-3 hours
- Testing: 3-4 hours
- Configuration: 1-2 hours
- **Total**: ~10-15 hours

---

**END OF ANALYSIS**
