# Media Browser Field - Usage Examples

## Implementation Complete! ✅

The media browser field types have been successfully implemented and are ready to use.

---

## What's Available

### Field Types

1. **`file`** - Basic HTML file input (unchanged, for backward compatibility)
2. **`mediaBrowser`** - Single file selection with media browser dialog
3. **`mediaGallery`** - Multiple file selection with media browser dialog
4. **`mediaUploader`** - Upload + browse combo (uses multiple selection)

---

## Backend Schema Examples

### Example 1: Profile Photo (Single Image)

```typescript
{
  fieldName: 'profilePhoto',
  fieldType: 'mediaBrowser',
  label: { en: 'Profile Photo', mm: 'ကိုယ်တိုင်ပုံ' },
  mediaBrowserConfig: {
    selectionMode: 'single',
    allowedTypes: ['image/*'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 5242880, // 5MB
    basePath: 'public',
    returnFormat: 'url',
    dialogSize: 'lg',
    showFolderTree: true,
    viewMode: 'grid',
  },
  validationRule: {
    required: true,
    errorMessage: { en: 'Profile photo is required', mm: 'ကိုယ်တိုင်ပုံ လိုအပ်သည်' }
  }
}
```

**Stored Data:**
```json
{
  "profilePhoto": "https://s3.../crystal-image/core/public/photos/profile-123.jpg"
}
```

---

### Example 2: Document Attachments (Multiple PDFs)

```typescript
{
  fieldName: 'documents',
  fieldType: 'mediaGallery',
  label: { en: 'Supporting Documents', mm: 'ပံ့ပိုးစာရွက်များ' },
  mediaBrowserConfig: {
    selectionMode: 'multiple',
    maxFiles: 5,
    allowedTypes: ['application/pdf', 'image/*'],
    maxFileSize: 10485760, // 10MB per file
    basePath: 'private/documents',
    returnFormat: 'object',
    dialogSize: 'xl',
    showFolderTree: true,
    viewMode: 'list',
  },
  validationRule: {
    required: true,
    minFiles: 1,
    maxFiles: 5,
    errorMessage: { en: 'Upload 1-5 documents', mm: 'စာရွက် ၁ မှ ၅ ခု တင်ပါ' }
  }
}
```

**Stored Data:**
```json
{
  "documents": [
    {
      "key": "core/private/documents/transcript.pdf",
      "url": "https://s3.../transcript.pdf",
      "name": "transcript.pdf",
      "size": 245678,
      "type": "application/pdf",
      "thumbnail": null
    },
    {
      "key": "core/private/documents/id-card.jpg",
      "url": "https://s3.../id-card.jpg",
      "name": "id-card.jpg",
      "size": 145234,
      "type": "image/jpeg",
      "thumbnail": "https://s3.../id-card-thumb.jpg"
    }
  ]
}
```

---

### Example 3: Banner Image (Single, Return S3 Key)

```typescript
{
  fieldName: 'bannerImage',
  fieldType: 'mediaBrowser',
  label: { en: 'Banner Image', mm: 'ဘန်နာပုံ' },
  mediaBrowserConfig: {
    selectionMode: 'single',
    allowedTypes: ['image/*'],
    maxFileSize: 2097152, // 2MB
    basePath: 'public',
    restrictToPath: true,  // Only allow public folder
    returnFormat: 'key',   // Return S3 key instead of URL
    dialogSize: 'xl',
  },
  validationRule: {
    required: false,
  }
}
```

**Stored Data:**
```json
{
  "bannerImage": "core/public/banners/hero-banner.jpg"
}
```

---

### Example 4: Gallery Images (Multiple with Upload)

```typescript
{
  fieldName: 'galleryImages',
  fieldType: 'mediaUploader',
  label: { en: 'Gallery Images', mm: 'ပြခန်းပုံများ' },
  mediaBrowserConfig: {
    selectionMode: 'multiple',
    maxFiles: 10,
    allowedTypes: ['image/*'],
    maxFileSize: 5242880, // 5MB
    basePath: 'public/gallery',
    allowUpload: true,
    uploadPath: 'public/gallery',
    returnFormat: 'url',
    dialogSize: 'full',
    showPreview: true,
  },
  validationRule: {
    required: false,
    maxFiles: 10,
  }
}
```

---

### Example 5: Personal Documents (Restrict to User Folder)

```typescript
{
  fieldName: 'personalFiles',
  fieldType: 'mediaGallery',
  label: { en: 'Personal Files', mm: 'ကိုယ်ပိုင်ဖိုင်များ' },
  mediaBrowserConfig: {
    selectionMode: 'multiple',
    maxFiles: 20,
    basePath: 'personal/{username}',  // Dynamic based on user
    restrictToPath: true,              // Can't navigate outside personal folder
    showFolderTree: false,             // Hide folder tree
    allowUpload: true,
    returnFormat: 'object',
    dialogSize: 'lg',
  },
  validationRule: {
    required: false,
  }
}
```

---

## Configuration Options Reference

### `MediaBrowserConfig` Interface

