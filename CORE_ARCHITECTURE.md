# Core Application Architecture Overview

## Executive Summary

The Core application (`/apps/core`) is a Next.js 15.4 enterprise resource planning system built with React 19, TypeScript, and a modular architecture. It uses **staticModules** as the primary pattern for implementing custom module experiences while maintaining a flexible fallback system for generic module handling.

---

## Directory Structure

```
apps/core/
├── src/
│   ├── app/                          # Next.js App Router routes
│   │   ├── [appId]/                  # Dynamic app routes
│   │   │   ├── [module]/             # Module list/dashboard routes
│   │   │   │   ├── page.tsx          # Module list page (with static module check)
│   │   │   │   ├── new/page.tsx      # Create new item (with static module check)
│   │   │   │   └── [id]/page.tsx     # Detail/edit page (with static module check)
│   │   │   ├── dashboard/
│   │   │   ├── media/
│   │   │   └── layout.tsx            # App-level layout
│   │   ├── api/                      # API routes
│   │   ├── dashboard/                # Public dashboard
│   │   └── layout.tsx                # Root layout
│   │
│   ├── staticModules/                # Custom module implementations
│   │   ├── cpms/                     # Student & Staff management
│   │   │   ├── students/             # Student module (REFERENCE IMPLEMENTATION)
│   │   │   │   ├── page.tsx          # List/dashboard
│   │   │   │   ├── new.tsx           # Create student
│   │   │   │   ├── detail.tsx        # Edit/view student
│   │   │   │   ├── actions/          # Server actions (empty, reserved)
│   │   │   │   ├── batch/            # Batch operations (empty, reserved)
│   │   │   │   ├── wizard/           # Multi-step forms (empty, reserved)
│   │   │   │   ├── detail/           # Detail view components (empty, reserved)
│   │   │   │   └── shared/           # Shared utilities (empty, reserved)
│   │   │   └── staffs/               # Staff module (placeholder)
│   │   ├── ctms/                     # Training management
│   │   ├── library/                  # Library module (empty)
│   │   └── core/                     # Core module (empty)
│   │
│   ├── components/
│   │   ├── modules/                  # Module-specific components
│   │   │   ├── ModuleDataTableWrapper.tsx         # Smart pagination router
│   │   │   ├── ModuleDataTableWithTimeout.tsx     # Client-side data fetching
│   │   │   ├── ClientSidePaginationWrapper.tsx    # Client pagination handler
│   │   │   ├── ServerSidePaginationWrapper.tsx    # Server pagination handler
│   │   │   ├── ModuleListPage.tsx                 # Generic module list component
│   │   │   └── [other module components]
│   │   ├── forms/                    # Form components
│   │   ├── layout/                   # Layout components
│   │   ├── ui/                       # shadcn/ui components
│   │   └── common/                   # Common components
│   │
│   ├── lib/
│   │   ├── layout-data.ts            # Core layout data fetching
│   │   ├── module-access-utils.ts    # Module access control
│   │   ├── auth-utils.ts             # Authentication utilities
│   │   ├── api-client.ts
│   │   ├── enable-multilang.ts
│   │   └── [other utilities]
│   │
│   ├── types/
│   │   ├── layout.ts                 # Layout-related types
│   │   └── library-dashboard.ts
│   │
│   ├── actions/
│   │   ├── media.ts
│   │   ├── media-url.ts
│   │   └── [server actions]
│   │
│   ├── config/
│   │   └── timeout-config.ts
│   │
│   ├── styles/
│   │   └── detail-view-print.css
│   │
│   └── middleware.ts                 # Request middleware
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
└── components.json                   # shadcn/ui config
```

---

## Core Concepts

### 1. Static Modules Pattern

**Definition**: Custom implementations of module pages that override the generic routing system.

**Purpose**: 
- Provide specialized UI/UX for specific modules
- Implement complex business logic
- Maintain backward compatibility with generic modules

**How It Works**:

1. Dynamic route handlers check for static module existence:
   ```
   /[appId]/[module]/page.tsx → checks for /staticModules/[appId]/[module]/page.tsx
   /[appId]/[module]/new/page.tsx → checks for /staticModules/[appId]/[module]/new.tsx
   /[appId]/[module]/[id]/page.tsx → checks for /staticModules/[appId]/[module]/detail.tsx
   ```

