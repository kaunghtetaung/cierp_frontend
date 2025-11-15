# Student Module Custom Architecture

## Problem
The student module requires custom forms and special actions beyond the generic schema-driven system:
- Custom multi-step registration wizard
- Batch registration with file upload
- Special actions (promote, transfer, graduate)
- Custom detail views with additional tabs

## Solution: Module-Specific Override Pattern

### 1. Route Precedence Strategy

Next.js will prioritize specific routes over dynamic routes:

```
✅ /[appId]/students/new-registration  → Custom route (higher priority)
✅ /[appId]/students/batch-registration → Custom route
❌ /[appId]/[module]/new              → Generic fallback (ignored for students)
```

### 2. Directory Structure

```
apps/core/src/app/[appId]/
│
├── [module]/                          ← Generic schema-driven
│   ├── page.tsx                      ← List view (DataTable)
│   ├── new/
│   │   └── page.tsx                  ← Generic create form
│   ├── [id]/
│   │   ├── page.tsx                  ← Generic detail view
│   │   └── edit/
│   │       └── page.tsx              ← Generic edit form
│   └── deleted/
│       └── page.tsx                  ← Deleted items
│
└── students/                          ← Custom module override
    ├── page.tsx                       ← Custom list + submodule navigation
    ├── new-registration/              ← Custom multi-step wizard
    │   └── page.tsx
    ├── batch-registration/            ← Custom batch upload
    │   └── page.tsx
    ├── [id]/                          ← Custom detail pages
    │   ├── page.tsx                   ← Detail with custom tabs
    │   ├── edit/
    │   │   └── page.tsx               ← Custom edit form
    │   ├── promote/
    │   │   └── page.tsx               ← Special action: Promote
    │   ├── transfer/
    │   │   └── page.tsx               ← Special action: Transfer
    │   └── documents/
    │       └── page.tsx               ← Additional tab
    │
    └── components/                    ← Student-specific components
        ├── StudentRegistrationWizard.tsx
        ├── BatchUploadForm.tsx
        ├── StudentDetailTabs.tsx
        ├── PromoteForm.tsx
        └── TransferForm.tsx
```

### 3. Implementation Steps

#### Step 1: Create Student Module Root Page

**File:** `apps/core/src/app/[appId]/students/page.tsx`

```typescript
import { notFound } from "next/navigation";
import { requireModuleAccess } from "@/lib/auth-utils";
import { StudentModuleLayout } from "./components/StudentModuleLayout";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  // Verify access to students module
  const { user, module } = await requireModuleAccess(appId, "students");

  return <StudentModuleLayout module={module} user={user} />;
}
```

#### Step 2: Create Submodule Navigation

**File:** `apps/core/src/app/[appId]/students/components/StudentModuleLayout.tsx`

