# CPMS Students Module Architecture

## Current Structure
```
/[appId]/[module]  →  /cpms/students
```

Your routes look like:
- `/cpms/students` - Student list
- `/cpms/students/new` - Create student
- `/cpms/users` - Users list (generic)
- `/cpms/roles` - Roles list (generic)

## Solution: Conditional Rendering Based on Module Type

Since you're using dynamic routes, we'll use **conditional rendering** within the existing route structure.

---

## Architecture

### Directory Structure (No Changes Needed)

```
apps/core/src/
├── app/
│   └── [appId]/
│       └── [module]/
│           ├── page.tsx                    ← Add conditional logic here
│           ├── new/
│           │   └── page.tsx                ← Add conditional logic here
│           └── [id]/
│               └── page.tsx                ← Add conditional logic here
│
└── components/
    ├── modules/
    │   ├── ModuleDataTableWrapper.tsx      ← Generic (existing)
    │   └── GenericFormWrapper.tsx          ← Generic (existing)
    │
    └── students/                            ← NEW: Student-specific components
        ├── StudentModuleLayout.tsx          ← Custom list with submenus
        ├── StudentNewPage.tsx               ← Wizard or submenu selection
        ├── StudentDetailPage.tsx            ← Custom detail with tabs
        ├── StudentRegistrationWizard.tsx
        ├── StudentBatchUpload.tsx
        └── StudentActions.tsx
```

---

## Implementation

### 1. Update Module List Page

**File:** `apps/core/src/app/[appId]/[module]/page.tsx`

```typescript
import { notFound } from "next/navigation";
import { fetchLayoutData } from "@/lib/layout-data";
import { requireModuleAccess } from "@/lib/auth-utils";
import { getModulePermissions } from "@/lib/module-access-utils";
import { getModuleList } from "@repo/app-modules";
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper";
import { ModuleDataTableWithTimeout } from "@/components/modules/ModuleDataTableWithTimeout";

// NEW: Import custom module implementations
import { StudentModuleLayout } from "@/components/students/StudentModuleLayout";

interface ModulePageProps {
  params: Promise<{
    appId: string;
    module: string;
  }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function ModulePage({
  params,
  searchParams,
}: ModulePageProps) {
  const resolvedParams = await params;

  // 🔒 SECURITY: Server-side authorization check
  const { user, tenant, module: fullModule } = await requireModuleAccess(
    resolvedParams.appId,
    resolvedParams.module
  );

  // ⭐ NEW: Check if this module has custom implementation
  if (resolvedParams.module === 'students' && resolvedParams.appId === 'cpms') {
    return <StudentModuleLayout module={fullModule} user={user} appId={resolvedParams.appId} />;
  }

  // Get filtered layout data
  const { appSchemaData } = await fetchLayoutData();

  if (!appSchemaData?.modules) {
    notFound();
  }

  const module = appSchemaData.modules.find(
    (mod: ClientModule) => mod.slug === resolvedParams.module
  );

  if (!module) {
    notFound();
  }

  const userPermissions = getModulePermissions(fullModule, user);

  // ... rest of existing generic code for other modules
  const isServerSidePaging =
    module.dataTableSchema?.pagination?.isClientSidePaging === false;

  if (isServerSidePaging) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <ModuleDataTableWrapper
          module={module}
          initialData={[]}
          userPermissions={userPermissions}
        />
      </div>
    );
  }

  // ... existing code continues
}
```

### 2. Update Module "New" Page

**File:** `apps/core/src/app/[appId]/[module]/new/page.tsx`

```typescript
import { requireModuleAccess } from "@/lib/auth-utils";
import { GenericFormWrapper } from "@/components/modules/GenericFormWrapper";

// NEW: Import custom implementations
import { StudentNewPage } from "@/components/students/StudentNewPage";

export default async function NewItemPage({
  params,
}: {
  params: Promise<{ appId: string; module: string }>;
}) {
  const { appId, module } = await params;
  const { module: fullModule } = await requireModuleAccess(appId, module);

  // ⭐ NEW: Custom implementation for students
  if (module === 'students' && appId === 'cpms') {
    return <StudentNewPage module={fullModule} appId={appId} />;
  }

  // Generic implementation for other modules
  return <GenericFormWrapper module={fullModule} mode="create" />;
}
```

### 3. Update Module Detail Page

**File:** `apps/core/src/app/[appId]/[module]/[id]/page.tsx`

```typescript
import { requireModuleAccess } from "@/lib/auth-utils";
import { getModuleItem } from "@repo/app-modules";
import { GenericDetailView } from "@/components/modules/GenericDetailView";

// NEW: Import custom detail view
import { StudentDetailPage } from "@/components/students/StudentDetailPage";

export default async function DetailPage({
  params,
}: {
  params: Promise<{ appId: string; module: string; id: string }>;
}) {
  const { appId, module, id } = await params;
  await requireModuleAccess(appId, module);

  const item = await getModuleItem(module, id);

  // ⭐ NEW: Custom implementation for students
  if (module === 'students' && appId === 'cpms') {
    return <StudentDetailPage student={item} appId={appId} />;
  }

  // Generic implementation
  return <GenericDetailView item={item} module={module} />;
}
```

---

## Custom Components

### 4. Student Module Layout (List Page)

**File:** `apps/core/src/components/students/StudentModuleLayout.tsx`