```typescript
interface MediaBrowserConfig {
  // Selection
  selectionMode?: 'single' | 'multiple';  // Default: 'single' for mediaBrowser, 'multiple' for mediaGallery/mediaUploader
  maxFiles?: number;                      // Max files for multiple (default: 10)

  // File filtering
  allowedTypes?: string[];                // MIME types (e.g., ['image/*', 'application/pdf'])
  allowedExtensions?: string[];           // Extensions (e.g., ['.jpg', '.png', '.pdf'])
  maxFileSize?: number;                   // Max size in bytes (e.g., 5242880 = 5MB)

  // Folder access
  basePath?: string;                      // Starting folder (e.g., 'public', 'private/common')
  allowFolderNavigation?: boolean;        // Allow navigating folders (default: true)
  restrictToPath?: boolean;               // Restrict to basePath only (default: false)
  allowedFolders?: string[];              // Specific folders (e.g., ['public', 'private/common'])

  // Upload
  allowUpload?: boolean;                  // Allow uploading files (default: true)
  uploadPath?: string;                    // Upload destination (default: basePath)

  // UI
  viewMode?: 'grid' | 'list';            // Default view (default: 'grid')
  dialogSize?: 'md' | 'lg' | 'xl' | 'full';  // Dialog size (default: 'xl')
  showFolderTree?: boolean;               // Show folder sidebar (default: true)
  showPreview?: boolean;                  // Show file preview (default: true)

  // Return format
  returnFormat?: 'url' | 'key' | 'object';  // Value format (default: 'url')
  // 'url': "https://s3.../file.pdf"
  // 'key': "core/public/file.pdf"
  // 'object': { key, url, name, size, type, thumbnail }
}
```

---

## Return Format Examples

### Format: `url` (Default)

**Single:**
```json
"profilePhoto": "https://s3.um1ygn.edu.mm/crystal-image/core/public/photo.jpg"
```

**Multiple:**
```json
"images": [
  "https://s3.../image1.jpg",
  "https://s3.../image2.jpg"
]
```

### Format: `key`

**Single:**
```json
"document": "core/private/documents/file.pdf"
```

**Multiple:**
```json
"documents": [
  "core/private/documents/file1.pdf",
  "core/private/documents/file2.pdf"
]
```

### Format: `object`

**Single:**
```json
"attachment": {
  "key": "core/public/file.pdf",
  "url": "https://s3.../file.pdf",
  "name": "file.pdf",
  "size": 123456,
  "type": "application/pdf",
  "thumbnail": null
}
```

**Multiple:**
```json
"attachments": [
  {
    "key": "core/public/file1.pdf",
    "url": "https://s3.../file1.pdf",
    "name": "file1.pdf",
    "size": 123456,
    "type": "application/pdf"
  }
]
```

---

## Validation Options

### File Type Validation

```typescript
validationRule: {
  fileTypes: ['image/*', 'application/pdf'],
  fileExtensions: ['.jpg', '.png', '.pdf'],
  errorMessage: { en: 'Only images and PDFs allowed' }
}
```

### File Size Validation

```typescript
validationRule: {
  fileSize: 5242880, // 5MB
  errorMessage: { en: 'File must be under 5MB' }
}
```

### Multiple Files Validation

```typescript
validationRule: {
  minFiles: 1,
  maxFiles: 5,
  errorMessage: { en: 'Upload 1-5 files' }
}
```

---

## Common Use Cases

### Use Case 1: User Avatar
- **Type**: `mediaBrowser`
- **Selection**: Single
- **Format**: `url`
- **Folder**: `public`
- **Files**: Images only
- **Size**: 5MB max

### Use Case 2: Document Uploads
- **Type**: `mediaGallery`
- **Selection**: Multiple (1-10 files)
- **Format**: `object`
- **Folder**: `private/documents`
- **Files**: PDFs and images
- **Size**: 10MB per file

### Use Case 3: Product Images
- **Type**: `mediaUploader`
- **Selection**: Multiple (up to 6)
- **Format**: `url`
- **Folder**: `public/products`
- **Files**: Images only
- **Size**: 2MB per image

### Use Case 4: Private Personal Files
- **Type**: `mediaGallery`
- **Selection**: Multiple
- **Format**: `object`
- **Folder**: `personal/{username}`
- **Restrict**: Yes (can't leave personal folder)
- **Files**: Any type

---

## Integration Notes

### Passing Context to Forms

Forms that use media fields need `tenantId`, `appId`, and `username` context:

```typescript
// In your form component
<ReactHookForm
  module={moduleSchema}
  action="create"
  moduleSlug="students"
  currentLanguage="en"
  tenantId={session.tenantId}        // Required for media fields
  appId="core"                       // Required for media fields
  username={session.user.username}   // Required for media fields
/>
```

### Field Renderer Props

The `FormFieldRenderer` component now accepts:

```typescript
<FormFieldRenderer
  field={formField}
  currentLanguage="en"
  errors={errors}
  tenantId={tenantId}      // For media browser
  appId={appId}            // For media browser
  username={username}      // For media browser
/>
```

---

## Testing Checklist

- [ ] Single image selection works
- [ ] Multiple file selection works
- [ ] File type filtering works (only allowed types shown/accepted)
- [ ] File size validation works
- [ ] Folder navigation works
- [ ] Restricted folder mode works (can't leave basePath)
- [ ] Upload button appears when `allowUpload: true`
- [ ] Different return formats work (url, key, object)
- [ ] File preview shows correctly
- [ ] Remove file works
- [ ] Form validation triggers for required fields
- [ ] Min/max files validation works for multiple selection
- [ ] Dialog sizes work (md, lg, xl, full)
- [ ] Grid and list view modes work

---

## Next Steps

1. Your backend team provides field definitions with `fieldType: 'mediaBrowser'` or `'mediaGallery'`
2. Add `mediaBrowserConfig` with desired options
3. Forms automatically render media browser fields
4. Users select files from media library
5. Form stores selected files in configured format

The implementation is complete and ready to use! 🎉
