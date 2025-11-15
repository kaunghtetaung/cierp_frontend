# PDF Watermark & Viewer Implementation - Backup Documentation

**Backup Date**: 2025-11-06
**Git Commit**: df76a9f (Reduce config service client logging noise)
**Branch**: dailyDev

---

## Overview

This document serves as a backup reference for the current PDF watermark and viewer implementation in the publicWeb application before implementing the new PDFService architecture.

## Current Architecture

### 1. Page-by-Page PDF Viewer Component

**File**: `apps/publicWeb/src/components/pdf-viewer/PageByPagePdfViewer.tsx`

**Purpose**: Secure client-side PDF viewer that prevents downloading and displays watermarked pages

**Key Features**:
- Fetches PDF pages one at a time (never downloads full PDF)
- Server-side watermarking per page
- Bookmark support (localStorage)
- Keyboard navigation (arrows, Home, End)
- Right-click prevention
- Multilingual UI (English/Myanmar)
- Responsive design

**Component Props**:
```typescript
interface PageByPagePdfViewerProps {
  pdfUrl: string;        // Base URL without page parameter
  title?: string;        // Document title
  onClose?: () => void;  // Close callback
  watermark?: string;    // Watermark text (usually book title)
  bookId?: string;       // For bookmark storage
  userId?: string;       // For bookmark storage key
}
```

**Implementation Details**:
- Uses `react-pdf` library for rendering
- PDF.js worker from CDN: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
- Two-step loading:
  1. Loads metadata (page count) from full PDF
  2. Loads individual pages with watermarks on-demand
- Bookmark key format: `ebook-bookmark-{userId}-{bookId}`

**Security Features**:
- Canvas rendering (no browser PDF controls)
- `onContextMenu` prevented (no right-click)
- Each page fetched separately
- Session validation on server

---

### 2. PDF Proxy API Route (Watermarking Engine)

**File**: `apps/publicWeb/src/app/api/media/pdf-proxy/route.ts`

**Purpose**: Server-side API that fetches PDFs from S3, caches them, and watermarks individual pages

**Request Flow**:
```
Client Request
    ↓
Session Validation
    ↓
Check Redis Cache
    ↓ (cache miss)
Fetch from S3
    ↓
Store in Redis (24h TTL)
    ↓
Extract Requested Page
    ↓
Apply Watermarks
    ↓
Return Single Page PDF
```

**Query Parameters**:
- `file` (required): S3 file path
- `app` (optional): App name for bucket (default: 'publicWeb', books use 'library')
- `watermark` (optional): Text for center watermark
- `page` (optional): Page number (1-indexed) - if omitted, returns full PDF for metadata

**Watermarking System** (using pdf-lib):

1. **Center Diagonal "CONFIDENTIAL"**
   - Color: Red `rgb(0.9, 0.1, 0.1)`
   - Font: HelveticaBold, 60pt
   - Opacity: 15%
   - Rotation: -45 degrees
   - Position: Center, +40px from middle

2. **Center Diagonal Book Title**
   - Color: Gray `rgb(0.85, 0.85, 0.85)`
   - Font: HelveticaBold, 36pt
   - Opacity: 25%
   - Rotation: -45 degrees
   - Position: Center, -20px from middle

3. **Footer Watermark**
   - Format: `CONFIDENTIAL - {email} - {timestamp} - Page X/Y`
   - Color: Dark gray `rgb(0.4, 0.4, 0.4)`
   - Font: HelveticaBold, 8pt
   - Opacity: 70%
   - Position: x=50, y=30 (bottom left)

**Caching Strategy**:
```typescript
const PDF_CACHE_TTL = 24 * 60 * 60; // 24 hours
const pdfCacheKey = `pdf:${tenantId}:${app}:${relativePath}`;
```

**Security**:
- Session validation using cookies
- Validates `COOKIE_NAMES.SESSION`
- Checks IP address and User Agent
- Requires authenticated session
- Returns 401 if not authenticated

**Helper Functions**:
- `extractAndWatermarkPage()`: Extracts single page and applies watermarks
- `getTenantSlugFromCache()`: Resolves tenant slug from cache
- `extractRootDomain()`: Parses root domain from host header

---

### 3. Public PDF Viewer Component

**File**: `apps/publicWeb/src/components/pdf-viewer/PublicPdfViewer.tsx`

**Purpose**: Simple PDF viewer for public content (abstracts) without authentication

**Features**:
- No authentication required
- Download support
- Print support
- Open in new tab
- Multilingual support
- Error handling with retry

**Use Case**: Library abstracts and public documents

---

### 4. Integration Example (BookDetails)

**File**: `apps/publicWeb/src/themes/default/library/BookDetails.tsx`

**eBook Viewing Implementation**:
```typescript
// Build proxy URL for library eBooks
const proxyUrl = `/api/media/pdf-proxy?file=${encodeURIComponent(book.ebookFile)}&app=library`;

// Render page-by-page viewer
<PageByPagePdfViewer
  pdfUrl={proxyUrl}
  title={book.title}
  watermark={book.title}
  onClose={handleCloseEbookViewer}
  bookId={book._id}
  userId={userId}
/>
```

**State Management**:
```typescript
const [ebookViewerState, setEbookViewerState] = useState({
  isOpen: false,
  pdfUrl: '',
  title: '',
});
```

---

## File Dependencies

### NPM Packages
- `react-pdf`: PDF rendering in React
- `pdf-lib`: Server-side PDF manipulation
- `pdfjs-dist`: PDF.js library (loaded from CDN)