2. If static module exists, it's dynamically imported and used
3. If not found, falls back to generic module implementation

**File Structure**:
```
staticModules/
└── [appId]/
    └── [moduleName]/
        ├── page.tsx          # List/dashboard page (Server Component)
        ├── new.tsx           # Create form page (Client Component)
        ├── detail.tsx        # Edit/view page (Server Component for edit mode, client for create)
        ├── actions/          # Placeholder for custom server actions
        ├── batch/            # Placeholder for batch operations
        ├── wizard/           # Placeholder for wizard/multi-step forms
        ├── detail/           # Placeholder for detail view components
        └── shared/           # Placeholder for shared utilities
```

### 2. Routing Architecture

**Pattern**: Dynamic segment-based routing with auth checks

```
Dynamic Routes:
  /:appId                          → App dashboard
  /:appId/:module                  → Module list page
  /:appId/:module/new              → Create new item
  /:appId/:module/:id              → Edit/view item
  /:appId/:module/:id/view         → View-only mode
  /:appId/:module/deleted          → Recycle bin/deleted items
```

**Key Features**:
- Server-side authorization at every route
- Static module override support
- Fallback to generic module handling
- Error boundaries and 404 handling

### 3. Authentication & Authorization

**Three-tier security**:

1. **Application-level**: `requireAppAccess(appId)`
   - Checks user is authenticated
   - Validates app exists and is active
   - Confirms user has role-based access

2. **Module-level**: `requireModuleAccess(appId, moduleSlug)`
   - Extends app-level checks
   - Verifies module exists in schema
   - Checks module-level access permissions

3. **Operation-level**: `requireModuleOperationAccess(appId, moduleSlug, operation)`
   - Extends module-level checks
   - Validates specific operation (create, update, softDelete, hardDelete)
   - Used for operation-specific pages (new, edit)

**Access Control Files**:
- `lib/auth-utils.ts`: Route protection utilities
- `lib/module-access-utils.ts`: Role-based module filtering

### 4. Data Fetching Patterns

**Smart Pagination System** (ModuleDataTableWrapper):
- Detects pagination type from schema configuration
- Routes to appropriate wrapper:
  - Client-side pagination: Uses initialData, handles pagination in browser
  - Server-side pagination: Fetches on-demand, handles filtering server-side

**Server-side Fetching** (`[module]/page.tsx`):
```typescript
// Fetch with timeout (10 seconds)
const dataPromise = getModuleList('students', {})
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), 10000)
)
const moduleData = await Promise.race([dataPromise, timeoutPromise])
```

**Client-side Fallback** (ModuleDataTableWithTimeout):
- 15-20 second timeout with auto-retry
- Max 2 automatic retries with progressive delay
- Manual refresh button
- Detailed error handling and user feedback

### 5. Form Handling

**Two-tier Form System**:

1. **Generic Forms** (via FormWithLanguage):
   - Works for any module
   - Schema-driven field generation
   - Multi-language support built-in
   - Zod validation

2. **Static Module Forms** (in detail.tsx/new.tsx):
   - Custom implementation for complex modules
   - Can use FormWithLanguage or custom form components
   - Examples: StudentWizardForm, StaffForm

**Form Props**:
```typescript
<FormWithLanguage
  module={module}
  action="create" | "update"
  moduleSlug="students"
  initialData={data}
  itemId={id}
  isStudentWizardForm={true}  // Triggers special handling
  navigation={navigation}       // For next/prev navigation
  appId={appId}
  tenantId={tenant.tenantId}
  username={user.email}
/>
```

---

## Students Module (Reference Implementation)

### Overview
The students module is the primary reference implementation demonstrating best practices for creating a staticModule.

### File Breakdown

#### `page.tsx` (List Page - Server Component)
```typescript
// Purpose: Display student list/dashboard
// Mode: Server Component (can use server utilities)
// Auth: Checked by parent route

// Key Features:
// - Fetch module schema with permissions
// - Check pagination type (client vs server)
// - Fetch data with timeout for client-side pagination
// - Return appropriate wrapper component

export default async function StudentsListPage({ module, user, appId }: any) {
  const { appSchemaData } = await fetchLayoutData()
  const clientModule = appSchemaData.modules.find(m => m.slug === 'students')
  const userPermissions = getModulePermissions(module, user)
  
  if (isServerSidePaging) {
    return <ModuleDataTableWrapper initialData={[]} />
  }
  
  const moduleData = await getModuleList('students', {})
  return <ModuleDataTableWrapper initialData={moduleData} />
}
```

