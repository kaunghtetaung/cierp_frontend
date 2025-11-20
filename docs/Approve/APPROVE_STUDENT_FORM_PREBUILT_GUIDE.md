# Approve Student Form - Pre-Built Component Guide

## Overview

This guide provides complete implementation instructions for the **ApproveStudentForm** pre-built React component. The form has been converted from schema-driven to pre-built approach for better customization and maintainability.

## Backend Configuration

**File**: `/workspace/apps/core/src/cpms/initialize/cpms-initialize.config.ts` (Lines 1012-1031)

```typescript
{
  actionKey: 'approveStudent',
  title: { en: 'Approve Student', mm: 'ကျောင်းသားအတည်ပြုခြင်း' },
  description: {
    en: 'Approve student registration and configure batch enrollments',
    mm: 'ကျောင်းသား မှတ်ပုံတင်ခြင်းကို အတည်ပြုပြီး အသုတ်များကို စီစဉ်ပါ',
  },
  iconName: 'CheckCircle',
  endpoint: '/:id/approve',
  method: 'POST',
  formType: 'modal',
  formApproach: 'pre-built',          // ← Uses hard-coded component
  formName: 'approveStudentForm',     // ← Component name to load
  formWidth: 'xl',
  submitButtonText: { en: 'Approve Student', mm: 'ကျောင်းသား အတည်ပြုမည်' },
  cancelButtonText: { en: 'Cancel', mm: 'မလုပ်တော့ပါ' },
  requiresSelection: false,
  buttonStyle: 'primary',
  permission: 'update'
}
```

**Key Changes from Schema-Driven**:
- ✅ `formApproach: 'pre-built'` - Uses hard-coded component
- ✅ `formName: 'approveStudentForm'` - Component identifier
- ✅ Removed `formFields` array - Form structure defined in component
- ✅ Removed `formLayout` - Layout controlled by component
- ✅ Kept `formWidth: 'xl'` - Modal size configuration

---

## Component File Structure

```
frontend/
├── libs/
│   └── schema-forms/
│       ├── ExtraActionFormRouter.tsx           # Routes to pre-built forms
│       └── pre-built/
│           ├── index.ts                        # Export registry
│           ├── ApproveStudentForm.tsx          # ← NEW: Main component
│           ├── BulkApproveStudentForm.tsx
│           ├── RoleAssignForm.tsx
│           └── UserPasswordChangeForm.tsx
└── types/
    └── student.types.ts                        # TypeScript interfaces
```

---

## Component Registration

### 1. Export from Registry

**File**: `libs/schema-forms/pre-built/index.ts`

```typescript
// Export all pre-built forms
export { ApproveStudentForm } from './ApproveStudentForm';
export { BulkApproveStudentForm } from './BulkApproveStudentForm';
export { RoleAssignForm } from './RoleAssignForm';
export { UserPasswordChangeForm } from './UserPasswordChangeForm';

// Form registry mapping formName to component
export const PRE_BUILT_FORMS = {
  approveStudentForm: ApproveStudentForm,
  bulkApproveStudentForm: BulkApproveStudentForm,
  roleAssignForm: RoleAssignForm,
  userPwdChangeForm: UserPasswordChangeForm,
} as const;
```

### 2. Router Integration

**File**: `libs/schema-forms/ExtraActionFormRouter.tsx`

```typescript
import { PRE_BUILT_FORMS } from './pre-built';

export function ExtraActionFormRouter({ actionConfig, ...props }) {
  // Route based on formApproach
  if (actionConfig.formApproach === 'pre-built') {
    const FormComponent = PRE_BUILT_FORMS[actionConfig.formName];

    if (!FormComponent) {
      console.error(`Pre-built form not found: ${actionConfig.formName}`);
      return <div>Form component not found</div>;
    }

    return <FormComponent {...props} />;
  }

  if (actionConfig.formApproach === 'schema-driven') {
    return <DynamicExtraActionForm actionConfig={actionConfig} {...props} />;
  }

  // Default fallback
  return <div>Unknown form approach</div>;
}
```

---

## ApproveStudentForm Component Implementation

### Complete Component Code

