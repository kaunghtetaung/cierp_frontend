# Student Approve ExtraActionForm - Frontend Implementation Guide

## Overview

This guide provides a complete implementation reference for the **Student Approval Form** (`approveStudent` ExtraActionForm) in the frontend. This form uses the **schema-driven approach**, meaning the form is dynamically generated from the backend configuration rather than being hard-coded.

## Table of Contents

1. [Backend Configuration](#backend-configuration)
2. [Frontend Architecture](#frontend-architecture)
3. [Component Structure](#component-structure)
4. [Field Types Implementation](#field-types-implementation)
5. [Data Flow](#data-flow)
6. [API Integration](#api-integration)
7. [Validation](#validation)
8. [Styling Guide](#styling-guide)
9. [Testing](#testing)
10. [Common Issues](#common-issues)

---

## Backend Configuration

**Location**: `/workspace/apps/core/src/cpms/initialize/cpms-initialize.config.ts` (Lines 1011-1132)

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
  formApproach: 'schema-driven',  // ← KEY: Uses dynamic form generation
  formWidth: 'xl',
  formLayout: 'vertical',
  formFields: [...],  // See detailed breakdown below
  submitButtonText: { en: 'Approve Student', mm: 'ကျောင်းသား အတည်ပြုမည်' },
  cancelButtonText: { en: 'Cancel', mm: 'မလုပ်တော့ပါ' },
  requiresSelection: false,
  buttonStyle: 'primary',
  permission: 'update'
}
```

### Form Fields Breakdown

The form contains 4 main fields:

1. **admissionNumber** (text) - Optional, auto-generated if empty
2. **batches** (arrayField) - Array of batch enrollments with nested fields
3. **notes** (textArea) - Approval notes
4. **libraryBorrowerRequest** (checkbox) - Create library account

---

## Frontend Architecture

### File Structure (Assumed Frontend Location)

```
frontend/
├── libs/
│   └── schema-forms/
│       ├── DynamicExtraActionForm.tsx         # Main form renderer
│       ├── ExtraActionFormRouter.tsx          # Routes to correct form
│       ├── FormFieldRenderer.tsx              # Renders individual fields
│       ├── fields/
│       │   ├── ArrayField.tsx                 # Array field container
│       │   ├── TextField.tsx                  # Text input
│       │   ├── TextAreaField.tsx              # Textarea
│       │   ├── CheckboxField.tsx              # Checkbox
│       │   ├── DynamicSelect.tsx              # API-driven select
│       │   └── DependentSelect.tsx            # Cascading select
│       └── components/
│           ├── BatchEnrollmentItem.tsx        # Row component for batches
│           └── ArrayFieldItem.tsx             # Generic array row
├── appModules/
│   └── students/
│       ├── StudentList.tsx                    # Table with action buttons
│       └── server-actions/
│           └── student-actions.ts             # submitApproveStudent()
└── types/
    └── student.types.ts                       # TypeScript interfaces
```

### Component Hierarchy

```
StudentList (Table)
  └─ ModuleDataTable
      └─ ExtraActionButton (Approve Student)
          └─ ExtraActionFormRouter
              └─ DynamicExtraActionForm
                  ├─ TextField (admissionNumber)
                  ├─ ArrayField (batches)
                  │   └─ BatchEnrollmentItem × N
                  │       ├─ CheckboxField (isActive)
                  │       ├─ DynamicSelect (academicYearId)
                  │       ├─ DependentSelect (batchId)
                  │       ├─ TextField (rollNo)
                  │       ├─ DynamicSelect (modules) [multiple]
                  │       └─ DynamicSelect (subjects) [multiple]
                  ├─ TextAreaField (notes)
                  └─ CheckboxField (libraryBorrowerRequest)
```

---

## Component Structure

### 1. DynamicExtraActionForm.tsx

**Purpose**: Main container that renders the entire form based on schema

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormFieldRenderer } from './FormFieldRenderer';
import { generateValidationSchema } from './utils/validation';

interface DynamicExtraActionFormProps {
  actionConfig: ExtraActionForm;
  currentLanguage: 'en' | 'mm';
  selectedItemId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function DynamicExtraActionForm({
  actionConfig,
  currentLanguage,
  selectedItemId,
  onSubmit,
  onCancel,
}: DynamicExtraActionFormProps) {
  // Generate Zod validation schema from formFields
  const validationSchema = generateValidationSchema(actionConfig.formFields);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
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

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {/* Form Title & Description */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {actionConfig.title[currentLanguage]}
        </h2>
        {actionConfig.description && (
          <p className="mt-2 text-sm text-gray-600">
            {actionConfig.description[currentLanguage]}
          </p>
        )}
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-4">
        {actionConfig.formFields?.map((field, index) => (
          <FormFieldRenderer
            key={field.fieldName}
            field={field}
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            currentLanguage={currentLanguage}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {actionConfig.cancelButtonText?.[currentLanguage] || 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Submitting...'
            : actionConfig.submitButtonText?.[currentLanguage] || 'Submit'}
        </button>
      </div>
    </form>
  );
}
```

### 2. FormFieldRenderer.tsx

**Purpose**: Routes each field to the appropriate component based on `fieldType`

```tsx
import React from 'react';
import { Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormField } from '@/types/module-schema.types';

import { TextField } from './fields/TextField';
import { TextAreaField } from './fields/TextAreaField';
import { CheckboxField } from './fields/CheckboxField';
import { ArrayField } from './fields/ArrayField';

interface FormFieldRendererProps {
  field: FormField;
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  currentLanguage: 'en' | 'mm';
  parentPath?: string; // For nested fields (e.g., "batches[0]")
}

export function FormFieldRenderer({
  field,
  register,
  control,
  errors,
  watch,
  setValue,
  currentLanguage,
  parentPath = '',
}: FormFieldRendererProps) {
  const fieldPath = parentPath ? `${parentPath}.${field.fieldName}` : field.fieldName;

  switch (field.fieldType) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <TextField
          field={field}
          register={register}
          errors={errors}
          currentLanguage={currentLanguage}
          fieldPath={fieldPath}
        />
      );

    case 'textArea':
      return (
        <TextAreaField
          field={field}
          register={register}
          errors={errors}
          currentLanguage={currentLanguage}
          fieldPath={fieldPath}
        />
      );

    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          register={register}
          errors={errors}
          currentLanguage={currentLanguage}
          fieldPath={fieldPath}
        />
      );

    case 'arrayField':
      return (
        <ArrayField
          field={field}
          control={control}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          currentLanguage={currentLanguage}
          fieldPath={fieldPath}
        />
      );

    default:
      return (
        <div className="text-red-500">
          Unknown field type: {field.fieldType}
        </div>
      );
  }
}
```

### 3. ArrayField.tsx

**Purpose**: Manages array of items (batch enrollments) with add/remove functionality

```tsx
import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/types/module-schema.types';
import { FormFieldRenderer } from '../FormFieldRenderer';

interface ArrayFieldProps {
  field: FormField;
  control: Control<any>;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  currentLanguage: 'en' | 'mm';
  fieldPath: string;
}

export function ArrayField({
  field,
  control,
  register,
  errors,
  watch,
  setValue,
  currentLanguage,
  fieldPath,
}: ArrayFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldPath,
  });

  const handleAddItem = () => {
    // Create default values for new item
    const defaultItem: any = {};
    field.children?.forEach((childField) => {
      if (childField.fieldType === 'checkbox') {
        defaultItem[childField.fieldName] = false;
      } else if (childField.defaultValue !== undefined) {
        defaultItem[childField.fieldName] = childField.defaultValue;
      } else {
        defaultItem[childField.fieldName] = '';
      }
    });
    append(defaultItem);
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {field.label[currentLanguage]}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          <Plus size={16} />
          Add {field.label.en}
        </button>
      </div>

      {/* Array Items */}
      <div className="space-y-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
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

            {/* Item Number */}
            <div className="mb-3 text-sm font-medium text-gray-600">
              {field.label.en} #{index + 1}
            </div>

            {/* Nested Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field.children?.map((childField) => (
                <FormFieldRenderer
                  key={childField.fieldName}
                  field={childField}
                  register={register}
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  currentLanguage={currentLanguage}
                  parentPath={`${fieldPath}[${index}]`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errors[fieldPath] && (
        <p className="text-sm text-red-600">
          {errors[fieldPath]?.message}
        </p>
      )}
    </div>
  );
}
```

---

## Field Types Implementation

### 1. TextField Component

```tsx
import React from 'react';
import { FormField } from '@/types/module-schema.types';

interface TextFieldProps {
  field: FormField;
  register: any;
  errors: any;
  currentLanguage: 'en' | 'mm';
  fieldPath: string;
}

export function TextField({
  field,
  register,
  errors,
  currentLanguage,
  fieldPath,
}: TextFieldProps) {
  const error = fieldPath.split('.').reduce((obj, key) => obj?.[key], errors);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label[currentLanguage]}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.fieldType === 'number' ? 'number' : 'text'}
        {...register(fieldPath, { required: field.required })}
        placeholder={field.placeHolder?.[currentLanguage] || ''}
        disabled={field.readonly}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">
          {field.helpText[currentLanguage]}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}
```

### 2. DynamicSelect Component

```tsx
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { FormField } from '@/types/module-schema.types';
import { fetchDynamicOptions } from '@/lib/api';

interface DynamicSelectProps {
  field: FormField;
  control: any;
  errors: any;
  currentLanguage: 'en' | 'mm';
  fieldPath: string;
}

export function DynamicSelect({
  field,
  control,
  errors,
  currentLanguage,
  fieldPath,
}: DynamicSelectProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field.dataSource) {
      loadOptions();
    }
  }, []);

  const loadOptions = async (searchTerm = '') => {
    if (!field.dataSource) return;

    setLoading(true);
    try {
      const data = await fetchDynamicOptions({
        endpoint: field.dataSource.endpoint,
        serviceName: field.dataSource.serviceName || 'cpms',
        searchParam: field.dataSource.searchParam || 'search',
        searchTerm,
      });

      setOptions(data);
    } catch (error) {
      console.error('Failed to load options:', error);
    } finally {
      setLoading(false);
    }
  };

  const error = fieldPath.split('.').reduce((obj, key) => obj?.[key], errors);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label[currentLanguage]}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <Controller
        name={fieldPath}
        control={control}
        rules={{ required: field.required }}
        render={({ field: { onChange, value } }) => (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {loading ? 'Loading...' : `Select ${field.label.en}`}
            </option>
            {options.map((option) => (
              <option
                key={option[field.dataSource?.valueField || '_id']}
                value={option[field.dataSource?.valueField || '_id']}
              >
                {option[field.dataSource?.labelField || 'name']}
              </option>
            ))}
          </select>
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}
```

### 3. DependentSelect Component

**Key Feature**: Watches parent field and reloads options when parent changes

```tsx
import React, { useEffect, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { FormField } from '@/types/module-schema.types';
import { fetchDynamicOptions } from '@/lib/api';

interface DependentSelectProps {
  field: FormField;
  control: any;
  errors: any;
  currentLanguage: 'en' | 'mm';
  fieldPath: string;
  parentPath?: string; // For array context
}

export function DependentSelect({
  field,
  control,
  errors,
  currentLanguage,
  fieldPath,
  parentPath = '',
}: DependentSelectProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Watch the dependent field value
  const dependentFieldName = field.dataSource?.dependentField;
  const dependentFieldPath = parentPath
    ? `${parentPath}.${dependentFieldName}`
    : dependentFieldName;

  const dependentValue = useWatch({
    control,
    name: dependentFieldPath || '',
  });

  // Reload options when dependent field changes
  useEffect(() => {
    if (dependentValue) {
      loadOptions(dependentValue);
    } else {
      setOptions([]);
    }
  }, [dependentValue]);

  const loadOptions = async (filterValue: string) => {
    if (!field.dataSource) return;

    setLoading(true);
    try {
      const data = await fetchDynamicOptions({
        endpoint: field.dataSource.endpoint,
        serviceName: field.dataSource.serviceName || 'cpms',
        searchParam: field.dataSource.searchParam || 'search',
        filters: {
          [dependentFieldName!]: filterValue, // Filter by parent field
        },
      });

      setOptions(data);
    } catch (error) {
      console.error('Failed to load dependent options:', error);
    } finally {
      setLoading(false);
    }
  };

  const error = fieldPath.split('.').reduce((obj, key) => obj?.[key], errors);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label[currentLanguage]}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <Controller
        name={fieldPath}
        control={control}
        rules={{ required: field.required }}
        render={({ field: { onChange, value } }) => (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={!dependentValue || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {!dependentValue
                ? `Select ${field.dataSource?.dependentField} first`
                : loading
                ? 'Loading...'
                : `Select ${field.label.en}`}
            </option>
            {options.map((option) => (
              <option
                key={option[field.dataSource?.valueField || '_id']}
                value={option[field.dataSource?.valueField || '_id']}
              >
                {option[field.dataSource?.labelField || 'name']}
              </option>
            ))}
          </select>
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}
```

---

## Data Flow

### 1. Form Initialization Flow

```
Student Table
  ↓
User clicks "Approve" button on student row
  ↓
ExtraActionFormRouter loads action config by actionKey
  ↓
DynamicExtraActionForm receives:
  - actionConfig (from backend)
  - selectedItemId (student._id)
  - currentLanguage ('en' or 'mm')
  ↓
Form initializes with default values:
  - admissionNumber: ''
  - batches: [{ isActive: true, academicYearId: '', ... }]
  - notes: ''
  - libraryBorrowerRequest: true
```

### 2. Field Interaction Flow (Dependent Select)

```
User selects Academic Year
  ↓
academicYearId value changes in form state
  ↓
DependentSelect (batchId) watches academicYearId via useWatch
  ↓
useEffect detects change → triggers loadOptions(academicYearId)
  ↓
API call: GET /cpms/batches/ref?academicYearId={value}
  ↓
Options updated in DependentSelect state
  ↓
Dropdown shows filtered batches
```

### 3. Form Submission Flow

```
User fills form → clicks "Approve Student"
  ↓
React Hook Form validates with Zod schema
  ↓
If valid: handleFormSubmit(data)
  ↓
Server Action: submitApproveStudent(studentId, data)
  ↓
API Call: POST /cpms/students/{id}/approve
  ↓
Backend processes:
  - Validates ApproveStudentDto
  - Updates student.registrationStatus = 'approved'
  - Sets student.admissionNumber
  - Updates student.batches array
  - Creates library borrower (if requested)
  ↓
Success response
  ↓
Modal closes → Table refreshes → Shows updated student
```

---

## API Integration

### API Service Helper

**File**: `lib/api.ts`

```typescript
interface FetchDynamicOptionsParams {
  endpoint: string;
  serviceName: 'cpms' | 'core' | 'library';
  searchParam?: string;
  searchTerm?: string;
  filters?: Record<string, any>;
}

const SERVICE_URLS = {
  cpms: process.env.NEXT_PUBLIC_CPMS_URL || 'http://localhost:3337',
  core: process.env.NEXT_PUBLIC_CORE_URL || 'http://localhost:3334',
  library: process.env.NEXT_PUBLIC_LIBRARY_URL || 'http://localhost:3336',
};

export async function fetchDynamicOptions({
  endpoint,
  serviceName,
  searchParam = 'search',
  searchTerm = '',
  filters = {},
}: FetchDynamicOptionsParams): Promise<any[]> {
  const baseUrl = SERVICE_URLS[serviceName];

  // Build query parameters
  const params = new URLSearchParams();
  if (searchTerm) {
    params.set(searchParam, searchTerm);
  }

  // Add filter parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': getTenantId(), // Your tenant ID logic
      Authorization: `Bearer ${getAuthToken()}`, // Your auth logic
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch options: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data; // Handle different response formats
}
```

### Server Action for Form Submission

**File**: `appModules/students/server-actions/student-actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';

interface ApproveStudentData {
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

export async function submitApproveStudent(
  studentId: string,
  data: ApproveStudentData
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

    const result = await response.json();

    // Revalidate the students list page
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

## Validation

### Zod Schema Generation

**File**: `libs/schema-forms/utils/validation.ts`

```typescript
import { z } from 'zod';
import { FormField } from '@/types/module-schema.types';

export function generateValidationSchema(fields?: FormField[]): z.ZodObject<any> {
  if (!fields || fields.length === 0) {
    return z.object({});
  }

  const schemaFields: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    schemaFields[field.fieldName] = getFieldSchema(field);
  });

  return z.object(schemaFields);
}

function getFieldSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.fieldType) {
    case 'text':
    case 'email':
    case 'textArea':
      schema = z.string();
      if (field.fieldType === 'email') {
        schema = (schema as z.ZodString).email('Invalid email format');
      }
      break;

    case 'number':
      schema = z.number().or(z.string().transform(Number));
      break;

    case 'checkbox':
      schema = z.boolean().optional();
      break;

    case 'dynamicSelect':
    case 'dependentSelect':
      schema = field.multiple
        ? z.array(z.string())
        : z.string();
      break;

    case 'arrayField':
      if (field.children) {
        const childSchema = generateValidationSchema(field.children);
        schema = z.array(childSchema);
      } else {
        schema = z.array(z.any());
      }
      break;

    default:
      schema = z.any();
  }

  // Apply required constraint
  if (field.required && !['checkbox', 'arrayField'].includes(field.fieldType)) {
    schema = (schema as z.ZodString).min(1, `${field.label.en} is required`);
  }

  // Make optional if not required
  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
}
```

### Example Generated Schema

For the approveStudent form, this generates:

```typescript
const approveStudentSchema = z.object({
  admissionNumber: z.string().optional(),
  batches: z.array(
    z.object({
      isActive: z.boolean().optional(),
      academicYearId: z.string().min(1, 'Academic Year is required'),
      batchId: z.string().min(1, 'Batch is required'),
      rollNo: z.string().optional(),
      modules: z.array(z.string()).optional(),
      subjects: z.array(z.string()).optional(),
    })
  ),
  notes: z.string().optional(),
  libraryBorrowerRequest: z.boolean().optional(),
});
```

---

## Styling Guide

### Tailwind CSS Classes

**Form Container**:
```css
.form-container {
  @apply space-y-6 p-6 bg-white rounded-lg;
}
```

**Form Field**:
```css
.form-field {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md
         focus:outline-none focus:ring-2 focus:ring-blue-500
         disabled:bg-gray-100 disabled:cursor-not-allowed;
}

.form-error {
  @apply mt-1 text-sm text-red-600;
}

.form-help-text {
  @apply mt-1 text-xs text-gray-500;
}
```

**Array Field Item**:
```css
.array-item {
  @apply relative p-4 bg-gray-50 border border-gray-200 rounded-lg;
}

.array-item-header {
  @apply mb-3 text-sm font-medium text-gray-600;
}

.array-remove-btn {
  @apply absolute top-2 right-2 p-1.5 text-red-600
         hover:bg-red-50 rounded transition-colors;
}
```

**Action Buttons**:
```css
.btn-primary {
  @apply px-4 py-2 text-sm font-medium text-white
         bg-blue-600 rounded-md hover:bg-blue-700
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply px-4 py-2 text-sm font-medium text-gray-700
         bg-white border border-gray-300 rounded-md
         hover:bg-gray-50;
}
```

---

## Testing

### Unit Tests

**File**: `libs/schema-forms/__tests__/DynamicExtraActionForm.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicExtraActionForm } from '../DynamicExtraActionForm';

const mockActionConfig = {
  actionKey: 'approveStudent',
  title: { en: 'Approve Student', mm: 'ကျောင်းသားအတည်ပြုခြင်း' },
  endpoint: '/:id/approve',
  method: 'POST',
  formType: 'modal',
  formApproach: 'schema-driven',
  formFields: [
    {
      fieldName: 'admissionNumber',
      fieldType: 'text',
      label: { en: 'Admission Number', mm: 'ဝင်ခွင့်အမှတ်စဉ်' },
      required: false,
    },
  ],
};

describe('DynamicExtraActionForm', () => {
  it('renders form fields correctly', () => {
    render(
      <DynamicExtraActionForm
        actionConfig={mockActionConfig}
        currentLanguage="en"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Approve Student')).toBeInTheDocument();
    expect(screen.getByLabelText('Admission Number')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const onSubmit = jest.fn();
    render(
      <DynamicExtraActionForm
        actionConfig={mockActionConfig}
        currentLanguage="en"
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Admission Number');
    await userEvent.type(input, 'ADM-2024-001');

    const submitBtn = screen.getByText('Submit');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        admissionNumber: 'ADM-2024-001',
      });
    });
  });
});
```

### Integration Tests

**File**: `appModules/students/__tests__/StudentApproval.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentList } from '../StudentList';

// Mock API responses
jest.mock('@/lib/api', () => ({
  fetchDynamicOptions: jest.fn().mockResolvedValue([
    { _id: '1', name: '2024-2025' },
    { _id: '2', name: 'Batch 1' },
  ]),
}));

describe('Student Approval Flow', () => {
  it('opens approval form and submits successfully', async () => {
    render(<StudentList />);

    // Click approve button on first student
    const approveBtn = screen.getAllByText('Approve')[0];
    await userEvent.click(approveBtn);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Approve Student')).toBeInTheDocument();
    });

    // Fill form
    const academicYearSelect = screen.getByLabelText('Academic Year');
    await userEvent.selectOptions(academicYearSelect, '1');

    const batchSelect = screen.getByLabelText('Batch');
    await userEvent.selectOptions(batchSelect, '2');

    // Submit
    const submitBtn = screen.getByText('Approve Student');
    await userEvent.click(submitBtn);

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Student approved successfully')).toBeInTheDocument();
    });
  });
});
```

---

## Common Issues

### Issue 1: Dependent Select Not Loading Options

**Problem**: When selecting academic year, batch dropdown stays disabled/empty

**Solution**:
1. Check that `dependentField` matches the exact field name
2. Ensure the parent field path is correctly calculated in array contexts
3. Verify API endpoint returns data in expected format
4. Check browser console for API errors

```typescript
// Correct path calculation in array context
const dependentFieldPath = parentPath
  ? `${parentPath}.${dependentFieldName}`  // "batches[0].academicYearId"
  : dependentFieldName;                     // "academicYearId"
