# CPMS Students Module - Folder Structure

## Overview

Since you're using dynamic routes `/[appId]/[module]`, you keep the existing route files and add student-specific components in a dedicated folder.

---

## Recommended Folder Structure

```
apps/core/src/
│
├── app/
│   └── [appId]/
│       └── [module]/
│           ├── page.tsx                    ← Modified: Add conditional for students
│           ├── new/
│           │   └── page.tsx                ← Modified: Add conditional for students
│           ├── [id]/
│           │   ├── page.tsx                ← Modified: Add conditional for students
│           │   └── edit/
│           │       └── page.tsx            ← Modified: Add conditional for students
│           └── deleted/
│               └── page.tsx                ← Keep as-is (generic)
│
├── components/
│   │
│   ├── modules/                            ← Existing generic components
│   │   ├── ModuleDataTableWrapper.tsx
│   │   ├── ModuleDataTableWithTimeout.tsx
│   │   ├── GenericFormWrapper.tsx
│   │   └── GenericDetailView.tsx
│   │
│   └── students/                           ← NEW: Student-specific components
│       │
│       ├── index.ts                        ← Export barrel file
│       │
│       ├── StudentModuleLayout.tsx         ← Main page with submenu
│       ├── StudentNewPage.tsx              ← Router for wizard/batch
│       ├── StudentDetailPage.tsx           ← Detail view with tabs
│       │
│       ├── wizard/                         ← Registration wizard components
│       │   ├── StudentRegistrationWizard.tsx
│       │   ├── PersonalInfoStep.tsx
│       │   ├── FamilyInfoStep.tsx
│       │   ├── AcademicInfoStep.tsx
│       │   └── DocumentsStep.tsx
│       │
│       ├── batch/                          ← Batch upload components
│       │   ├── StudentBatchUpload.tsx
│       │   ├── FileUploader.tsx
│       │   ├── PreviewTable.tsx
│       │   └── ValidationErrors.tsx
│       │
│       ├── detail/                         ← Detail page tabs
│       │   ├── PersonalInfoTab.tsx
│       │   ├── AcademicRecordsTab.tsx
│       │   ├── FamilyDetailsTab.tsx
│       │   ├── DocumentsTab.tsx
│       │   ├── FeesTab.tsx
│       │   └── AttendanceTab.tsx
│       │
│       ├── actions/                        ← Special action components
│       │   ├── StudentActions.tsx
│       │   ├── PromoteDialog.tsx
│       │   ├── TransferDialog.tsx
│       │   └── GraduateDialog.tsx
│       │
│       └── shared/                         ← Shared student utilities
│           ├── StudentCard.tsx
│           ├── StudentFilters.tsx
│           └── StudentStats.tsx
│
├── lib/
│   └── students/                           ← NEW: Student-specific utilities
│       ├── validation.ts                   ← Custom validation rules
│       ├── calculations.ts                 ← Age, grade calculations
│       └── constants.ts                    ← Student-related constants
│
└── actions/
    └── students/                           ← NEW: Server actions for students
        ├── create-student.ts
        ├── batch-upload.ts
        ├── promote-student.ts
        ├── transfer-student.ts
        └── graduate-student.ts
```

---

## Detailed Structure

### 1. Route Files (Modified)

These existing files get conditional logic added:

#### `app/[appId]/[module]/page.tsx`
```typescript
// Add at top:
import { StudentModuleLayout } from "@/components/students";

// Add in component:
if (module === 'students' && appId === 'cpms') {
  return <StudentModuleLayout module={fullModule} user={user} appId={appId} />;
}
```

#### `app/[appId]/[module]/new/page.tsx`
```typescript
import { StudentNewPage } from "@/components/students";

if (module === 'students' && appId === 'cpms') {
  return <StudentNewPage module={fullModule} appId={appId} />;
}
```

#### `app/[appId]/[module]/[id]/page.tsx`
```typescript
import { StudentDetailPage } from "@/components/students";

if (module === 'students' && appId === 'cpms') {
  return <StudentDetailPage student={item} appId={appId} />;
}
```

---

### 2. Component Structure

#### Main Layout Component
**`components/students/StudentModuleLayout.tsx`**
```typescript
"use client";

import { Card } from "@repo/ui";
import Link from "next/link";
import { UserPlus, Upload, List, Zap } from "lucide-react";

export function StudentModuleLayout({ module, user, appId }: Props) {
  // Submenu cards for different actions
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Submenu cards */}
      </div>
    </div>
  );
}
```

#### Wizard Components
**`components/students/wizard/StudentRegistrationWizard.tsx`**
```typescript
"use client";

import { useState } from "react";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { FamilyInfoStep } from "./FamilyInfoStep";
// ... other steps

export function StudentRegistrationWizard() {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={step} totalSteps={4} />

      {step === 1 && <PersonalInfoStep onNext={...} />}
      {step === 2 && <FamilyInfoStep onNext={...} />}
      {/* ... other steps */}
    </div>
  );
}
```

#### Batch Upload Components
**`components/students/batch/StudentBatchUpload.tsx`**
```typescript
"use client";

import { FileUploader } from "./FileUploader";
import { PreviewTable } from "./PreviewTable";

export function StudentBatchUpload() {
  return (
    <div className="space-y-6">
      <FileUploader onFileSelect={...} />
      <PreviewTable data={...} />
    </div>
  );
}
```