**File**: `libs/schema-forms/pre-built/ApproveStudentForm.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchDynamicOptions } from '@/lib/api';
import { submitApproveStudent } from '@/appModules/students/server-actions/student-actions';

// TypeScript Interfaces
interface ApproveStudentFormProps {
  studentId: string;
  currentLanguage: 'en' | 'mm';
  onSuccess: () => void;
  onCancel: () => void;
}

interface BatchEnrollment {
  isActive: boolean;
  academicYearId: string;
  batchId: string;
  rollNo: string;
  modules: string[];
  subjects: string[];
}

interface ApproveStudentFormData {
  admissionNumber: string;
  batches: BatchEnrollment[];
  notes: string;
  libraryBorrowerRequest: boolean;
}

interface SelectOption {
  _id: string;
  name: string;
}

// Validation Schema
const approveStudentSchema = z.object({
  admissionNumber: z.string().optional(),
  batches: z.array(
    z.object({
      isActive: z.boolean(),
      academicYearId: z.string().min(1, 'Academic Year is required'),
      batchId: z.string().min(1, 'Batch is required'),
      rollNo: z.string().optional(),
      modules: z.array(z.string()).optional(),
      subjects: z.array(z.string()).optional(),
    })
  ).min(1, 'At least one batch enrollment is required'),
  notes: z.string().optional(),
  libraryBorrowerRequest: z.boolean(),
});

// Labels
const labels = {
  admissionNumber: { en: 'Admission Number', mm: 'ဝင်ခွင့်အမှတ်စဉ်' },
  batches: { en: 'Batch Enrollments', mm: 'အသုတ်စာရင်းများ' },
  isActive: { en: 'Active', mm: 'လက်ရှိ' },
  academicYear: { en: 'Academic Year', mm: 'ပညာသင်နှစ်' },
  batch: { en: 'Batch', mm: 'အသုတ်' },
  rollNo: { en: 'Roll Number', mm: 'ခုံအမှတ်' },
  modules: { en: 'Modules', mm: 'မော်ဂျူးများ' },
  subjects: { en: 'Subjects', mm: 'ဘာသာရပ်များ' },
  notes: { en: 'Approval Notes', mm: 'အတည်ပြုမှတ်ချက်' },
  libraryBorrower: { en: 'Create Library Borrower Account', mm: 'စာကြည့်တိုက်ငှားသူအကောင့်ဖန်တီးမည်' },
  addBatch: { en: 'Add Batch', mm: 'အသုတ်ထပ်ထည့်မည်' },
  batchEnrollment: { en: 'Batch Enrollment', mm: 'အသုတ်စာရင်း' },
  selectAcademicYear: { en: 'Select Academic Year first', mm: 'ပညာသင်နှစ်ကို ဦးစွာရွေးပါ' },
  loading: { en: 'Loading...', mm: 'ရှာဖွေနေသည်...' },
  select: { en: 'Select', mm: 'ရွေးပါ' },
  approving: { en: 'Approving...', mm: 'အတည်ပြုနေသည်...' },
  approve: { en: 'Approve Student', mm: 'ကျောင်းသား အတည်ပြုမည်' },
  cancel: { en: 'Cancel', mm: 'မလုပ်တော့ပါ' },
  autoGenerated: { en: 'Auto-generated if empty', mm: 'ဗလာဖြစ်ပါက အလိုအလျောက်ဖြည့်သည်' },
  onlyOneActive: { en: 'Only one batch can be active', mm: 'တစ်ခုသာ အသက်ဝင်နိုင်သည်' },
};

export function ApproveStudentForm({
  studentId,
  currentLanguage,
  onSuccess,
  onCancel,
}: ApproveStudentFormProps) {
  const lang = currentLanguage;

  // Form State
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApproveStudentFormData>({
    resolver: zodResolver(approveStudentSchema),
    defaultValues: {
      admissionNumber: '',
      batches: [
        {
          isActive: true,
          academicYearId: '',
          batchId: '',
          rollNo: '',
          modules: [],
          subjects: [],
        },
      ],
      notes: '',
      libraryBorrowerRequest: true,
    },
  });

  // Array Field Management
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'batches',
  });

  // Options State
  const [academicYears, setAcademicYears] = useState<SelectOption[]>([]);
  const [batches, setBatches] = useState<Record<number, SelectOption[]>>({});
  const [modules, setModules] = useState<SelectOption[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    academicYears: false,
    batches: {} as Record<number, boolean>,
    modules: false,
    subjects: false,
  });

  // Watch academic years for dependent batch loading
  const watchedAcademicYears = watch('batches').map((b) => b.academicYearId);

  // Load Academic Years on Mount
  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Load Batches when Academic Year changes
  useEffect(() => {
    watchedAcademicYears.forEach((yearId, index) => {
      if (yearId && !batches[index]) {
        loadBatches(index, yearId);
      }
    });
  }, [watchedAcademicYears]);

  // Load Modules and Subjects on Mount
  useEffect(() => {
    loadModules();
    loadSubjects();
  }, []);

  // API Fetch Functions
  const loadAcademicYears = async () => {
    setLoadingStates((prev) => ({ ...prev, academicYears: true }));
    try {
      const data = await fetchDynamicOptions({
        endpoint: '/academic-years/ref',
        serviceName: 'cpms',
        searchParam: 'search',
      });
      setAcademicYears(data);
    } catch (error) {
      console.error('Failed to load academic years:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, academicYears: false }));
    }
  };

  const loadBatches = async (index: number, academicYearId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      batches: { ...prev.batches, [index]: true },
    }));
    try {
      const data = await fetchDynamicOptions({
        endpoint: '/batches/ref',
        serviceName: 'cpms',
        searchParam: 'search',
        filters: { academicYearId },
      });
      setBatches((prev) => ({ ...prev, [index]: data }));
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        batches: { ...prev.batches, [index]: false },
      }));
    }
  };

  const loadModules = async () => {
    setLoadingStates((prev) => ({ ...prev, modules: true }));
    try {
      const data = await fetchDynamicOptions({
        endpoint: '/modules/ref',
        serviceName: 'cpms',
        searchParam: 'search',
      });
      setModules(data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, modules: false }));
    }
  };

  const loadSubjects = async () => {
    setLoadingStates((prev) => ({ ...prev, subjects: true }));
    try {
      const data = await fetchDynamicOptions({
        endpoint: '/subjects/ref',
        serviceName: 'cpms',
        searchParam: 'search',
      });
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, subjects: false }));
    }
  };

  // Form Handlers
  const handleAddBatch = () => {
    append({
      isActive: false,
      academicYearId: '',
      batchId: '',
      rollNo: '',
      modules: [],
      subjects: [],
    });
  };

  const handleAcademicYearChange = (index: number, value: string) => {
    setValue(`batches.${index}.academicYearId`, value);
    setValue(`batches.${index}.batchId`, ''); // Reset batch when year changes
    setBatches((prev) => {
      const newBatches = { ...prev };
      delete newBatches[index];
      return newBatches;
    });
  };

  const onSubmit = async (data: ApproveStudentFormData) => {
    try {
      const result = await submitApproveStudent(studentId, data);

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || 'Failed to approve student');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('An unexpected error occurred');
    }
  };

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Admission Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labels.admissionNumber[lang]}
          </label>
          <input
            type="text"
            {...register('admissionNumber')}
            placeholder={labels.autoGenerated[lang]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {labels.autoGenerated[lang]}
          </p>
        </div>

        {/* Batch Enrollments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {labels.batches[lang]}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddBatch}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              <Plus size={16} />
              {labels.addBatch[lang]}
            </button>
          </div>

          {/* Batch Items */}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                {/* Remove Button */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Item Header */}
                <div className="mb-3 text-sm font-medium text-gray-600">
                  {labels.batchEnrollment[lang]} #{index + 1}
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Active Checkbox */}
                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register(`batches.${index}.isActive`)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {labels.isActive[lang]}
                      </span>
                    </label>
                    <p className="ml-6 mt-1 text-xs text-gray-500">
                      {labels.onlyOneActive[lang]}
                    </p>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {labels.academicYear[lang]}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      {...register(`batches.${index}.academicYearId`)}
                      onChange={(e) => handleAcademicYearChange(index, e.target.value)}
                      disabled={loadingStates.academicYears}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {loadingStates.academicYears
                          ? labels.loading[lang]
                          : `${labels.select[lang]} ${labels.academicYear[lang]}`}
                      </option>
                      {academicYears.map((year) => (
                        <option key={year._id} value={year._id}>
                          {year.name}
                        </option>
                      ))}
                    </select>
                    {errors.batches?.[index]?.academicYearId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.batches[index]?.academicYearId?.message}
                      </p>
                    )}
                  </div>

                  {/* Batch (Dependent) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {labels.batch[lang]}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      {...register(`batches.${index}.batchId`)}
                      disabled={
                        !watch(`batches.${index}.academicYearId`) ||
                        loadingStates.batches[index]
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {!watch(`batches.${index}.academicYearId`)
                          ? labels.selectAcademicYear[lang]
                          : loadingStates.batches[index]
                          ? labels.loading[lang]
                          : `${labels.select[lang]} ${labels.batch[lang]}`}
                      </option>
                      {batches[index]?.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                    {errors.batches?.[index]?.batchId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.batches[index]?.batchId?.message}
                      </p>
                    )}
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {labels.rollNo[lang]}
                    </label>
                    <input
                      type="text"
                      {...register(`batches.${index}.rollNo`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Modules (Multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {labels.modules[lang]}
                    </label>
                    <select
                      {...register(`batches.${index}.modules`)}
                      multiple
                      size={4}
                      disabled={loadingStates.modules}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {modules.map((module) => (
                        <option key={module._id} value={module._id}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Hold Ctrl/Cmd to select multiple
                    </p>
                  </div>

                  {/* Subjects (Multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {labels.subjects[lang]}
                    </label>
                    <select
                      {...register(`batches.${index}.subjects`)}
                      multiple
                      size={4}
                      disabled={loadingStates.subjects}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Hold Ctrl/Cmd to select multiple
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.batches && typeof errors.batches === 'object' && !Array.isArray(errors.batches) && (
            <p className="text-sm text-red-600">{errors.batches.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labels.notes[lang]}
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Library Borrower Request */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('libraryBorrowerRequest')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {labels.libraryBorrower[lang]}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {labels.cancel[lang]}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <AlertCircle size={16} className="animate-spin" />
                {labels.approving[lang]}
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {labels.approve[lang]}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Key Features

### 1. **Dependent Select Pattern**

The batch dropdown depends on the selected academic year:

```typescript
// Watch academic year changes
const watchedAcademicYears = watch('batches').map((b) => b.academicYearId);

