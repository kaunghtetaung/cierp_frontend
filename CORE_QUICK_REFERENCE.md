# Core Application - Quick Reference Guide

## File Locations at a Glance

```
/apps/core/src/

ROUTING & AUTH
├── app/[appId]/[module]/page.tsx           ← List page (checks for static module)
├── app/[appId]/[module]/new/page.tsx       ← Create page (checks for static module)
├── app/[appId]/[module]/[id]/page.tsx      ← Detail page (checks for static module)
├── lib/auth-utils.ts                       ← Auth checking utilities
├── lib/module-access-utils.ts              ← Access control logic
└── lib/layout-data.ts                      ← Layout data fetching

STATIC MODULES
├── staticModules/cpms/students/            ← REFERENCE IMPLEMENTATION
│   ├── page.tsx                            ← List view
│   ├── new.tsx                             ← Create form
│   ├── detail.tsx                          ← Edit/view form
│   ├── actions/                            ← (Reserved for server actions)
│   ├── batch/                              ← (Reserved for batch ops)
│   ├── detail/                             ← (Reserved for detail components)
│   ├── shared/                             ← (Reserved for utilities)
│   └── wizard/                             ← (Reserved for multi-step forms)
└── staticModules/library/                  ← NEW MODULE TO CREATE

COMPONENTS
├── components/modules/
│   ├── ModuleDataTableWrapper.tsx          ← Smart router (client/server pagination)
│   ├── ModuleDataTableWithTimeout.tsx      ← Timeout handling & retry
│   ├── ClientSidePaginationWrapper.tsx     ← Client-side pagination logic
│   ├── ServerSidePaginationWrapper.tsx     ← Server-side pagination logic
│   └── ModuleListPage.tsx                  ← Generic list UI
├── components/forms/
│   └── FormWithLanguage.tsx                ← Schema-driven forms (multilang)
└── components/ui/                          ← shadcn/ui components
```

---

## Key Functions Quick Reference

### Authentication & Authorization

```typescript
// File: lib/auth-utils.ts

// Route protection (use in Server Components)
await requireAppAccess(appId)
  → { user, tenant } or redirect

await requireModuleAccess(appId, moduleSlug)
  → { user, tenant, module } or redirect

await requireModuleOperationAccess(appId, moduleSlug, 'create'|'update'|'delete')
  → { user, tenant, module } or redirect

// Validation (no redirect)
await validateAppAccess(appId)
  → { isAuthorized, user, tenant, appId, error? }
```

### Module Access Control

```typescript
// File: lib/module-access-utils.ts

// Get permissions object
getModulePermissions(module, user)
  → { read, create, update, softDelete, hardDelete }

// Check specific operations
hasModuleCreateAccess(module, user) → boolean
hasModuleUpdateAccess(module, user) → boolean
hasModuleSoftDeleteAccess(module, user) → boolean
hasModuleHardDeleteAccess(module, user) → boolean

// Filter modules by user access
filterModulesByUserAccess(modules, user)
  → filtered Module[] (only accessible ones)
```

### Layout & Schema Data

```typescript
// File: lib/layout-data.ts

// Get all layout data (cached per appId)
await fetchLayoutData(appId?)
  → {
      middlewareData,    // Language, appId, etc.
      tenant,            // Tenant settings
      tenantError,       // Tenant error message
      appSchemaData,     // Module schemas (filtered by access)
      authData,          // User & session info
      filteredApps,      // Apps user can access
      currentAppAccess   // Current app access info
    }
```

### Data Fetching

```typescript
// File: @repo/app-modules (external library)

// Fetch module list
getModuleList(moduleSlug, searchParams?)
  → Promise<any[]>

// Fetch single item with navigation
getModuleItemWithNavigation(moduleSlug, itemId, options)
  → Promise<{ data, navigation }>

// Submit form data
submitModuleForm(moduleSlug, action, data)
  → Promise<result>
```

### Media Handling

```typescript
// File: actions/media-url.ts

// Transform S3 keys to signed URLs
await transformS3KeysToUrls(
  data,                                    // Object with media keys
  ['profilePhoto', 'document'],            // Field names to transform
  { tenantId, tenantSlug, tenantRootDomain, app: appId }
)
  → Transformed object with URLs
```

### Multilanguage

```typescript
// File: lib/enable-multilang.ts

// Enable multilang for common fields
enableCommonMultilangFields(module)
  → Module with multilang-enabled fields
```

---

## Component Props Reference

### FormWithLanguage (Main Form Component)

