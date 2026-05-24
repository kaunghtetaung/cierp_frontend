# Library API Field Mapping

## Actual API Response vs. Component Display

### Example API Response
```json
{
  "_id": "69059107c0dc93f76529d8e9",
  "legacyBookId": "5dd4886e-2c82-4727-a0ca-012185283185",
  "title": "Study on utilisation of station hospital and rural health centre in Thayet township (1983)",
  "author": {
    "id": "69059107c0dc93f76529d8e1",
    "name": "Ye Hla (15)",
    "_id": "69059107c0dc93f76529d8ea"
  },
  "year": "1984",
  "catalogType": {
    "id": "68d14ff5125447a7a4f7836a",
    "name": "Thesis",
    "_id": "69059107c0dc93f76529d8eb"
  },
  "publisher": {
    "id": "68d14ff5125447a7a4f78504",
    "name": "University of Medicine 1",
    "_id": "69059107c0dc93f76529d8ec"
  },
  "subjects": [
    {
      "id": "68d14ff7125447a7a4f7b6f0",
      "name": "PUBLIC HEALTH",
      "_id": "69059107c0dc93f76529d8ed"
    }
  ],
  "degrees": [
    {
      "id": "69059107c0dc93f76529d8e6",
      "name": "M.Med.Sc.(Public Health)",
      "_id": "69059107c0dc93f76529d8ee"
    }
  ],
  "organizationId": {
    "_id": "68d12d98e776d47ad2004f19",
    "fullName": "University of Medicine (1) Yangon",
    "shortName": "UM1 Yangon",
    "description": "To produce ethically minded, committed and technically competent graduates who can effectively serve in different health sectors of the country.",
    "displayName": {
      "en": "University of Medicine (1) Yangon",
      "mm": "ဆေးတက္ကသိုလ် (၁) ရန်ကုန်"
    }
  },
  "status": "Active",
  "remark": "missing",
  "abstract": true,
  "abstractFile": "https://storage.um1ygn.edu.mm/library/public/abstracts/69059107c0dc93f76529d8e9.pdf",
  "content": false,
  "bookCopyCount": 0,
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T04:48:07.101Z"
}
```

## Field Mapping Table

| API Field | Component Display | Utility/Helper | Notes |
|-----------|------------------|----------------|-------|
| `_id` | Used in URL | Direct | Route param |
| `title` | Main heading (h1) | Direct | Full display |
| `author.name` | Author section | `getAuthorName()` | Handles name/fullName/firstName+lastName |
| `publisher.name` | Publisher section | Direct | |
| `year` | Publication Year | Direct | |
| `catalogType.name` | Catalog Type | Direct | "Thesis", "Book", etc. |
| `subjects[].name` | Subject tags | Array map | Blue/primary color tags |
| `degrees[].name` | Degree tags | Array map | Secondary color tags |
| `organizationId.displayName[lang]` | Organization section + fallback image | Multilingual | Falls back to shortName/fullName |
| `status` | Status badge | Direct | Green for "Active" |
| `remark` | Warning notice | Direct | Amber highlighted box |
| `abstract` + `abstractFile` | PDF View/Download buttons | Boolean check | Blue buttons |
| `content` + `contentFile` | PDF View/Download buttons | Boolean check | Green buttons |
| `bookCopyCount` | Available Copies | Direct | Number display |
| `coverImage` | Book cover or fallback | Conditional | Shows org logo if missing |

## Key Points

### Author Field ✅
```typescript
// API returns: { name: "Ye Hla (15)" }
// Utility handles: name, fullName, firstName+lastName
getAuthorName(book.author) // → "Ye Hla (15)"
```

### Organization Logo Fallback ✅
```typescript
if (book.coverImage) {
  // Show book cover
} else {
  // Show default book icon
  // Show organization name: displayName[currentLanguage] || shortName || fullName
}
```

### PDF Availability ✅
```typescript
const hasAbstract = book.abstract && book.abstractFile;
const hasContent = book.content && book.contentFile;

// Only show buttons if BOTH conditions are true:
// 1. boolean flag is true
// 2. file URL exists
```

### Subjects & Degrees ✅
```typescript
// Both are arrays of objects with { id, name, _id }
book.subjects?.map(subject => subject.name)
book.degrees?.map(degree => degree.name)
```

## Display Sections

### Left Column (Sticky Sidebar)
1. **Book Cover or Default**
   - If `coverImage` exists: Show image
   - If no `coverImage`: Show book icon + org logo
2. **Status Badge** (top-right overlay)
3. **PDF Actions** (if available)
   - Abstract: View + Download
   - Content: View + Download

### Right Column (Main Content)
1. **Title & Basic Info Card**
   - Title (large h1)
   - Author, Publisher, Year
   - ISBN, Call Number (if available)
   - Catalog Type
   - Book Copy Count

2. **Description Card** (if exists)

3. **Subjects Card** (if array has items)
   - Displayed as colored tags

4. **Degrees Card** (if array has items)
   - Displayed as colored tags

5. **Organization Card** (if exists)
   - Full name (multilingual)
   - Short name
   - Description

6. **Remark Notice** (if exists)
   - Amber warning-style box

## Missing Fields in Sample Data

The following fields are defined in the interface but not present in the sample:
- `isbn` - Would show in Basic Info grid
- `callNo` - Would show in Basic Info grid
- `description` - Would show in Description card
- `coverImage` - Falls back to default icon + org logo

## Testing Checklist

- [x] Title displays correctly
- [x] Author name shows using `getAuthorName()`
- [x] Publisher shows correctly
- [x] Year displays
- [x] Catalog Type shows
- [x] Subjects display as tags
- [x] Degrees display as tags
- [x] Organization info shows (multilingual)
- [x] Status badge shows correctly
- [x] Remark displays in amber box
- [x] Abstract PDF buttons show (has both flag + URL)
- [x] Content PDF buttons hidden (content=false)
- [x] Book copy count shows (0 in sample)
- [x] Cover image fallback works (shows org logo)
- [x] Missing fields handled gracefully (no errors)
