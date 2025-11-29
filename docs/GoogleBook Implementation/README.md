# Google Books API Integration for Bibliography Form

## Overview

This implementation adds ISBN barcode scanning with Google Books API integration to the bibliography entry form. When a user scans or enters an ISBN, the system automatically fetches book metadata from Google Books and populates the form fields.

## Features

1. **ISBN Barcode Scanner Support**
   - Works with USB/Bluetooth barcode scanners (they act as keyboard input)
   - Manual ISBN input with validation
   - Supports both ISBN-10 and ISBN-13 formats

2. **Google Books API Integration**
   - Fetches book metadata by ISBN
   - Retrieves: title, authors, publisher, publication year, description, categories
   - Downloads book cover images

3. **Auto-fill Form Fields**
   - Maps Google Books data to form fields
   - Supports multilingual title fields
   - Downloads and uploads book cover to media storage

4. **Full FormWithLanguage Compatibility**
   - Uses the same formField schema as existing forms
   - Zod validation from schema
   - React Hook Form integration

## File Structure

```
apps/core/src/staticModules/library/bibliographies/
├── new.tsx                           # Updated to use BibliographyForm
├── google-books-actions.ts           # Server actions for Google Books API
└── components/
    ├── BibliographyForm.tsx          # Main form component with ISBN scanner
    └── ISBNScanner.tsx               # ISBN scanner component
```

## Components

### ISBNScanner

A reusable component for ISBN lookup with barcode scanner support.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onBookFound` | `(bookData) => void` | Yes | Called when book data is found |
| `onCoverUploaded` | `(coverData) => void` | No | Called when cover is uploaded |
| `tenantId` | `string` | Yes | Tenant ID for media upload |
| `appId` | `string` | No | App ID (default: "core") |
| `currentLanguage` | `string` | No | Language for UI (default: "en") |
| `disabled` | `boolean` | No | Disable the scanner |

**Usage:**

```tsx
import { ISBNScanner } from "./components/ISBNScanner";

<ISBNScanner
  onBookFound={(bookData) => {
    // Handle book data - map to form fields
    setValue("title", bookData.title);
    setValue("isbn", bookData.isbn13);
  }}
  onCoverUploaded={(coverData) => {
    // Handle uploaded cover
    setValue("bookCoverImage", coverData.url);
  }}
  tenantId={tenantId}
  currentLanguage="en"
/>
```

### BibliographyForm

Custom form component that integrates ISBNScanner with FormWithLanguage-compatible form rendering.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `module` | `ModuleSchema` | Yes | Module schema with form configuration |
| `action` | `"create" \| "update"` | Yes | Form action type |
| `initialData` | `Record<string, any>` | No | Initial form data |
| `moduleSlug` | `string` | Yes | Module identifier |
| `itemId` | `string` | No | Item ID for updates |
| `appId` | `string` | No | App ID (default: "core") |
| `tenantId` | `string` | Yes | Tenant ID |
| `username` | `string` | No | Current username |

## Server Actions

### searchGoogleBooksAction

Searches Google Books API by ISBN.

**API Endpoint:**
```
GET https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `isbn` | `string` | ISBN-10 or ISBN-13 |

**Returns:**

```typescript
interface BookSearchResult {
  success: boolean;
  data?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    year?: string;
    description?: string;
    isbn10?: string;
    isbn13?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    thumbnailUrl?: string;
    largeThumbnailUrl?: string;
  };
  error?: string;
}
```

### downloadAndUploadBookCoverAction

Downloads book cover from Google Books and uploads to media storage.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageUrl` | `string` | Google Books thumbnail URL |
| `isbn` | `string` | ISBN for filename |
| `tenantId` | `string` | Tenant ID |
| `app` | `string` | App ID (default: "core") |

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    key: string;    // S3 storage key
    url: string;    // Pre-signed URL
    name: string;   // Filename
  };
  error?: string;
}
```

### findOrCreateRefDataAction

Searches for reference data (author, publisher, subjects) by name and optionally creates if not found.
Uses the same API pattern as DynamicSelect components.

**API Endpoints:**

```text
Search: GET /{appName}/{module}/ref?search={searchTerm}
Create: POST /{appName}/{module} with { name: value }
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `module` | `string` | Module name (e.g., "authors", "publishers", "subjects") |
| `searchName` | `string` | Name to search for |
| `createIfNotFound` | `boolean` | Auto-create if not found (default: false) |

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    id: string;     // Item ID
    name: string;   // Item name
  };
  created?: boolean; // True if newly created
  error?: string;
}
```