// Reload batches when academic year changes
useEffect(() => {
  watchedAcademicYears.forEach((yearId, index) => {
    if (yearId && !batches[index]) {
      loadBatches(index, yearId);
    }
  });
}, [watchedAcademicYears]);

// Handle academic year change
const handleAcademicYearChange = (index: number, value: string) => {
  setValue(`batches.${index}.academicYearId`, value);
  setValue(`batches.${index}.batchId`, ''); // Reset dependent field
  setBatches((prev) => {
    const newBatches = { ...prev };
    delete newBatches[index]; // Clear old options
    return newBatches;
  });
};
```

### 2. **Array Field Management**

Add/remove batch enrollments dynamically:

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'batches',
});

// Add new batch
const handleAddBatch = () => {
  append({
    isActive: false,
    academicYearId: '',
    batchId: '',
    rollNo: '',
    modules: [],
    subjects: [],
  });
};

// Remove batch
<button onClick={() => remove(index)}>Remove</button>
```

### 3. **Multi-Select Fields**

Modules and subjects support multiple selection:

```typescript
<select
  {...register(`batches.${index}.modules`)}
  multiple
  size={4}
  className="..."
>
  {modules.map((module) => (
    <option key={module._id} value={module._id}>
      {module.name}
    </option>
  ))}
</select>
```