```typescript
<FormWithLanguage
  module={ModuleSchema}              // Module configuration
  action="create" | "update"         // Operation mode
  moduleSlug="students"              // Module identifier
  initialData={object}               // Existing data (for edit)
  itemId={string}                    // Item ID (for edit)
  isStudentWizardForm={boolean}      // Special handling flag
  isWizard={boolean}                 // Wizard layout
  isStudentForm={boolean}            // Student form layout
  isStaffWizardForm={boolean}        // Staff wizard layout
  navigation={navigation}            // Prev/next navigation
  appId={string}                     // App context
  tenantId={string}                  // Tenant context
  username={string}                  // Current user name
/>
```

### ModuleDataTableWrapper (List Router)

```typescript
<ModuleDataTableWrapper
  module={ModuleSchema}              // Module configuration
  initialData={any[]}                // Data loaded from server
  userPermissions={{                 // User's permissions
    read: boolean,
    create: boolean,
    update: boolean,
    softDelete: boolean,
    hardDelete: boolean
  }}
/>
```

### ModuleDataTableWithTimeout (Client Fetch with Retry)

```typescript
<ModuleDataTableWithTimeout
  module={ModuleSchema}              // Module configuration
  initialData={any[]}                // Optional initial data
  searchParams={Record}              // Search/filter params
  userPermissions={permissions}      // User permissions
/>
```

---

## Static Module Template (Checklist)

```typescript
// ✓ 1. page.tsx (List Page)
import { fetchLayoutData } from "@/lib/layout-data"
import { getModulePermissions } from "@/lib/module-access-utils"
import { getModuleList } from "@repo/app-modules"
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper"
import { ModuleDataTableWithTimeout } from "@/components/modules/ModuleDataTableWithTimeout"
import { notFound } from "next/navigation"

export default async function LibraryListPage({ module, user, appId }: any) {
  // Fetch layout data
  const { appSchemaData } = await fetchLayoutData()
  const clientModule = appSchemaData.modules.find(m => m.slug === "library")
  if (!clientModule) notFound()
  
  // Get permissions
  const userPermissions = getModulePermissions(module, user)
  
  // Check pagination type
  const isServerSidePaging = 
    clientModule.dataTableSchema?.pagination?.isClientSidePaging === false
  
  if (isServerSidePaging) {
    return <ModuleDataTableWrapper module={clientModule} initialData={[]} />
  }
  
  // Fetch data with timeout
  let moduleData = null, serverError = false
  try {
    const timeout = new Promise((_, r) => 
      setTimeout(() => r(new Error('timeout')), 10000)
    )
    moduleData = await Promise.race([
      getModuleList("library", {}),
      timeout
    ])
  } catch (error) {
    serverError = true
  }
  
  return (
    <div className="space-y-6">
      {serverError || !moduleData ? (
        <ModuleDataTableWithTimeout 
          module={clientModule}
          userPermissions={userPermissions}
        />
      ) : (
        <ModuleDataTableWrapper 
          module={clientModule}
          initialData={moduleData}
          userPermissions={userPermissions}
        />
      )}
    </div>
  )
}


// ✓ 2. new.tsx (Create Page)
"use client"

import { FormWithLanguage } from "@repo/schema-forms"

export default function LibraryNewPage({ module, user, tenant, appId }: any) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <FormWithLanguage
        module={module}
        action="create"
        moduleSlug="library"
        appId={appId}
        tenantId={tenant.tenantId}
        username={user.email?.split('@')[0] || user.id}
      />
    </div>
  )
}


// ✓ 3. detail.tsx (Edit/View Page)
import { notFound } from 'next/navigation'
import { getModuleItemWithNavigation } from '@repo/app-modules'
import { FormWithLanguage } from '@repo/schema-forms'
import { enableCommonMultilangFields } from '@/lib/enable-multilang'

export default async function LibraryDetailPage({
  module, user, tenant, appId, itemId, searchParams
}: any) {
  const isCreateMode = itemId === 'new'
  
  let initialData = null, navigation = undefined
  
  if (!isCreateMode) {
    try {
      const itemResponse = await getModuleItemWithNavigation(
        'library',
        itemId,
        {
          includeNavigation: true,
          sortBy: searchParams.sortBy || 'createdAt',
          sortOrder: searchParams.sortOrder || 'desc'
        }
      )
      initialData = itemResponse.data
      navigation = itemResponse.navigation
    } catch (error) {
      console.error('Failed to fetch item:', error)
      notFound()
    }
  }
  
  const moduleWithMultilang = enableCommonMultilangFields(module)
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <FormWithLanguage
        module={moduleWithMultilang}
        action={isCreateMode ? 'create' : 'update'}
        initialData={initialData}
        moduleSlug="library"
        itemId={isCreateMode ? undefined : itemId}
        navigation={navigation}
        appId={appId}
      />
    </div>
  )
}
```

---

## Routing Path Reference