```typescript
"use client";

import { Card, Button } from "@repo/ui";
import Link from "next/link";
import { UserPlus, Users, Upload, List } from "lucide-react";
import { useState } from "react";
import { ModuleDataTableWrapper } from "@/components/modules/ModuleDataTableWrapper";

interface StudentModuleLayoutProps {
  module: any;
  user: any;
  appId: string;
}

export function StudentModuleLayout({ module, user, appId }: StudentModuleLayoutProps) {
  const [view, setView] = useState<"menu" | "list">("menu");

  if (view === "list") {
    // Show standard data table
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setView("menu")}>
          ← Back to Menu
        </Button>
        <ModuleDataTableWrapper
          module={module}
          initialData={[]}
          userPermissions={user.permissions}
        />
      </div>
    );
  }

  // Show submenu for student actions
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Management</h1>
        <p className="text-muted-foreground mt-2">
          Choose an action to manage students
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Registration */}
        <Link href={`/${appId}/students/new?type=wizard`}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">New Registration</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Register a single student with step-by-step wizard
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Batch Upload */}
        <Link href={`/${appId}/students/new?type=batch`}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-green-100 rounded-full">
                <Upload className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Batch Upload</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload multiple students via Excel or CSV file
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* View All Students */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full"
          onClick={() => setView("list")}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-purple-100 rounded-full">
              <List className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">View All Students</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Browse, search, and manage existing students
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-orange-100 rounded-full">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Quick Actions</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Promote, transfer, or graduate students
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### 5. Student New Page (Create/Upload Router)

**File:** `apps/core/src/components/students/StudentNewPage.tsx`

```typescript
"use client";

import { useSearchParams } from "next/navigation";
import { StudentRegistrationWizard } from "./StudentRegistrationWizard";
import { StudentBatchUpload } from "./StudentBatchUpload";
import { GenericFormWrapper } from "@/components/modules/GenericFormWrapper";

interface StudentNewPageProps {
  module: any;
  appId: string;
}

export function StudentNewPage({ module, appId }: StudentNewPageProps) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  // Wizard registration
  if (type === "wizard") {
    return (
      <div className="max-w-4xl mx-auto">
        <StudentRegistrationWizard module={module} appId={appId} />
      </div>
    );
  }

  // Batch upload
  if (type === "batch") {
    return (
      <div className="max-w-6xl mx-auto">
        <StudentBatchUpload module={module} appId={appId} />
      </div>
    );
  }

  // Default: show generic form or selection menu
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Registration Method</h2>
        <p className="text-muted-foreground mt-2">
          Select how you want to add students
        </p>
      </div>

      {/* Show options to select wizard or batch */}
      <div className="grid grid-cols-2 gap-4">
        <a href={`/${appId}/students/new?type=wizard`}>
          <Card className="p-6 hover:shadow-lg cursor-pointer">
            <h3 className="font-semibold">Single Registration</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Step-by-step wizard form
            </p>
          </Card>
        </a>
        <a href={`/${appId}/students/new?type=batch`}>
          <Card className="p-6 hover:shadow-lg cursor-pointer">
            <h3 className="font-semibold">Batch Upload</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Upload Excel/CSV file
            </p>
          </Card>
        </a>
      </div>
    </div>
  );
}
```

### 6. Student Detail Page with Tabs

**File:** `apps/core/src/components/students/StudentDetailPage.tsx`

```typescript
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger, Button } from "@repo/ui";
import { useRouter } from "next/navigation";
import { StudentActions } from "./StudentActions";

interface StudentDetailPageProps {
  student: any;
  appId: string;
}

export function StudentDetailPage({ student, appId }: StudentDetailPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">
            Roll No: {student.rollNo} | Class: {student.class}
          </p>
        </div>

        <StudentActions student={student} appId={appId} />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="academic">Academic Records</TabsTrigger>
          <TabsTrigger value="family">Family Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="fees">Fee Records</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {/* Display student personal information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Personal Information</h3>
            {/* ... fields ... */}
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          {/* Academic records table */}
        </TabsContent>

        <TabsContent value="family">
          {/* Family information */}
        </TabsContent>

        {/* ... other tabs ... */}
      </Tabs>
    </div>
  );
}
```

### 7. Student Actions Component

**File:** `apps/core/src/components/students/StudentActions.tsx`

```typescript
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@repo/ui";
import { MoreVertical, UserPlus, ArrowRight, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

export function StudentActions({ student, appId }: any) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/${appId}/students/${student.id}/edit`)}>
          Edit Student
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePromote(student)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Promote to Next Class
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleTransfer(student)}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Transfer to Another School
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleGraduate(student)}>
          <GraduationCap className="mr-2 h-4 w-4" />
          Mark as Graduated
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function handlePromote(student: any) {
  // Open promote modal or navigate to promote page
}

function handleTransfer(student: any) {
  // Open transfer modal
}

function handleGraduate(student: any) {
  // Open graduate confirmation
}
```

---

## Configuration: Module Metadata

Add to your app schema to identify custom modules:

```typescript
// libs/app-modules or your schema config

export const MODULE_CONFIG = {
  students: {
    hasCustomImplementation: true,
    customViews: {
      list: true,
      create: true,
      detail: true,
    },
    submodules: [
      { key: "wizard", label: "New Registration" },
      { key: "batch", label: "Batch Upload" },
    ],
  },
  users: {
    hasCustomImplementation: false, // Uses generic
  },
  // ... other modules
};
```

---

## Benefits

✅ **No route structure changes** - Works with existing `/cpms/students` URLs
✅ **Clean separation** - Custom logic in separate components
✅ **Easy to maintain** - Add more custom modules easily
✅ **Type-safe** - Full TypeScript support
✅ **Backward compatible** - Other modules unaffected
✅ **Scalable** - Can add more apps (not just CPMS) with same pattern

---

## Summary

The key is **conditional rendering within dynamic routes**:

```typescript
// In [module]/page.tsx
if (module === 'students' && appId === 'cpms') {
  return <StudentModuleLayout />; // Custom
}
return <GenericModuleLayout />; // Default
```

This gives you full flexibility without changing your URL structure!