### 4. **Loading States**

Track loading state for each dropdown independently:

```typescript
const [loadingStates, setLoadingStates] = useState({
  academicYears: false,
  batches: {} as Record<number, boolean>, // Per-index loading
  modules: false,
  subjects: false,
});
```

### 5. **Multi-Language Support**

All labels support English and Myanmar:

```typescript
const labels = {
  admissionNumber: { en: 'Admission Number', mm: 'ဝင်ခွင့်အမှတ်စဉ်' },
  batches: { en: 'Batch Enrollments', mm: 'အသုတ်စာရင်းများ' },
  // ... more labels
};

// Usage
<label>{labels.admissionNumber[currentLanguage]}</label>
```

---

## Server Action

**File**: `appModules/students/server-actions/student-actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function submitApproveStudent(
  studentId: string,
  data: {
    admissionNumber?: string;
    batches?: Array<{
      isActive?: boolean;
      academicYearId: string;
      batchId: string;
      rollNo?: string;
      modules?: string[];
      subjects?: string[];
    }>;
    notes?: string;
    libraryBorrowerRequest?: boolean;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.CPMS_SERVICE_URL}/students/${studentId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to approve student',
      };
    }

    revalidatePath('/cpms/students');

    return {
      success: true,
      message: 'Student approved successfully',
    };
  } catch (error) {
    console.error('Approve student error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
```