### Internal Dependencies
- `@repo/s3/client`: Tenant S3 client
- `@repo/auth/core`: Session validation
- `@repo/cache`: Redis caching
- `@repo/utils/common/constants`: Cookie names

---

## Storage Structure

### S3 Bucket Structure
```
library/
  ├── private/
  │   └── ebooks/
  │       └── {bookId}.pdf
  └── public/
      ├── abstracts/
      │   └── {bookId}.pdf
      └── content/
          └── {bookId}.pdf
```

### Redis Cache Keys
```
pdf:{tenantId}:{app}:{relativePath}
```
Example: `pdf:tenant123:library:private/ebooks/book456.pdf`

### LocalStorage Keys (Bookmarks)
```
ebook-bookmark-{userId}-{bookId}
```
Example: `ebook-bookmark-user123-book456`

---

## API Endpoints

### PDF Proxy Endpoint
```
GET /api/media/pdf-proxy
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | string | Yes | S3 file path |
| app | string | No | App name (default: publicWeb) |
| watermark | string | No | Watermark text |
| page | number | No | Page number (1-indexed) |

**Response Headers**:
```
Content-Type: application/pdf
Content-Length: {size}
Cache-Control: private, no-cache, no-store, must-revalidate
Content-Disposition: inline
```

**Error Responses**:
- `400`: Missing file parameter or invalid page number
- `401`: No session or invalid session
- `500`: Failed to fetch PDF or tenant resolution error

---

## Security Features

### Client-Side Security
1. ✅ Canvas rendering (no native PDF viewer controls)
2. ✅ Right-click prevention
3. ✅ No direct PDF URL access
4. ✅ Page-by-page loading only
5. ✅ Session required

### Server-Side Security
1. ✅ Session validation (IP + User Agent)
2. ✅ Tenant isolation (S3 buckets per tenant)
3. ✅ Watermarks with user email tracking
4. ✅ Timestamp on every page
5. ✅ Redis caching with tenant scoping
6. ✅ Rate limiting via session validation

---

## Performance Optimizations

### Redis Caching
- Full PDF cached for 24 hours
- Reduces S3 API calls
- Cache key includes tenant ID for isolation

### Page-by-Page Loading
- Only requested page is sent to client
- Reduces bandwidth usage
- Prevents bulk downloading

### Lazy Loading
- Metadata loaded first (fast)
- Pages loaded on-demand
- Watermarking only on requested pages

---

## User Experience Features

### Bookmarking
- Automatically saves current page to localStorage
- Restores last read page on reopening
- Per-user, per-book tracking

### Navigation
- Previous/Next buttons
- First/Last page buttons
- Direct page input with validation
- Keyboard shortcuts:
  - Arrow Left/Up: Previous page
  - Arrow Right/Down: Next page
  - Home: First page
  - End: Last page

### Multilingual Support
- English/Myanmar UI
- Context-aware text (loading, errors, navigation)

---

## Known Limitations

1. **Full PDF metadata fetch**: First request fetches entire PDF to get page count
2. **Browser PDF viewer bypass**: Users with technical skills might bypass watermarks
3. **Screenshot possibility**: Users can still screenshot pages
4. **No DRM**: No true digital rights management
5. **Cache expiration**: After 24h, PDF re-fetched from S3

---

## Testing Checklist

### Functional Tests
- [ ] PDF loads correctly
- [ ] Watermarks appear on all pages
- [ ] Session validation works
- [ ] Bookmark saves/restores
- [ ] Navigation works (buttons + keyboard)
- [ ] Page input validation
- [ ] Error handling (invalid session, missing file)

### Security Tests
- [ ] Unauthenticated users get 401
- [ ] Right-click is prevented
- [ ] Cannot access S3 URL directly
- [ ] Watermark includes correct user email
- [ ] Tenant isolation works

### Performance Tests
- [ ] Redis caching reduces S3 calls
- [ ] Page loads are fast (<2 seconds)
- [ ] Large PDFs (500+ pages) work
- [ ] Memory usage is acceptable

---

## Migration Notes for New PDFService

When implementing the new PDFService, preserve these critical features:

1. **Watermarking System**: Triple watermark with user tracking
2. **Caching Strategy**: Redis with 24h TTL
3. **Session Validation**: Full auth check before serving
4. **Page-by-Page**: Never send full PDF to client
5. **Bookmark System**: LocalStorage persistence
6. **Multilingual UI**: English/Myanmar support

Consider improvements:
- [ ] Extract watermarking logic to separate service
- [ ] Add watermark configuration per tenant
- [ ] Implement PDF analytics (pages viewed, time spent)
- [ ] Add watermark strength levels
- [ ] Support custom watermark positions
- [ ] Add invisible watermarks (steganography)

---

## Rollback Instructions

If new PDFService fails, rollback to this commit:

```bash
git checkout dailyDev
git reset --hard df76a9f
```

Restore files:
- `apps/publicWeb/src/components/pdf-viewer/PageByPagePdfViewer.tsx`
- `apps/publicWeb/src/app/api/media/pdf-proxy/route.ts`
- `apps/publicWeb/src/components/pdf-viewer/PublicPdfViewer.tsx`

---

## Contact & Support

**Implementation Author**: Claude Code
**Backup Created**: 2025-11-06
**Git Branch**: dailyDev
**Git Commit**: df76a9f

---

**END OF BACKUP DOCUMENTATION**