```

### Issue 2: Array Field Not Adding Items

**Problem**: Clicking "Add" button doesn't add new rows

**Solution**:
1. Ensure `useFieldArray` is called with correct field name
2. Check that default values include all required child fields
3. Verify `append()` function is properly bound

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'batches', // Must match field name exactly
});
```

### Issue 3: Form Validation Not Working

**Problem**: Form submits even with required fields empty

**Solution**:
1. Check Zod schema generation includes required constraints
2. Ensure React Hook Form `resolver` is set
3. Verify field registration uses correct path

```typescript
const { register, handleSubmit } = useForm({
  resolver: zodResolver(validationSchema), // Must be set
});
```

### Issue 4: Multi-Language Not Displaying

**Problem**: Only English labels show, Myanmar text missing

**Solution**:
1. Verify `currentLanguage` prop is passed down correctly
2. Check all `MultilingualText` objects have both `en` and `mm` keys
3. Ensure language switcher updates the prop

```typescript
// Correct access
{field.label[currentLanguage]}

// Wrong - hardcoded
{field.label.en}
```

### Issue 5: API Calls Failing with CORS

**Problem**: Browser console shows CORS errors

**Solution**:
1. Ensure backend CORS is configured for frontend domain
2. Add proper headers in API calls
3. Check service URLs in environment variables