```typescript
"use client";

import { Card } from "@repo/ui";
import Link from "next/link";
import { UserPlus, Users, GraduationCap } from "lucide-react";

const STUDENT_SUBMODULES = [
  {
    title: "New Registration",
    description: "Register a new student with wizard form",
    href: "students/new-registration",
    icon: UserPlus,
  },
  {
    title: "Batch Registration",
    description: "Upload multiple students via Excel/CSV",
    href: "students/batch-registration",
    icon: Users,
  },
  {
    title: "View All Students",
    description: "Browse and manage existing students",
    href: "students/list",
    icon: GraduationCap,
  },
];

export function StudentModuleLayout({ module, user }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{module.name.en}</h1>
        <p className="text-muted-foreground">{module.description?.en}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STUDENT_SUBMODULES.map((submodule) => {
          const Icon = submodule.icon;
          return (
            <Link key={submodule.href} href={`/${params.appId}/${submodule.href}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{submodule.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {submodule.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

#### Step 3: Create Custom Registration Wizard

**File:** `apps/core/src/app/[appId]/students/new-registration/page.tsx`

```typescript
import { requireModuleAccess } from "@/lib/auth-utils";
import { StudentRegistrationWizard } from "../components/StudentRegistrationWizard";

export default async function NewStudentRegistrationPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireModuleAccess(appId, "students");

  return (
    <div className="max-w-4xl mx-auto">
      <StudentRegistrationWizard />
    </div>
  );
}
```

#### Step 4: Create Batch Registration

**File:** `apps/core/src/app/[appId]/students/batch-registration/page.tsx`

```typescript
import { requireModuleAccess } from "@/lib/auth-utils";
import { BatchUploadForm } from "../components/BatchUploadForm";

export default async function BatchRegistrationPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireModuleAccess(appId, "students");

  return (
    <div className="max-w-6xl mx-auto">
      <BatchUploadForm />
    </div>
  );
}
```

#### Step 5: Custom Student List

**File:** `apps/core/src/app/[appId]/students/list/page.tsx`

```typescript
import { requireModuleAccess } from "@/lib/auth-utils";
import { getModuleList } from "@repo/app-modules";
import { StudentDataTable } from "../components/StudentDataTable";

export default async function StudentListPage({
  params,
  searchParams,
}: {
  params: Promise<{ appId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { appId } = await params;
  const { module } = await requireModuleAccess(appId, "students");

  const students = await getModuleList("students", await searchParams);

  return <StudentDataTable data={students} module={module} />;
}
```

#### Step 6: Custom Detail View with Actions

**File:** `apps/core/src/app/[appId]/students/[id]/page.tsx`

```typescript
import { requireModuleAccess } from "@/lib/auth-utils";
import { getModuleItem } from "@repo/app-modules";
import { StudentDetailView } from "../components/StudentDetailView";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ appId: string; id: string }>;
}) {
  const { appId, id } = await params;
  await requireModuleAccess(appId, "students");

  const student = await getModuleItem("students", id);

  return <StudentDetailView student={student} />;
}
```

**File:** `apps/core/src/app/[appId]/students/components/StudentDetailView.tsx`

```typescript
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { Button } from "@repo/ui";
import Link from "next/link";

export function StudentDetailView({ student }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{student.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`./edit`}>Edit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`./promote`}>Promote</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`./transfer`}>Transfer</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          {/* Student info form fields */}
        </TabsContent>

        <TabsContent value="academic">
          {/* Academic records */}
        </TabsContent>

        {/* ... other tabs */}
      </Tabs>
    </div>
  );
}
```

### 4. Benefits of This Approach

✅ **Coexistence**: Generic modules still work via `[module]` route
✅ **No Breaking Changes**: Other modules (users, roles, etc.) unaffected
✅ **Type Safety**: Full TypeScript support
✅ **SEO Friendly**: Proper static routes for common paths
✅ **Maintainable**: Clear separation between generic and custom logic
✅ **Scalable**: Easy to add more custom modules (teachers, courses, etc.)

### 5. Migration Path

1. **Keep existing `[module]` routes** working for all current modules
2. **Create `students` folder** alongside `[module]`
3. **Gradually migrate** student-specific features to custom routes
4. **Test thoroughly** with both paths
5. **Deprecate old routes** once migration complete

### 6. Routing Fallback Pattern

For modules that don't need customization, the generic `[module]` route handles them:

```typescript
// apps/core/src/app/[appId]/[module]/page.tsx

export default async function ModulePage({ params }: any) {
  const { appId, module } = await params;

  // Check if this module has custom implementation
  const customModules = ['students', 'teachers']; // List of custom modules

  if (customModules.includes(module)) {
    // This should never be reached due to Next.js route priority
    // But serves as safety fallback
    redirect(`/${appId}/${module}`);
  }

  // Generic schema-driven implementation
  // ... existing code
}
```

### 7. Configuration in App Schema

Add metadata to identify custom modules:

```json
{
  "modules": [
    {
      "slug": "students",
      "name": { "en": "Students" },
      "hasCustomImplementation": true,
      "customRoutes": {
        "main": "/students",
        "create": "/students/new-registration",
        "batch": "/students/batch-registration"
      }
    }
  ]
}
```

---

## Summary

This architecture allows you to:
- ✅ Use generic schema-driven forms for simple modules
- ✅ Create fully custom forms/wizards for complex modules like students
- ✅ Add special actions (promote, transfer, graduate)
- ✅ Have submodules/submenus within a module
- ✅ Maintain type safety and proper routing
- ✅ Scale to more custom modules in the future

The key insight is **Next.js route precedence**: specific routes (`/students/new-registration`) always win over dynamic routes (`/[module]/new`), allowing both systems to coexist peacefully.