### Access URLs (from route params)

```
/cpms/students
  └─ Calls: app/[appId]/[module]/page.tsx
     Params: appId='cpms', module='students'
     Checks for: staticModules/cpms/students/page.tsx
     Falls back to: Generic module list page

/cpms/students/new
  └─ Calls: app/[appId]/[module]/new/page.tsx
     Params: appId='cpms', module='students'
     Checks for: staticModules/cpms/students/new.tsx
     Falls back to: Generic create form

/cpms/students/abc123
  └─ Calls: app/[appId]/[module]/[id]/page.tsx
     Params: appId='cpms', module='students', id='abc123'
     Checks for: staticModules/cpms/students/detail.tsx
     Falls back to: Generic edit/view page

/cpms/library
  └─ WILL NOT FIND staticModules/cpms/library/
     WILL FALL BACK to: Generic module list
     (Library module is empty, uses generic handling)
```

### Static Module Path Structure

```
Real Paths:
  src/staticModules/[appId]/[moduleName]/page.tsx
  src/staticModules/[appId]/[moduleName]/new.tsx
  src/staticModules/[appId]/[moduleName]/detail.tsx

Dynamic Import Alias (in page.tsx):
  @/staticModules/[appId]/[moduleName]/page
  @/staticModules/[appId]/[moduleName]/new
  @/staticModules/[appId]/[moduleName]/detail
```

---

## Timeout & Error Handling Patterns

### Server-side Fetch (in page.tsx)

```typescript
try {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Server timeout')), 10000)
  )
  
  const dataPromise = getModuleList('students', {})
  const data = await Promise.race([dataPromise, timeoutPromise])
  
} catch (error) {
  // Fall back to client-side fetching
  serverError = true
}
```

### Client-side Fetch (ModuleDataTableWithTimeout)

```typescript
// Built-in:
// - 15-20 second timeout
// - Auto-retry up to 2 times with backoff
// - Manual "Try Again" button
// - Detailed error messages
// - Network status indication
```

---

## Type Imports

```typescript
// Core types
import type { ModuleSchema, User, TenantSettings } from '@repo/types'

// Layout types
import type { 
  ClientModule, ModulePermissions, LayoutData,
  AppSchemaData, ClientAppSchemaData
} from '@/types/layout'

// Auth results
import type { AppAuthResult } from '@/lib/auth-utils'

// Form types
import type { FormFieldSchema } from '@repo/types'

// Table types  
import type { DataTableSchema, DataTableColumn } from '@repo/types'
```

---

## Environment & Configuration

### URLs
- **App**: `http://app.um1ygn.edu.mm` (DNS-based, not localhost)
- **Students Module**: `http://app.um1ygn.edu.mm/cpms/students`
- **Create Student**: `http://app.um1ygn.edu.mm/cpms/students/new`
- **Edit Student**: `http://app.um1ygn.edu.mm/cpms/students/abc123`

### Port
- Core app runs on **port 3001** (internally)
- Accessed via **port 80** (external, via DNS)

### Key Config Files
- `next.config.js` - Image optimization, security headers
- `tsconfig.json` - Path aliases (@/*, @repo/*)
- `tailwind.config.ts` - Styling configuration
- `.env` - Environment variables

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Module not loading | Static module path wrong | Check exact path: `staticModules/[appId]/[module]/(page\|new\|detail).tsx` |
| 404 Not Found | Module doesn't exist | Create static module files or ensure generic module exists |
| Auth redirect | No session | Check middleware sends session ID in headers |
| Timeout | Slow API | Increase timeout in page.tsx (currently 10s) |
| Data not loading | Server-side paging | Check schema `isClientSidePaging: false`, empty initialData expected |
| Form not submitting | Module slug mismatch | Ensure `moduleSlug` prop matches actual module slug |
| S3 URLs not showing | S3 keys not transformed | Use `transformS3KeysToUrls` action in detail.tsx |
| Multilang not working | Module not enabled | Call `enableCommonMultilangFields(module)` |

---

## Development Checklist

- [ ] Create directory: `src/staticModules/library/`
- [ ] Create `page.tsx` with server-side fetching
- [ ] Create `new.tsx` with form
- [ ] Create `detail.tsx` with item fetch + form
- [ ] Test list view at `/cpms/library`
- [ ] Test create at `/cpms/library/new`
- [ ] Test edit at `/cpms/library/[id]`
- [ ] Verify auth checks work
- [ ] Test timeout handling
- [ ] Test form submission
- [ ] Verify permissions display
- [ ] Check multilanguage support
- [ ] Test media/S3 URLs (if applicable)
- [ ] Verify navigation buttons (if using navigation data)
- [ ] Test on actual domain (app.um1ygn.edu.mm)

