# Media Library - Hidden Files Feature

## ✅ Implementation Complete

The media library now automatically hides files and folders that start with a dot (`.`).

## What Gets Hidden

### Hidden Files
Files starting with `.` are filtered out from the file browser:

```
.keep           ← Hidden
.hidden-test    ← Hidden
.DS_Store       ← Hidden (macOS)
.gitkeep        ← Hidden
```

### Hidden Folders
Folders starting with `.` are also filtered out:

```
.git/           ← Hidden
.vscode/        ← Hidden
.idea/          ← Hidden
```

### Visible Files
Regular files are shown normally:

```
Photo.jpg       ← Visible ✅
test.txt        ← Visible ✅
document.pdf    ← Visible ✅
logo.png        ← Visible ✅
```

## Implementation

### Code Location
**File:** `libs/s3/src/client/tenant-s3-client.ts`

**Method:** `listObjects()`

### Implementation Logic

```typescript
async listObjects(relativePath: string = ''): Promise<S3ListResult> {
  // ... fetch objects from S3 ...

  // Filter out hidden files/folders (starting with ".")
  const isHidden = (name: string) => {
    const fileName = name.split('/').pop() || name;
    return fileName.startsWith('.');
  };

  return {
    objects: result.objects
      .map(obj => ({ ...obj, key: stripPrefix(obj.key) }))
      .filter(obj => !isHidden(obj.key)), // Hide files starting with "."

    folders: result.folders
      .map(folder => stripPrefix(folder))
      .filter(folder => !isHidden(folder)), // Hide folders starting with "."

    prefix: stripPrefix(result.prefix),
    continuationToken: result.continuationToken,
  };
}
```

### How It Works

1. **Fetch all objects** from S3 (including hidden files)
2. **Extract filename** from the full path:
   ```typescript
   'core/public/.keep' → '.keep'
   'core/public/Photo.jpg' → 'Photo.jpg'
   ```
3. **Check if starts with dot**:
   ```typescript
   '.keep'.startsWith('.') → true (hidden)
   'Photo.jpg'.startsWith('.') → false (visible)
   ```
4. **Filter out hidden files** before returning results

## Why Hide These Files?

### System Files
Files like `.keep`, `.gitkeep` are used for folder structure but shouldn't be visible to users:

```bash
# These files are used to force git to track empty folders
core/public/.keep
core/private/common/.keep
```

### OS Metadata
Operating system files that aren't meant to be seen:

```bash
.DS_Store       # macOS folder settings
Thumbs.db       # Windows thumbnail cache
desktop.ini     # Windows folder config
```

### Development Files
Development environment files:

```bash
.vscode/        # VS Code settings
.idea/          # IntelliJ settings
.git/           # Git repository
```

## Testing

### Current Files in Bucket

```bash
# All files (via mc CLI)
mc ls myminio/um1ygn/core/public/

[2025-10-27 15:46:11 +0630]    12B .hidden-test.txt  ← Hidden
[2025-10-27 15:44:49 +0630]     0B .keep             ← Hidden
[2025-10-27 15:44:07 +0630] 164KiB Photo.jpg         ← Visible
[2025-10-27 15:38:27 +0630]    17B test-public.txt   ← Visible
[2025-10-27 15:10:31 +0630]    43B test.txt          ← Visible
[2025-10-27 15:46:11 +0630]    13B visible-test.txt  ← Visible
```

### API Response (After Filtering)

```json
{
  "files": [
    {
      "key": "Photo.jpg",
      "name": "Photo.jpg",
      "size": 167936,
      "type": "image/jpeg",
      "url": "https://storage.um1ygn.edu.mm/um1ygn/core/public/Photo.jpg"
    },
    {
      "key": "test-public.txt",
      "name": "test-public.txt",
      "size": 17,
      "type": "text/plain",
      "url": "https://storage.um1ygn.edu.mm/um1ygn/core/public/test-public.txt"
    },
    {
      "key": "test.txt",
      "name": "test.txt",
      "size": 43,
      "type": "text/plain",
      "url": "https://storage.um1ygn.edu.mm/um1ygn/core/public/test.txt"
    },
    {
      "key": "visible-test.txt",
      "name": "visible-test.txt",
      "size": 13,
      "type": "text/plain",
      "url": "https://storage.um1ygn.edu.mm/um1ygn/core/public/visible-test.txt"
    }
  ],
  "folders": [],
  "total": 4
}
```

**Notice:** `.keep` and `.hidden-test.txt` are NOT in the response! ✅

## Edge Cases Handled

### 1. Files with Dots in Middle
```
my.document.pdf     ← Visible (dot not at start)
report.2024.xlsx    ← Visible (dot not at start)
```

### 2. Hidden Files in Subdirectories
```
documents/.hidden   ← Hidden
documents/report    ← Visible
```

### 3. Folders vs Files
```
.git/               ← Hidden folder
.gitignore          ← Hidden file
git-branch.txt      ← Visible (dot not at start)
```

## Benefits

### User Experience
- ✅ Cleaner file browser
- ✅ No clutter from system files
- ✅ Focuses on user content

### Security
- ✅ Hides `.env` files (if accidentally uploaded)
- ✅ Hides `.git` folder (if present)
- ✅ Hides sensitive config files

### Performance
- ✅ Fewer items to render
- ✅ Faster UI rendering
- ✅ Less visual noise

## Future Enhancements

### Option 1: Show/Hide Toggle
Add option to show hidden files for admins:

```typescript
interface ListObjectsOptions {
  showHidden?: boolean; // Default: false
}

async listObjects(
  relativePath: string,
  options?: ListObjectsOptions
): Promise<S3ListResult> {
  const showHidden = options?.showHidden || false;

  // Skip filter if showHidden is true
  if (showHidden) {
    return allObjects;
  }

  return filteredObjects;
}
```

### Option 2: Custom Filter Patterns
Allow configuration of what to hide:

```typescript
const HIDDEN_PATTERNS = [
  /^\./,              // Starts with dot
  /^~.*/,             // Starts with tilde (backup files)
  /\.tmp$/,           // Ends with .tmp
  /\.bak$/,           // Ends with .bak
];
```

### Option 3: Admin Override
Let organization admins see all files:

```typescript
const canSeeHidden = userContext.roles.includes('organizationAdmin');
if (!canSeeHidden) {
  // Filter hidden files
}
```

## Configuration

Currently, the behavior is:
- **Always enabled** - Hidden files are always filtered
- **No configuration needed** - Works automatically
- **Applies to all users** - Everyone sees the same filtered view

To change this behavior, modify the `listObjects` method in:
```
libs/s3/src/client/tenant-s3-client.ts
```

## Summary

| Aspect | Details |
|--------|---------|
| **What's Hidden** | Files/folders starting with `.` |
| **Examples** | `.keep`, `.DS_Store`, `.git/` |
| **Where Applied** | All list operations in file browser |
| **Can Override?** | No (currently always on) |
| **Performance Impact** | Minimal (simple string check) |
| **User Visible?** | No (transparent filtering) |

**Result:** Clean, professional file browser without system clutter! ✨
