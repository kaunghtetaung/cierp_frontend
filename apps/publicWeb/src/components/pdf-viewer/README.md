# Public PDF Viewer Module

## Overview
A public PDF viewer component for displaying library abstracts and content without authentication requirements.

## Features
- ✅ No authentication required
- ✅ View PDFs in browser
- ✅ Download support
- ✅ Print support
- ✅ Open in new tab
- ✅ Multilingual support (English/Myanmar)
- ✅ Error handling with retry
- ✅ Loading states
- ✅ Responsive design

## Components

### `PublicPdfViewer`
Main PDF viewer component with full-screen modal display.

#### Props
```typescript
interface PublicPdfViewerProps {
  pdfUrl: string;              // URL to the PDF file
  title?: string;              // Document title (default: 'PDF Document')
  onClose?: () => void;        // Callback when closing the viewer
  showDownload?: boolean;      // Show download button (default: true)
  showPrint?: boolean;         // Show print button (default: true)
}
```

#### Usage Example
```tsx
import { PublicPdfViewer } from '@/components/pdf-viewer/PublicPdfViewer';

function MyComponent() {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <>
      <button onClick={() => setShowPdf(true)}>View PDF</button>

      {showPdf && (
        <PublicPdfViewer
          pdfUrl="https://storage.um1ygn.edu.mm/library/public/abstracts/123.pdf"
          title="Research Abstract"
          onClose={() => setShowPdf(false)}
        />
      )}
    </>
  );
}
```

## Integration with Library Module

### 1. Updated Bibliography Interface
Added PDF-related fields to the `Bibliography` interface:

```typescript
export interface Author {
  _id: string;
  id?: string;
  name?: string;         // API returns 'name' field
  fullName?: string;     // Some APIs might use 'fullName'
  firstName?: string;
  lastName?: string;
}

export interface Bibliography {
  // ... existing fields
  abstract?: boolean;        // Has abstract PDF
  content?: boolean;         // Has content PDF
  abstractFile?: string;     // URL to abstract PDF
  contentFile?: string;      // URL to content PDF
}
```

### 2. Library Utilities
Created `@/lib/library-utils.ts` with helper functions:

```typescript
// Handles various author name formats from API
getAuthorName(author?: Author): string
```

**Important**: The API returns `author.name`, but the interface supports multiple formats (`fullName`, `firstName`/`lastName`) for flexibility. The `getAuthorName()` utility handles all cases.

### 3. SearchResults Component Integration
The `SearchResults` component now displays PDF viewer buttons for books that have abstract or content files:

- **Card View**: Shows PDF badge on cover, buttons below book info
- **List View**: Shows PDF badge on thumbnail, inline buttons
- **Table View**: Shows PDF badge in title, buttons in actions column

### 4. PDF Viewer Buttons
- **Abstract Button**: Blue button to view abstract PDF
- **Content Button**: Green button to view content PDF
- **View Details Button**: Yellow button for full book details (existing)

## Storage URLs
PDFs are served from MinIO storage with public access:
- Abstracts: `https://storage.um1ygn.edu.mm/library/public/abstracts/{id}.pdf`
- Content: `https://storage.um1ygn.edu.mm/library/public/content/{id}.pdf`

## Error Handling
- Loading state with spinner
- Error state with retry button
- Fallback to download if iframe fails
- User-friendly error messages

## Browser Compatibility
- Chrome/Edge: Native PDF viewer
- Firefox: Native PDF viewer
- Safari: Native PDF viewer
- Mobile browsers: May trigger download on some devices

## Future Enhancements
- [ ] PDF.js integration for consistent cross-browser experience
- [ ] Zoom controls
- [ ] Page navigation
- [ ] Text search within PDF
- [ ] Annotations (if needed for authenticated users)
- [ ] Thumbnail preview
- [ ] Fullscreen mode toggle