#### `new.tsx` (Create Page - Client Component)
```typescript
// Purpose: Create new student form
// Mode: Client Component (must use 'use client')
// Auth: Checked by parent route

// Key Features:
// - Client-side component for form interactivity
// - Uses FormWithLanguage for schema-driven form
// - Passes isStudentWizardForm flag for special handling
// - Can access tenant/user data from props

'use client'

export default function StudentsNewPage({ module, user, tenant, appId }: any) {
  return (
    <FormWithLanguage
      module={module}
      action="create"
      moduleSlug="students"
      isStudentWizardForm={true}
      appId={appId}
      tenantId={tenant.tenantId}
      username={user.email?.split('@')[0]}
    />
  )
}
```

#### `detail.tsx` (Edit/View Page - Server Component)
```typescript
// Purpose: Edit or view student details
// Mode: Server Component for edit, can have client wrapper for create
// Auth: Checked by parent route

// Key Features:
// - Determine if create or edit mode (itemId === 'new')
// - Fetch item data for edit mode
// - Fetch navigation data for prev/next navigation
// - Transform S3 media keys to signed URLs
// - Enable multilanguage support
// - Return FormWithLanguage with proper config

export default async function StudentsDetailPage({ 
  module, user, tenant, appId, itemId, searchParams 
}: any) {
  const isCreateMode = itemId === 'new'
  
  let initialData = null
  let navigation = undefined
  
  if (!isCreateMode) {
    const itemResponse = await getModuleItemWithNavigation(
      'students',
      itemId,
      { includeNavigation: true, sortBy: 'createdAt', sortOrder: 'desc' }
    )
    initialData = itemResponse.data
    navigation = itemResponse.navigation
    
    // Transform S3 keys to URLs
    initialData = await transformS3KeysToUrls(
      initialData,
      ['profilePhoto'],
      { tenantId: tenant.id, ... }
    )
  }
  
  const moduleWithMultilang = enableCommonMultilangFields(module)
  
  return (
    <FormWithLanguage
      module={moduleWithMultilang}
      action={isCreateMode ? 'create' : 'update'}
      initialData={initialData}
      moduleSlug="students"
      itemId={isCreateMode ? undefined : itemId}
      isStudentWizardForm={true}
      navigation={navigation}
      appId={appId}
    />
  )
}
```

### Key Patterns Used

1. **Multilanguage Support**:
   ```typescript
   const moduleWithMultilang = enableCommonMultilangFields(module)
   ```

2. **Media Handling** (S3 URLs):
   ```typescript
   initialData = await transformS3KeysToUrls(
     initialData,
     ['profilePhoto'],
     { tenantId, tenantSlug, tenantRootDomain, app: appId }
   )
   ```

3. **Navigation Context** (prev/next in list):
   ```typescript
   const itemResponse = await getModuleItemWithNavigation(
     'students',
     itemId,
     { includeNavigation: true, sortBy, sortOrder }
   )
   ```

4. **Permissions Management**:
   ```typescript
   const userPermissions = getModulePermissions(module, user)
   // Returns: { read, create, update, softDelete, hardDelete }
   ```

---

## Generic Module System (Fallback)

When no static module exists, the generic system handles it:

### Generic List Page (`[module]/page.tsx`)
- Uses `ModuleDataTableWrapper`
- Routes to `ClientSidePaginationWrapper` or `ServerSidePaginationWrapper`
- Displays generic data table with actions
- Supports search, filter, sort

### Generic Detail Page (`[module]/[id]/page.tsx`)
- Uses `FormWithLanguage` with automatic form type detection
- Supports wizard, student form, staff form layouts
- Handles validation and submission

### Generic New Page (`[module]/new/page.tsx`)
- Similar to detail but always in create mode
- Checks CREATE operation permission

---

## Key Components & Utilities

### Module Components

