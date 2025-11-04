# @repo/media

React components and hooks for file browsing and media management with S3 storage.

## Features

- **File Browser**: Full-featured file browser with grid/list views
- **File Picker**: Modal dialog for selecting files in forms
- **React Hook Form Integration**: Field component with validation
- **Upload**: Drag & drop upload with progress tracking
- **Multi-select**: Select multiple files for batch operations
- **Type-Safe**: Full TypeScript support

## Installation

Already included in the monorepo workspace.

## Components

### FileBrowser

Full-featured file browser for dedicated media pages:

```tsx
import { FileBrowser } from '@repo/media';

<FileBrowser
  tenantId="tenant-123"
  app="core"
  basePath="public"
  permissions={{
    canRead: true,
    canWrite: true,
    canDelete: true,
    canCreateFolder: true,
  }}
  multiSelect={true}
  viewMode="grid"
  onFileSelect={(file) => console.log(file)}
/>
```

### FilePickerModal

Modal dialog for file selection:

```tsx
import { FilePickerModal } from '@repo/media';

<FilePickerModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(file) => setValue('logo', file.url)}
  basePath="public/logos"
  accept="image/*"
  multiSelect={false}
/>
```

### FilePickerField

React Hook Form integration:

```tsx
import { useForm } from 'react-hook-form';
import { FilePickerField } from '@repo/media';

const { control } = useForm();

<FilePickerField
  control={control}
  name="logo"
  label="Company Logo"
  basePath="public/logos"
  accept="image/*"
  required
  helperText="Select a logo image"
/>
```

## Hooks

### useFileBrowser

Manage file operations:

```tsx
import { useFileBrowser } from '@repo/media';

const browser = useFileBrowser({
  config: { apiBasePath: '/api/media', tenantId: 't1', app: 'core' },
  basePath: 'public',
  autoLoad: true,
});

// State
browser.files // Current files
browser.folders // Current folders
browser.currentPath // Current path
browser.isLoading // Loading state
browser.selectedFiles // Selected files

// Actions
await browser.loadFiles()
await browser.uploadFiles(files)
await browser.deleteFiles(keys)
await browser.createFolder(name)
browser.navigateToFolder(name)
browser.navigateUp()
browser.selectFile(file)
browser.toggleFileSelection(file)
```

### useFileUpload

Handle file uploads with validation:

```tsx
import { useFileUpload } from '@repo/media';

const upload = useFileUpload({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/*', '.pdf'],
  onUpload: async (files) => {
    // Handle upload
  },
});

// Usage
<div
  onDrop={upload.handleDrop}
  onDragOver={upload.handleDragOver}
  onDragLeave={upload.handleDragLeave}
>
  Drop files here
</div>

<input
  type="file"
  onChange={upload.handleFileSelect}
  accept="image/*"
/>
```

## API Routes

Required Next.js API routes (already created in `/apps/core/src/app/api/media/`):

```typescript
GET    /api/media/list         - List files and folders
POST   /api/media/upload       - Upload file
DELETE /api/media/delete       - Delete files
POST   /api/media/create-folder - Create folder
POST   /api/media/rename       - Rename file
POST   /api/media/move         - Move files
```

## Examples

### Dedicated Media Page

```tsx
// app/media/page.tsx
import { FileBrowser } from '@repo/media';

export default function MediaPage() {
  return (
    <div className="h-screen p-6">
      <h1>Media Library</h1>
      <FileBrowser
        tenantId="tenant-123"
        app="core"
        basePath="public"
        permissions={{ canRead: true, canWrite: true, canDelete: true, canCreateFolder: true }}
        multiSelect={true}
      />
    </div>
  );
}
```

### Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { FilePickerField } from '@repo/media';

function MyForm() {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log('Logo URL:', data.logo);
    console.log('Documents:', data.documents);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Single file */}
      <FilePickerField
        control={control}
        name="logo"
        label="Logo"
        basePath="public/logos"
        accept="image/*"
        required
      />

      {/* Multiple files */}
      <FilePickerField
        control={control}
        name="documents"
        label="Documents"
        basePath="private/documents"
        accept=".pdf,.doc,.docx"
        multiple
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Component Props

### FileBrowserProps

```typescript
interface FileBrowserProps {
  tenantId: string;
  app: 'core' | 'publicWeb';
  basePath: string;
  permissions?: MediaPermissions;
  allowedTypes?: string[];
  maxFileSize?: number;
  viewMode?: 'grid' | 'list';
  onFileSelect?: (file: MediaFile) => void;
  multiSelect?: boolean;
  apiBasePath?: string;
}
```

### FilePickerModalProps

```typescript
interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile | MediaFile[]) => void;
  basePath: string;
  accept?: string;
  multiSelect?: boolean;
  title?: string;
}
```

### FilePickerFieldProps

```typescript
interface FilePickerFieldProps {
  control: any; // React Hook Form control
  name: string;
  label?: string;
  basePath: string;
  accept?: string;
  required?: boolean;
  helperText?: string;
  multiple?: boolean;
}
```

## Styling

Components use Tailwind CSS classes and are compatible with shadcn/ui. Customize by:

1. Wrapping components in your own styled containers
2. Using Tailwind's theme configuration
3. Overriding specific component classes

## Related Libraries

- `@repo/s3` - S3 storage integration
- `@repo/ui` - UI components (shadcn/ui)
- `react-hook-form` - Form management

## Demo Pages

See example implementations:

- `/apps/core/src/app/media/page.tsx` - Full file browser
- `/apps/core/src/app/media/form-example/page.tsx` - Form integration