### batchFindOrCreateRefDataAction

Batch version for processing multiple names (e.g., multiple authors or subjects).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `module` | `string` | Module name |
| `names` | `string[]` | Array of names to search/create |
| `createIfNotFound` | `boolean` | Auto-create if not found (default: false) |

**Returns:**

```typescript
{
  success: boolean;
  data?: Array<{ name: string; id: string; created: boolean }>;
  notFound?: string[];
  error?: string;
}
```

## Data Mapping

The following Google Books fields are mapped to bibliography form fields:

### Simple Text Fields
| Google Books Field | Form Field | Notes |
|-------------------|------------|-------|
| `title` | `title` | Supports multilingual (`{en, mm}`) |
| `isbn13` or `isbn10` | `isbn` | Prefers ISBN-13 |
| `year` (from publishedDate) | `year` | Extracted 4-digit year |
| `pageCount` | `physicalDescription` | Formatted as "X pages" |
| `description` | `note` | Truncated to 1000 chars |
| `largeThumbnailUrl` | `bookCoverImage` | Downloaded and uploaded |

### Default Values
| Form Field | Default Value | Notes |
|------------|---------------|-------|
| `catalogType` | `"Book"` | Set to Book for ISBN lookup |
| `mediaType` | `"book"` | Set to book for ISBN lookup |

### Dynamic Select Fields (Reference Data)
These fields are populated by searching/creating entries in your backend:

| Google Books Field | Form Field | Behavior |
|-------------------|------------|----------|
| `authors[0]` | `author` | Search existing, auto-create if not found |
| `authors[1...]` | `additionalAuthors` | Search existing, auto-create if not found |
| `publisher` | `publisher` | Search existing, auto-create if not found |
| `categories` | `subjects` | Search existing, auto-create if not found |
| `language` | `language` | Search existing only (maps code to name: "en" → "English") |

**Notes:**

- The `degrees` field is not populated from Google Books as this data is not available.
- The `editors` field is not populated from Google Books as this data is not available. The editors field works like additionalAuthors (multi-select) and can be manually entered.
- Language codes are mapped to full names before searching (e.g., "en" → "English", "de" → "German").

## Barcode Scanner Integration

The component detects barcode scanner input by monitoring keyboard events:

1. Barcode scanners send characters rapidly (< 100ms between characters)
2. Input ends with Enter key
3. Component buffers rapid character input
4. When Enter is pressed with buffered ISBN (10+ digits), auto-triggers search

**Supported Scanners:**
- USB barcode scanners (keyboard emulation mode)
- Bluetooth barcode scanners
- Any scanner that outputs as keyboard input

## Usage Example

```tsx
// In new.tsx
import { BibliographyForm } from "./components/BibliographyForm";

export default function BibliographiesNewPage({ module, user, tenant, appId }) {
  return (
    <BibliographyForm
      module={module}
      action="create"
      moduleSlug="bibliographies"
      appId={appId}
      tenantId={tenant.tenantId}
      username={user.email?.split('@')[0] || user.id}
    />
  );
}
```

## UI Flow

1. User opens bibliography entry form
2. Default tab is "ISBN Lookup" with scanner input focused
3. User scans barcode or types ISBN manually
4. Click "Search" or press Enter to fetch book data
5. Preview shows found book with thumbnail
6. Click "Apply Book Data" to populate form fields
7. Book cover is automatically downloaded and uploaded
8. Form tab shows populated fields
9. User can edit/add additional fields
10. Submit form to save bibliography

## Error Handling

- Invalid ISBN format: Shows validation error
- No book found: Displays "No book found" message
- API errors: Shows descriptive error message
- Cover download failure: Silent failure (cover is optional)
- Form validation: Standard Zod validation errors

## Limitations

1. Google Books API may not have data for all ISBNs
2. Cover images may not be available for older books
3. Metadata quality depends on Google Books database
4. No Google Books API key required (uses public endpoint)

## Future Enhancements

- [ ] Add camera-based barcode scanning (mobile devices)
- [ ] Support multiple book search results selection
- [ ] Add Open Library API as fallback
- [ ] Support WorldCat API for more comprehensive data
- [ ] Add ISBN verification (checksum validation)