```typescript
// In backend (NestJS)
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## Summary Checklist

### Backend Configuration ✓
- [x] ExtraActionForm defined with `formApproach: 'schema-driven'`
- [x] FormFields use correct `fieldType` values (arrayField, dependentSelect, etc.)
- [x] All field types have `as const` assertions
- [x] DataSource endpoints configured correctly
- [x] DependentField references match field names
- [x] API endpoint exists: `POST /students/:id/approve`

### Frontend Implementation
- [ ] DynamicExtraActionForm component created
- [ ] FormFieldRenderer routes all field types
- [ ] ArrayField component handles add/remove
- [ ] DependentSelect watches parent field with useWatch
- [ ] DynamicSelect loads options from API
- [ ] Validation schema generated from formFields
- [ ] Server action for form submission created
- [ ] API service helper functions implemented
- [ ] Proper error handling and loading states
- [ ] Multi-language support throughout

### Testing
- [ ] Unit tests for all field components
- [ ] Integration test for full approval flow
- [ ] E2E test for user journey
- [ ] API mocking for consistent tests

### Deployment
- [ ] Environment variables configured
- [ ] Service URLs correct
- [ ] CORS enabled on backend
- [ ] Authorization headers included in API calls

---

## Additional Resources

- **Backend DTO**: `/workspace/apps/core/src/cpms/students/dto/approve-student.dto.ts`
- **Backend Controller**: `/workspace/apps/core/src/cpms/students/student.controller.ts` (Line 181)
- **Backend Service**: `/workspace/apps/core/src/cpms/students/student.service.ts`
- **Schema Interfaces**: `/workspace/libs/nest/src/dtos/module-schema.dto.ts`

---

**Document Version**: 1.0
**Last Updated**: 2024
**Maintained By**: Development Team
