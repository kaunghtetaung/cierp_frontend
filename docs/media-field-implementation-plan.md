# Media Browser Field Type - Implementation Plan (Revised)

## Overview

Implement media/file browser field type for form builder that **reuses the existing media module UI/UX** exactly. The mediaBrowser field will open a dialog with the same `FileBrowser` component, `FolderTree` sidebar, and all existing features (drag-drop, preview, edit, etc.).

---

## Understanding Your Existing Media Module

### Current Architecture

```
Media Module (/app/[appId]/media)
├── MediaClient (Main container)
│   ├── FolderTree (Left sidebar with folders)
│   ├── FileBrowser (Main file grid/list view)
│   ├── DropZone (Drag & drop upload)
│   ├── UploadProgress (Progress indicator)
│   ├── ImageEditor (Edit images)
│   ├── MediaPreview (Preview files)
│   └── ThumbnailUploadDialog (PDF thumbnails)
```

**Key Components:**
- `FolderTree` - Tree navigation (Public, Private, Personal folders)
- `FileBrowser` - Grid/List view with breadcrumbs, toolbar, file operations
- `useFileBrowser` hook - Handles file listing, navigation, selection
- Drag-and-drop file move between folders
- Context menus (edit, delete, preview, add thumbnail)
- Multi-select with checkboxes

---

## Implementation Strategy

### **Approach: Dialog Wrapper** ✅

Create a dialog that embeds the **exact same media module UI** in a modal:

```
Form Field (mediaBrowser)
    ↓
Opens Dialog
    ↓
Dialog contains:
├── FolderTree (same as media module)
├── FileBrowser (same as media module)
└── Selection controls (OK/Cancel buttons)
```

**Benefits:**
- ✅ Identical UI/UX to media module
- ✅ Reuse ALL existing functionality
- ✅ Users already know how to use it
- ✅ Minimal code duplication
- ✅ Automatically gets all future media features

---

## Phase 1: Backend Schema (Your Team)

### 1.1 Add New Field Types

**File:** `/libs/types/form-types.ts`

```typescript
export type FieldType =
  | 'text'
  | 'email'
  // ... existing types ...
  | 'file'              // Keep for backward compatibility (basic HTML input)
  | 'mediaBrowser'      // NEW - Single file from media library
  | 'mediaGallery';     // NEW - Multiple files from media library
```

### 1.2 Add Media Browser Configuration

**File:** `/libs/types/form-types.ts`

```typescript
/**
 * Media browser configuration for mediaBrowser and mediaGallery fields
 */
export interface MediaBrowserConfig {
  // Selection
  selectionMode?: 'single' | 'multiple';  // Default: 'single' for mediaBrowser, 'multiple' for mediaGallery
  maxFiles?: number;                      // Maximum files for mediaGallery (default: 10)

  // File filtering
  allowedTypes?: string[];                // MIME types (e.g., ['image/*', 'application/pdf'])
  allowedExtensions?: string[];           // Extensions (e.g., ['.jpg', '.png', '.pdf'])
  maxFileSize?: number;                   // Max file size in bytes (e.g., 5242880 = 5MB)

  // Folder access
  basePath?: string;                      // Starting folder (e.g., 'public', 'private/common', 'personal')
  allowFolderNavigation?: boolean;        // Allow navigating folders (default: true)
  restrictToPath?: boolean;               // Restrict to basePath only (default: false)
  allowedFolders?: string[];              // Specific folders user can access (e.g., ['public', 'private/common'])

  // Upload
  allowUpload?: boolean;                  // Allow uploading files (default: true)
  uploadPath?: string;                    // Upload destination (default: basePath)

  // UI
  viewMode?: 'grid' | 'list';            // Default view (default: 'grid')
  dialogSize?: 'md' | 'lg' | 'xl' | 'full';  // Dialog size (default: 'xl')
  showFolderTree?: boolean;               // Show folder tree sidebar (default: true)

  // Return value format
  returnFormat?: 'url' | 'key' | 'object';  // What to store in form (default: 'url')
  // 'url': "https://s3.../bucket/file.pdf"
  // 'key': "core/public/file.pdf"
  // 'object': { key, url, name, size, type, thumbnail }
}
```

### 1.3 Update FormField Interface

**File:** `/libs/types/form-types.ts`

```typescript
export interface FormField {
  fieldName: string;
  fieldType: FieldType;
  // ... existing properties ...

  // NEW: Media browser configuration
  mediaBrowserConfig?: MediaBrowserConfig;
}
```

### 1.4 Update ValidationRule

**File:** `/libs/types/form-types.ts`