---

## Advantages of Pre-Built Approach

### ✅ **Full Control**
- Complete control over HTML structure
- Custom styling and layouts
- Complex interactions and business logic

### ✅ **Performance**
- No runtime schema parsing
- Optimized component rendering
- Direct API calls without abstraction

### ✅ **Type Safety**
- Full TypeScript support
- Compile-time type checking
- Autocomplete in IDE

### ✅ **Easier Debugging**
- Direct code inspection
- Standard React debugging tools
- Clear error messages

### ✅ **Custom Features**
- Complex conditional logic
- Custom validation rules
- Special UI interactions

---

## Comparison: Schema-Driven vs Pre-Built

| Aspect | Schema-Driven | Pre-Built |
|--------|---------------|-----------|
| **Setup Time** | Fast (backend only) | Slower (component coding) |
| **Flexibility** | Limited to schema | Full flexibility |
| **Maintenance** | Backend config only | Component updates needed |
| **Type Safety** | Runtime only | Compile-time |
| **Performance** | Slower (runtime parsing) | Faster (direct rendering) |
| **Learning Curve** | Understand schema system | Standard React |
| **Custom Logic** | Difficult | Easy |
| **Reusability** | High (schema reuse) | Low (component specific) |
| **Best For** | Simple forms | Complex forms |

---

## Testing

### Unit Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApproveStudentForm } from './ApproveStudentForm';

describe('ApproveStudentForm', () => {
  it('renders all form fields', () => {
    render(
      <ApproveStudentForm
        studentId="123"
        currentLanguage="en"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Admission Number')).toBeInTheDocument();
    expect(screen.getByText('Batch Enrollments')).toBeInTheDocument();
    expect(screen.getByText('Approval Notes')).toBeInTheDocument();
  });

  it('handles batch addition', async () => {
    render(
      <ApproveStudentForm
        studentId="123"
        currentLanguage="en"
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const addButton = screen.getByText('Add Batch');
    await userEvent.click(addButton);

    expect(screen.getAllByText(/Batch Enrollment #/)).toHaveLength(2);
  });
});
```

---

## Migration Checklist

- [x] Backend config updated to `formApproach: 'pre-built'`
- [x] Backend config has `formName: 'approveStudentForm'`
- [x] Removed `formFields` array from config
- [ ] Created `ApproveStudentForm.tsx` component
- [ ] Registered component in pre-built forms index
- [ ] Updated `ExtraActionFormRouter` to handle pre-built forms
- [ ] Created server action for form submission
- [ ] Tested form in student list page
- [ ] Verified dependent select behavior
- [ ] Tested multi-language support
- [ ] Added unit tests

---

## Summary

The student approve form has been successfully converted from **schema-driven** to **pre-built** approach:

✅ **Backend**: Updated config to use `formApproach: 'pre-built'` and `formName: 'approveStudentForm'`

✅ **Component**: Complete React component with:
- Array field management (batch enrollments)
- Dependent select (batch depends on academic year)
- Multi-select fields (modules, subjects)
- Full validation with Zod
- Multi-language support
- Loading states
- Error handling

✅ **Benefits**:
- Full customization control
- Better performance
- Type safety
- Easier debugging

The form is now ready for frontend implementation!