| Component | Purpose | Server/Client |
|-----------|---------|---------------|
| `ModuleDataTableWrapper` | Smart pagination router | Client |
| `ModuleDataTableWithTimeout` | Client-side fetching with timeout | Client |
| `ClientSidePaginationWrapper` | Paged display of loaded data | Client |
| `ServerSidePaginationWrapper` | Server-requested pagination | Client |
| `ModuleListPage` | Generic module list UI | Client |
| `ModuleDetailView` | Generic item detail view | Client |

### Utility Functions

**Authentication** (`lib/auth-utils.ts`):
- `requireAppAccess(appId)` - Check app access
- `requireModuleAccess(appId, moduleSlug)` - Check module access
- `requireModuleOperationAccess(appId, moduleSlug, operation)` - Check operation access

**Access Control** (`lib/module-access-utils.ts`):
- `filterModulesByUserAccess(modules, user)` - Filter visible modules
- `getModulePermissions(module, user)` - Get user permissions
- `hasModuleCreateAccess(module, user)` - Check create permission
- `hasModuleUpdateAccess(module, user)` - Check update permission

**Layout Data** (`lib/layout-data.ts`):
- `fetchLayoutData(appId)` - Get tenant, auth, app schema, filtered modules
- `generatePageMetadata(tenant)` - Generate page metadata

**Media** (`actions/media-url.ts`):
- `transformS3KeysToUrls(data, fields, config)` - Convert S3 keys to signed URLs

**Multilang** (`lib/enable-multilang.ts`):
- `enableCommonMultilangFields(module)` - Add multilanguage field support

---

## Creating a New Static Module (Library Module)

### Step-by-Step Guide

#### 1. Create Directory Structure
```bash
mkdir -p src/staticModules/library/{actions,batch,detail,wizard,shared}
```

#### 2. Create `page.tsx` (List Page)
```typescript
// src/staticModules/library/page.tsx
import { fetchLayoutData } from "@/lib/layout-data";
import { getModulePermissions } from "@/lib/module-access-utils";
import { getModuleList } from "@repo/app-modules";
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper";
import { notFound } from "next/navigation";

export default async function LibraryListPage({ module, user, appId }: any) {
  const { appSchemaData } = await fetchLayoutData();

  if (!appSchemaData?.modules) {
    notFound();
  }

  const clientModule = appSchemaData.modules.find(
    (mod: any) => mod.slug === "library"
  );

  if (!clientModule) {
    notFound();
  }

  const userPermissions = getModulePermissions(module, user);

  // Check pagination type
  const isServerSidePaging =
    clientModule.dataTableSchema?.pagination?.isClientSidePaging === false;

  if (isServerSidePaging) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <ModuleDataTableWrapper
          module={clientModule}
          initialData={[]}
          userPermissions={userPermissions}
        />
      </div>
    );
  }

  // Fetch data for client-side pagination
  let moduleData: any[] | null = null;
  let serverError = false;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Server timeout")), 10000);
    });

    const dataPromise = getModuleList("library", {});
    moduleData = (await Promise.race([dataPromise, timeoutPromise])) as any[];
  } catch (error) {
    console.error("Server-side data fetch failed for library:", error);
    serverError = true;
  }

  return (
    <div className="space-y-6">
      {serverError || !moduleData ? (
        <ModuleDataTableWithTimeout
          module={clientModule}
          searchParams={{}}
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
  );
}
```

#### 3. Create `new.tsx` (Create Page)
```typescript
// src/staticModules/library/new.tsx
"use client";

import { FormWithLanguage } from "@repo/schema-forms";

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
  );
}
```

#### 4. Create `detail.tsx` (Edit/View Page)
```typescript
// src/staticModules/library/detail.tsx
import { notFound } from 'next/navigation';
import { getModuleItemWithNavigation } from '@repo/app-modules';
import { FormWithLanguage } from '@repo/schema-forms';
import { enableCommonMultilangFields } from '@/lib/enable-multilang';

export default async function LibraryDetailPage({ 
  module, user, tenant, appId, itemId, searchParams 
}: any) {
  const isCreateMode = itemId === 'new';

  let initialData = null;
  let navigation = undefined;

  if (!isCreateMode) {
    try {
      const sortBy = (searchParams.sortBy as string) || 'createdAt';
      const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'desc';

      const itemResponse = await getModuleItemWithNavigation(
        'library',
        itemId,
        {
          includeNavigation: true,
          sortBy,
          sortOrder
        }
      );

      initialData = itemResponse.data;
      navigation = itemResponse.navigation;
    } catch (error) {
      console.error('Failed to fetch library item:', error);
      notFound();
    }
  }

  const moduleWithMultilang = enableCommonMultilangFields(module);

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
  );
}
```