```typescript
export interface ValidationRule {
  // ... existing properties ...

  // File validation
  fileSize?: number;                      // Max size in bytes
  fileTypes?: string[];                   // Allowed MIME types
  fileExtensions?: string[];              // Allowed extensions
  minFiles?: number;                      // Min files (for mediaGallery)
  maxFiles?: number;                      // Max files (for mediaGallery)

  // Image-specific
  imageMinWidth?: number;
  imageMaxWidth?: number;
  imageMinHeight?: number;
  imageMaxHeight?: number;
}
```

---

## Phase 2: Frontend Components (I will implement)

### 2.1 Create MediaBrowserDialog Component

**File:** `/libs/schema-forms/fields/MediaBrowserDialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui';
import { Button } from '@repo/ui';
import { FileBrowser, type MediaFile } from '@repo/media';
import { FolderTree, type FolderNode } from '@/components/media/FolderTree';
import type { MediaBrowserConfig } from '@repo/types';

interface MediaBrowserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: MediaFile[]) => void;
  config: MediaBrowserConfig;
  tenantId: string;
  appId: string;
  currentLanguage: string;
}

export function MediaBrowserDialog({
  isOpen,
  onClose,
  onSelect,
  config,
  tenantId,
  appId,
  currentLanguage,
}: MediaBrowserDialogProps) {
  const [selectedPath, setSelectedPath] = useState(config.basePath || 'public');
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  // Build folder tree (same as media module)
  const folderTree: FolderNode[] = buildFolderTree(config);

  const handleFileSelect = (file: MediaFile) => {
    if (config.selectionMode === 'single') {
      setSelectedFiles([file]);
    } else {
      // Toggle selection for multiple mode
      setSelectedFiles((prev) =>
        prev.some((f) => f.key === file.key)
          ? prev.filter((f) => f.key !== file.key)
          : [...prev, file]
      );
    }
  };

  const handleConfirm = () => {
    onSelect(selectedFiles);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={getDialogSize(config.dialogSize)}>
        <DialogHeader>
          <DialogTitle>Select Media File(s)</DialogTitle>
        </DialogHeader>

        {/* Same layout as media module */}
        <div className="flex h-[600px]">
          {/* Folder Tree Sidebar (if enabled) */}
          {config.showFolderTree !== false && (
            <div className="w-64 border-r border-gray-200 overflow-auto">
              <FolderTree
                folders={folderTree}
                selectedPath={selectedPath}
                onSelectFolder={setSelectedPath}
              />
            </div>
          )}

          {/* File Browser */}
          <div className="flex-1 overflow-auto">
            <FileBrowser
              app={appId}
              tenantId={tenantId}
              basePath={selectedPath}
              viewMode={config.viewMode || 'grid'}
              multiSelect={config.selectionMode === 'multiple'}
              onFileSelect={handleFileSelect}
              allowedTypes={config.allowedTypes}
              maxFileSize={config.maxFileSize}
              permissions={{
                canRead: true,
                canWrite: config.allowUpload !== false,
                canDelete: false,
                canCreateFolder: false,
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {selectedFiles.length > 0 && (
                <span>{selectedFiles.length} file(s) selected</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedFiles.length === 0}
              >
                Select
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2.2 Create MediaBrowserField Component

**File:** `/libs/schema-forms/fields/MediaBrowserField.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { X, File, Image as ImageIcon } from 'lucide-react';
import { MediaBrowserDialog } from './MediaBrowserDialog';
import type { MediaFile } from '@repo/media';
import type { MediaBrowserConfig, MultilingualText } from '@repo/types';
import { getLocalizedText } from '@repo/utils';

interface MediaBrowserFieldProps {
  value: string | string[] | Record<string, any> | Record<string, any>[];
  onChange: (value: any) => void;
  config: MediaBrowserConfig;
  label: MultilingualText;
  fieldName: string;
  error?: string;
  disabled?: boolean;
  tenantId: string;
  appId: string;
  currentLanguage: string;
}