#### Detail View Components
**`components/students/detail/PersonalInfoTab.tsx`**
```typescript
export function PersonalInfoTab({ student }: Props) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Personal Information</h3>
      {/* Display fields */}
    </Card>
  );
}
```

---

### 3. Server Actions Structure

**`actions/students/create-student.ts`**
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createRecord } from "@repo/app-modules";

export async function createStudent(data: StudentFormData) {
  // Validation
  // Create student
  // Revalidate

  revalidatePath(`/cpms/students`);
  return { success: true, id: newStudent.id };
}
```

**`actions/students/batch-upload.ts`**
```typescript
"use server";

import * as XLSX from "xlsx";

export async function processBatchUpload(file: File) {
  // Parse Excel/CSV
  // Validate rows
  // Bulk insert

  return {
    success: true,
    imported: 50,
    errors: []
  };
}
```

**`actions/students/promote-student.ts`**
```typescript
"use server";

export async function promoteStudent(studentId: string, toClass: string) {
  // Update student class
  // Create promotion record
  // Send notification

  return { success: true };
}
```

---

### 4. Utility Structure

**`lib/students/validation.ts`**
```typescript
import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(2),
  dateOfBirth: z.date(),
  // ... other fields
});

export function validateAge(dob: Date): boolean {
  // Age validation logic
}
```

**`lib/students/calculations.ts`**
```typescript
export function calculateAge(dob: Date): number {
  // Calculate age
}

export function getNextGrade(currentGrade: string): string {
  // Grade progression logic
}
```

**`lib/students/constants.ts`**
```typescript
export const GRADES = [
  "KG-1", "KG-2",
  "Grade 1", "Grade 2",
  // ...
];

export const STUDENT_STATUS = {
  ACTIVE: "active",
  GRADUATED: "graduated",
  TRANSFERRED: "transferred",
  DROPPED: "dropped",
};
```

---

## Export Barrel Files

### `components/students/index.ts`
```typescript
// Main exports
export { StudentModuleLayout } from "./StudentModuleLayout";
export { StudentNewPage } from "./StudentNewPage";
export { StudentDetailPage } from "./StudentDetailPage";

// Wizard
export { StudentRegistrationWizard } from "./wizard/StudentRegistrationWizard";

// Batch
export { StudentBatchUpload } from "./batch/StudentBatchUpload";

// Actions
export { StudentActions } from "./actions/StudentActions";
```

This allows clean imports:
```typescript
import { StudentModuleLayout, StudentNewPage } from "@/components/students";
```

---

## Migration Path

### Phase 1: Setup Structure
1. Create `components/students/` folder
2. Create `index.ts` barrel file
3. Create basic layout component

### Phase 2: Implement Main Features
1. Create `StudentModuleLayout` (submenu)
2. Create `StudentNewPage` (wizard/batch router)
3. Add conditional logic to route files

### Phase 3: Add Wizard
1. Create wizard components
2. Implement multi-step form
3. Add validation

### Phase 4: Add Batch Upload
1. Create batch upload components
2. Implement file parsing
3. Add preview and validation

### Phase 5: Enhance Detail View
1. Create tabbed detail view
2. Add special actions
3. Implement action dialogs

---

## Alternative: Colocation Strategy

If you prefer keeping related code closer to routes:

```
app/[appId]/[module]/
├── page.tsx
├── new/
│   └── page.tsx
├── [id]/
│   └── page.tsx
│
└── _students/                    ← Underscore prefix = not a route
    ├── components/
    │   ├── StudentModuleLayout.tsx
    │   ├── StudentRegistrationWizard.tsx
    │   └── ...
    ├── actions/
    │   └── ...
    └── lib/
        └── ...
```

**Note:** The underscore `_students` tells Next.js this is NOT a route, just a folder for organization.

---

## Recommended: Hybrid Approach

```
apps/core/src/
│
├── app/[appId]/[module]/
│   ├── page.tsx                  ← Route logic
│   └── _students/                ← Co-located, route-specific
│       └── StudentModuleLayout.tsx
│
└── components/students/          ← Shared, reusable components
    ├── wizard/
    ├── batch/
    └── actions/
```

This gives you:
- ✅ Route-specific components near routes
- ✅ Reusable components in shared location
- ✅ Clear organization
- ✅ Easy to find related code

---

## Summary

**Best Practice Structure:**
```
components/students/           ← Main student components
  ├── StudentModuleLayout.tsx  ← Submenu page
  ├── StudentNewPage.tsx       ← Create router
  ├── StudentDetailPage.tsx    ← Detail view
  ├── wizard/                  ← Registration wizard
  ├── batch/                   ← Batch upload
  ├── detail/                  ← Detail tabs
  ├── actions/                 ← Special actions
  └── shared/                  ← Shared utilities

actions/students/              ← Server actions
lib/students/                  ← Utilities & validation
```

This structure:
- ✅ Keeps student code organized
- ✅ Separates concerns clearly
- ✅ Easy to find and maintain
- ✅ Scalable for future features
- ✅ Works with your existing route structure