#### 5. (Optional) Create Shared Utilities
```typescript
// src/staticModules/library/shared/library-utils.ts
// Add library-specific utilities here

export function formatLibraryData(data: any) {
  // Custom formatting logic
  return data;
}
```

---

## Type Definitions

### Module Schema Types
```typescript
interface ModuleSchema {
  id: string
  name: LocalizedText
  slug: string
  serviceName: string
  description: LocalizedText
  iconName: string
  
  // UI Configuration
  formLayout: 'wizard-vertical' | 'wizard-horizontal' | 'studentForm' | 'staffWizardForm' | string
  formFields: FormFieldSchema[]
  dataTableSchema: DataTableSchema
  detailViewSchema: any
  
  // Access Control (server-side only)
  moduleAccessPolicy?: ModuleAccessPolicy
}

interface ModulePermissions {
  read: boolean
  create: boolean
  update: boolean
  softDelete: boolean
  hardDelete: boolean
}

interface DataTableSchema {
  columns: DataTableColumn[]
  layout: 'standard' | 'withCheckbox'
  pagination: {
    isClientSidePaging: boolean
    pageSize: number
  }
}
```

---

## Development Workflow

### 1. Understanding Module Requirements
- Identify module name and appId
- Review module schema in app-modules library
- Check form fields and data table configuration

### 2. Creating Static Module
- Create directory in `staticModules/[appId]/[moduleName]/`
- Implement `page.tsx`, `new.tsx`, `detail.tsx`
- Use students module as reference

### 3. Custom Components (Optional)
- Create components in `staticModules/[appId]/[moduleName]/detail/`
- Create utilities in `staticModules/[appId]/[moduleName]/shared/`
- Create server actions in `staticModules/[appId]/[moduleName]/actions/`

### 4. Testing
- Access via: `http://app.um1ygn.edu.mm/cpms/[module]/new`
- Verify auth checks work
- Test data fetching and timeout handling
- Test form submission

---

## Important Patterns & Best Practices

### 1. Always Check for Static Modules First
The parent routes automatically check for static modules before falling back to generic handling.

### 2. Use Server Components by Default
- List pages should be Server Components
- Detail/edit pages should be Server Components
- Form components can be Client Components

### 3. Handle Errors Gracefully
- Use `notFound()` for missing data
- Catch and log errors with context
- Provide user feedback via toasts

### 4. Implement Timeout Handling
```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Timeout')), 10000)
})
const data = await Promise.race([fetchPromise, timeoutPromise])
```

### 5. Use Middleware Data Safely
- Cache values to prevent multiple calls
- Handle missing auth/tenant data gracefully
- Never log sensitive information

### 6. Respect Authorization at Every Level
- Check app access
- Check module access
- Check operation access
- Don't expose sensitive policies to client

### 7. Implement Proper Pagination
- Use schema to determine pagination type
- Route to appropriate component
- Pass initialData only when available

---

## Common Gotchas

1. **Static Module Not Loading**: Ensure path is exactly `staticModules/[appId]/[module]/[page].tsx`

2. **Auth Not Checked**: Parent routes handle auth, but always verify in your component

3. **Data Not Fetching**: Check pagination type; may be server-side (empty initialData)

4. **S3 URLs Not Displaying**: Use `transformS3KeysToUrls` action to convert keys to signed URLs

5. **Form Not Submitting**: Ensure `moduleSlug` prop matches actual module slug exactly

6. **Navigation Not Working**: Pass `navigation` prop from `getModuleItemWithNavigation` result

---

## Links to Related Files

- **Routing**: `/apps/core/src/app/[appId]/[module]/page.tsx`
- **Auth**: `/apps/core/src/lib/auth-utils.ts`
- **Access Control**: `/apps/core/src/lib/module-access-utils.ts`
- **Components**: `/apps/core/src/components/modules/`
- **Reference Module**: `/apps/core/src/staticModules/cpms/students/`