export function MediaBrowserField({
  value,
  onChange,
  config,
  label,
  fieldName,
  error,
  disabled,
  tenantId,
  appId,
  currentLanguage,
}: MediaBrowserFieldProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Parse current value to display
  const displayFiles = parseValue(value, config.returnFormat);

  const handleSelect = (files: MediaFile[]) => {
    // Format value based on returnFormat
    const formattedValue = formatValue(files, config);
    onChange(formattedValue);
  };

  const handleRemove = (index: number) => {
    if (Array.isArray(displayFiles)) {
      const newFiles = displayFiles.filter((_, i) => i !== index);
      const formattedValue = formatValue(newFiles, config);
      onChange(formattedValue);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {getLocalizedText(label, currentLanguage)}
      </label>

      {/* Selected Files Preview */}
      {displayFiles && (
        <div className="space-y-2">
          {Array.isArray(displayFiles) ? (
            displayFiles.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => handleRemove(index)}
                disabled={disabled}
              />
            ))
          ) : (
            <FilePreview
              file={displayFiles}
              onRemove={() => onChange(null)}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Select Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
        className="w-full"
      >
        {displayFiles ? 'Change File(s)' : 'Select File(s)'}
      </Button>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Media Browser Dialog */}
      <MediaBrowserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelect}
        config={config}
        tenantId={tenantId}
        appId={appId}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}

// File preview component
function FilePreview({
  file,
  onRemove,
  disabled,
}: {
  file: any;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const isImage = file.type?.startsWith('image/');

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50">
      {/* Thumbnail/Icon */}
      <div className="w-12 h-12 flex-shrink-0">
        {isImage && file.thumbnail ? (
          <img
            src={file.thumbnail || file.url}
            alt={file.name}
            className="w-full h-full object-cover rounded"
          />
        ) : isImage ? (
          <ImageIcon className="w-full h-full text-gray-400" />
        ) : (
          <File className="w-full h-full text-gray-400" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Remove Button */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}

// Helper functions
function parseValue(value: any, returnFormat?: string): any {
  // Convert stored value back to display format
  // Implementation depends on returnFormat
}

function formatValue(files: MediaFile[], config: MediaBrowserConfig): any {
  const format = config.returnFormat || 'url';
  const isSingle = config.selectionMode === 'single';

  if (format === 'url') {
    return isSingle ? files[0]?.url : files.map((f) => f.url);
  } else if (format === 'key') {
    return isSingle ? files[0]?.key : files.map((f) => f.key);
  } else {
    // object format
    const fileObjects = files.map((f) => ({
      key: f.key,
      url: f.url,
      name: f.name,
      size: f.size,
      type: f.type,
      thumbnail: f.thumbnail,
    }));
    return isSingle ? fileObjects[0] : fileObjects;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFolderTree(config: MediaBrowserConfig): FolderNode[] {
  // Build folder tree based on config
  // Same structure as media module
}
```

### 2.3 Update FormFieldRenderer

**File:** `/libs/schema-forms/FormFieldRenderer.tsx`

```tsx
// Add import
import { MediaBrowserField } from './fields/MediaBrowserField';

// In switch statement
switch (field.fieldType) {
  // ... existing cases ...

  case 'mediaBrowser':
  case 'mediaGallery':
    return (
      <Controller
        control={control}
        name={field.fieldName}
        render={({ field: formField }) => (
          <MediaBrowserField
            value={formField.value}
            onChange={formField.onChange}
            config={{
              ...field.mediaBrowserConfig,
              selectionMode: field.fieldType === 'mediaGallery' ? 'multiple' : 'single',
            }}
            label={field.label}
            fieldName={field.fieldName}
            error={errors[field.fieldName]?.message as string}
            disabled={field.readonly || field.disabled}
            tenantId={tenantId}  // Pass from parent
            appId={appId}        // Pass from parent
            currentLanguage={currentLanguage}
          />
        )}
      />
    );
}
```

---

## Phase 3: Validation & Zod Schema

### 3.1 Update Zod Schema Generator

**File:** `/libs/schema-utils/src/zod-schema-generator.ts`

```typescript
case 'mediaBrowser':
  // Single file - string (URL/key) or object
  let singleSchema: z.ZodType;

  if (field.mediaBrowserConfig?.returnFormat === 'object') {
    singleSchema = z.object({
      key: z.string(),
      url: z.string(),
      name: z.string(),
      size: z.number(),
      type: z.string(),
      thumbnail: z.string().optional(),
    });
  } else {
    singleSchema = z.string().url('Invalid file URL');
  }

  // Add file type validation
  if (field.validationRule?.fileExtensions) {
    singleSchema = singleSchema.refine(
      (value) => validateFileExtension(value, field.validationRule.fileExtensions),
      {
        message: getLocalizedText(field.validationRule.errorMessage, 'en'),
      }
    );
  }

  return field.validationRule?.required
    ? singleSchema
    : singleSchema.nullable().optional();

case 'mediaGallery':
  // Multiple files - array
  const itemSchema = buildMediaItemSchema(field);
  let arraySchema = z.array(itemSchema);

  // Min/max files validation
  if (field.validationRule?.minFiles) {
    arraySchema = arraySchema.min(
      field.validationRule.minFiles,
      `At least ${field.validationRule.minFiles} file(s) required`
    );
  }

  if (field.validationRule?.maxFiles) {
    arraySchema = arraySchema.max(
      field.validationRule.maxFiles,
      `Maximum ${field.validationRule.maxFiles} file(s) allowed`
    );
  }

  return field.validationRule?.required
    ? arraySchema
    : arraySchema.optional();
```

---

## Example Usage

### Backend Schema:

```typescript
const studentSchema: FormField[] = [
  {
    fieldName: 'firstName',
    fieldType: 'text',
    label: { en: 'First Name', mm: 'အမည်' },
    validationRule: { required: true }
  },

  // Single image field
  {
    fieldName: 'profilePhoto',
    fieldType: 'mediaBrowser',
    label: { en: 'Profile Photo', mm: 'ကိုယ်တိုင်ပုံ' },
    mediaBrowserConfig: {
      selectionMode: 'single',
      allowedTypes: ['image/*'],
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
      maxFileSize: 5242880, // 5MB
      basePath: 'public',
      returnFormat: 'url',
      dialogSize: 'lg',
    },
    validationRule: {
      required: true,
      fileSize: 5242880,
      fileTypes: ['image/*'],
    }
  },

  // Multiple documents field
  {
    fieldName: 'supportingDocuments',
    fieldType: 'mediaGallery',
    label: { en: 'Documents', mm: 'စာရွက်များ' },
    mediaBrowserConfig: {
      selectionMode: 'multiple',
      maxFiles: 5,
      allowedTypes: ['application/pdf', 'image/*'],
      basePath: 'private/documents',
      returnFormat: 'object',
      dialogSize: 'xl',
    },
    validationRule: {
      minFiles: 1,
      maxFiles: 5,
    }
  }
];
```

### Stored Data:

```json
{
  "firstName": "John Doe",
  "profilePhoto": "https://s3.../crystal-image/core/public/photos/profile-123.jpg",
  "supportingDocuments": [
    {
      "key": "core/private/documents/transcript.pdf",
      "url": "https://s3.../transcript.pdf",
      "name": "transcript.pdf",
      "size": 245678,
      "type": "application/pdf"
    },
    {
      "key": "core/private/documents/id.jpg",
      "url": "https://s3.../id.jpg",
      "name": "id.jpg",
      "size": 145234,
      "type": "image/jpeg",
      "thumbnail": "https://s3.../id-thumb.jpg"
    }
  ]
}
```

---

## Implementation Checklist

### Phase 1: Backend (Your Team) - 2-4 hours
- [ ] Add `mediaBrowser` and `mediaGallery` to `FieldType` enum
- [ ] Create `MediaBrowserConfig` interface with all options
- [ ] Add `mediaBrowserConfig` property to `FormField`
- [ ] Update `ValidationRule` with file validation options
- [ ] Test schema definitions

### Phase 2: Frontend (Me) - 6-8 hours
- [ ] Create `MediaBrowserDialog` component (dialog wrapper)
- [ ] Create `MediaBrowserField` component (form field)
- [ ] Create `FilePreview` component (selected files display)
- [ ] Update `FormFieldRenderer` to handle new types
- [ ] Pass `tenantId` and `appId` through form context
- [ ] Add helper functions (parseValue, formatValue, etc.)

### Phase 3: Validation (Me) - 2-3 hours
- [ ] Update Zod schema generator for `mediaBrowser`
- [ ] Update Zod schema generator for `mediaGallery`
- [ ] Add file type validation
- [ ] Add file size validation
- [ ] Add min/max files validation

### Phase 4: Testing - 2-3 hours
- [ ] Test single file selection
- [ ] Test multiple file selection
- [ ] Test folder navigation
- [ ] Test file filtering (types, size)
- [ ] Test form submission
- [ ] Test validation errors

---

## Key Design Decisions

✅ **Reuse existing media module UI** - Same FileBrowser, FolderTree, all features
✅ **Dialog wrapper approach** - Embed media module in modal dialog
✅ **Same folder structure** - Public, Private, Personal folders
✅ **All existing features work** - Drag-drop move, edit, preview, thumbnails
✅ **Flexible return format** - URL, key, or full object
✅ **Configurable per field** - Each form field can have different config

---

## Timeline

| Phase | Time | Owner |
|-------|------|-------|
| 1. Backend schema | 2-4 hours | Your Team |
| 2. Frontend components | 6-8 hours | Me |
| 3. Validation | 2-3 hours | Me |
| 4. Testing | 2-3 hours | Both |
| **Total** | **12-18 hours** | |

---

**Ready to start?** Your backend team can begin Phase 1 (schema updates) and I'll implement Phase 2-3 once that's ready!
