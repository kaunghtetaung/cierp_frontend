# Library Book Details Page

## Overview
Complete book details page showing all information about a bibliography item with proper image handling and PDF viewer integration.

## Features
✅ **Complete Book Information** - All fields from API response
✅ **Cover Image Handling** - Shows book cover or default with organization logo
✅ **PDF Integration** - View and download abstracts and content
✅ **Multilingual Support** - English and Myanmar languages
✅ **Responsive Design** - Works on all devices
✅ **SEO Optimized** - Dynamic metadata generation
✅ **Deep Linking** - Direct URL access to any book

## Route Structure

```
/library/[id]/page.tsx         → Server component (data fetching)
BookDetails.tsx                → Client component (UI)
```

### URL Pattern
```
/library/{bookId}
Example: /library/69059107c0dc93f76529d8e9
```

## Components

### 1. Book Details Page (Server Component)
**Location**: `/apps/publicWeb/src/app/(cms)/library/[id]/page.tsx`

Handles:
- Fetching book data via `getLibraryModuleItem()`
- 404 handling for missing books
- Dynamic SEO metadata generation

### 2. BookDetails Component (Client Component)
**Location**: `/apps/publicWeb/src/themes/default/library/BookDetails.tsx`

Displays:
- **Left Column (Sticky)**:
  - Book cover image or default
  - Organization logo/name when no cover
  - Status badge
  - PDF view/download buttons

- **Right Column**:
  - Complete book information
  - Description
  - Subjects (as tags)
  - Degrees (as tags)
  - Organization details
  - Remarks (highlighted)

## Image Handling

### Cover Image Logic
```typescript
if (book.coverImage) {
  // Show actual book cover
  <Image src={book.coverImage} alt={book.title} fill />
} else {
  // Show default book icon + organization logo
  <DefaultBookIcon />
  <OrganizationLogo />
}
```

### Organization Logo/Name
When no cover image exists, displays:
1. Default book icon (SVG)
2. Organization name (from `book.organizationId`)
   - Uses `displayName[currentLanguage]` (multilingual)
   - Fallback to `shortName` or `fullName`

## Data Fields Displayed

### Basic Information
- Title (h1, large display)
- Author (using `getAuthorName()` utility)
- Publisher
- Publication Year
- ISBN (monospace font)
- Call Number (monospace font)
- Catalog Type
- Status (badge)
- Available Copies

### Extended Information
- **Description**: Full text with whitespace preserved
- **Subjects**: Array of tags with primary color
- **Degrees**: Array of tags with secondary color
- **Organization**: Full details with multilingual name
- **Remark**: Highlighted warning-style notice

## PDF Integration

### Abstract PDF
- **View Button**: Blue button → Opens PublicPdfViewer modal
- **Download Button**: Gray button → Direct download

### Content PDF
- **View Button**: Green button → Opens PublicPdfViewer modal
- **Download Button**: Gray button → Direct download

Shows only if:
```typescript
const hasAbstract = book.abstract && book.abstractFile;
const hasContent = book.content && book.contentFile;
```

## Navigation

### Incoming Links
All these now link to book details page:

1. **SearchResults** - "View Details" button (all 3 views)
2. **NewArrivals** - Click entire card
3. **TopReading** - Click entire row

### Back Navigation
- "Back to Search" button uses `router.back()`
- Preserves search context

## API Response Example

```json
{
  "_id": "69059107c0dc93f76529d8e9",
  "title": "Study on utilisation...",
  "author": {
    "id": "...",
    "name": "Ye Hla (15)"
  },
  "coverImage": "https://...",  // Optional
  "organizationId": {
    "_id": "...",
    "fullName": "University of Medicine (1) Yangon",
    "shortName": "UM1 Yangon",
    "displayName": {
      "en": "University of Medicine (1) Yangon",
      "mm": "ဆေးတက္ကသိုလ် (၁) ရန်ကုန်"
    }
  },
  "subjects": [
    { "id": "...", "name": "PUBLIC HEALTH" }
  ],
  "degrees": [
    { "id": "...", "name": "M.Med.Sc.(Public Health)" }
  ],
  "abstract": true,
  "abstractFile": "https://storage.um1ygn.edu.mm/library/public/abstracts/69059107c0dc93f76529d8e9.pdf"
}
```

## Styling

### Color Scheme
- **Abstract Button**: Blue (#3B82F6)
- **Content Button**: Green (#10B981)
- **View Details Button**: Warning/Yellow
- **Status Badge**: Success green or muted gray
- **Subjects**: Primary color background
- **Degrees**: Secondary color background
- **Remark**: Amber/Warning background

### Layout
- **Desktop**: 2-column layout (1/3 left, 2/3 right)
- **Mobile**: Single column stack
- **Left column**: Sticky on scroll (desktop only)

## SEO & Metadata

Dynamic metadata generated in `generateMetadata()`:
```typescript
{
  title: `${book.title} | Library Catalog`,
  description: book.description || `${book.title} by ${author}`
}
```

## Error Handling

- **Book Not Found**: Returns 404 via `notFound()`
- **API Error**: Logs error and shows 404
- **Missing Images**: Falls back to default icon + org logo
- **Missing Fields**: Gracefully hides sections

## Usage Examples

### Link from Search Results
```tsx
<Link href={`/library/${book._id}`}>
  View Details
</Link>
```

### Direct URL
```
http://app.um1ygn.edu.mm/library/69059107c0dc93f76529d8e9
```

## Future Enhancements

- [ ] Related books section
- [ ] Book availability/reservation system
- [ ] Social sharing buttons
- [ ] Print-friendly view
- [ ] Bookmark/favorite functionality
- [ ] Review/rating system
- [ ] Citation generator
- [ ] QR code for mobile access
