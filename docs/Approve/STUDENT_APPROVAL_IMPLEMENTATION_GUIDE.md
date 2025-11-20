# Student Approval Module - Complete Implementation Guide

## Overview

This guide covers the complete implementation of the student approval system with module-based learning support. The system allows administrators to approve student registrations and configure batch enrollments with support for three learning modes: **subject-based**, **module-based**, and **hybrid**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Learning Modes Explained](#learning-modes-explained)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Integration](#frontend-integration)
6. [API Reference](#api-reference)
7. [Workflow Examples](#workflow-examples)
8. [Testing Guide](#testing-guide)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │ Student List   │  │ Approval Modal   │                  │
│  │ - Table View   │  │ - Dynamic Form   │                  │
│  │ - Filters      │  │ - Conditional    │                  │
│  │ - Actions      │  │   Fields         │                  │
│  └────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (NestJS/CPMS)                        │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │ StudentController│  │ StudentService                 │  │
│  │ - Routes         │  │ - Business Logic               │  │
│  │ - Validation     │  │ - Approval Processing          │  │
│  └──────────────────┘  │ - Auto-populate Subjects       │  │
│           │             └────────────────────────────────┘  │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │ BatchService     │  │ StudentRepository              │  │
│  │ - Batch Details  │  │ - Data Access                  │  │
│  │ - Subjects Ref   │  │ - MongoDB Operations           │  │
│  │ - Modules Ref    │  └────────────────────────────────┘  │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                         │
│  ┌──────────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐ │
│  │ students     │  │ batches  │  │modules │  │ subjects │ │
│  └──────────────┘  └──────────┘  └────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Learning Modes Explained

### 1. Subject-Based Learning

**Description**: Students are enrolled in individual subjects directly.

**Example**: Traditional university system where students select courses like "Mathematics 101", "Physics 201", etc.

**Form Behavior**:
- ✅ Shows `subjects` arrayField
- ❌ Hides `modules` arrayField

**Data Structure**:
```json
{
  "batches": [{
    "batchId": "batch123",
    "subjects": [
      { "subjectId": "subj1", "subjectName": "Mathematics" },
      { "subjectId": "subj2", "subjectName": "Physics" }
    ],
    "modules": []  // Empty
  }]
}
```

---

### 2. Module-Based Learning

**Description**: Students are enrolled in modules that contain multiple subjects with integrated assessment.

**Example**: Medical school where "Basic Sciences Module" contains Anatomy (50%) + Physiology (50%).

**Key Characteristics**:
- Module mark = sum of subject marks
- Hours/attendance tracked at subject level
- Module assessment is integrated across all subjects
- Subjects are **auto-populated** from module configuration

**Form Behavior**:
- ✅ Shows `modules` arrayField
- ❌ Hides `subjects` arrayField
- ⚙️ **Backend auto-fills subjects from selected modules**

**Data Structure**:
```json
{
  "batches": [{
    "batchId": "batch123",
    "modules": [
      {
        "moduleId": "mod1",
        "moduleName": "Basic Sciences",
        "subjects": [  // Auto-populated by backend!
          { "subjectId": "subj1", "subjectName": "Anatomy" },
          { "subjectId": "subj2", "subjectName": "Physiology" }
        ]
      }
    ],
    "subjects": []  // Empty
  }]
}
```

---

### 3. Hybrid Learning

**Description**: Combination of both module-based and subject-based learning.

**Example**: Program where core curriculum uses modules, but electives are individual subjects.

**Form Behavior**:
- ✅ Shows `modules` arrayField
- ✅ Shows `subjects` arrayField
- ⚙️ **Backend auto-fills subjects from selected modules**

**Data Structure**:
```json
{
  "batches": [{
    "batchId": "batch123",
    "modules": [
      {
        "moduleId": "mod1",
        "moduleName": "Core Module",
        "subjects": [  // Auto-populated
          { "subjectId": "subj1", "subjectName": "Anatomy" }
        ]
      }
    ],
    "subjects": [  // Manually selected
      { "subjectId": "subj3", "subjectName": "Elective Course" }
    ]
  }]
}
```

---

## Database Schema

### Student Schema

**Location**: `/workspace/apps/core/src/cpms/students/schemas/student.schema.ts`

#### Key Fields

```typescript
class Student {
  // Basic Info
  admissionNumber?: string;
  nameMyanmar: string;
  nameEnglish: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';

  // Batch Enrollments
  batches?: BatchEnrollment[];
}

class BatchEnrollment {
  batchId: Types.ObjectId;           // Reference to Batch
  academicYearId: Types.ObjectId;    // Reference to AcademicYear
  rollNo?: string;                   // Student's roll number
  isActive: boolean;                 // Only ONE can be active

  // Subject-based learning
  subjects?: {
    subjectId: Types.ObjectId;
    subjectName: string;
  }[];

  // Module-based learning
  modules?: {
    moduleId: Types.ObjectId;
    moduleName: string;
    subjects: {                      // Auto-populated from module
      subjectId: Types.ObjectId;
      subjectName: string;
    }[];
  }[];
}
```

#### Important Constraints

1. **Single Active Batch**: Only ONE batch enrollment can have `isActive: true`
2. **Auto-population**: When modules are selected, their subjects are automatically extracted and stored
3. **Learning Mode Validation**: The backend validates that the selected modules/subjects match the batch's learning mode

---

### Batch Schema

**Location**: `/workspace/apps/core/src/cpms/batches/schemas/batch.schema.ts`

```typescript
class Batch {
  name: string;
  code: string;
  learningMode: 'subject-based' | 'module-based' | 'hybrid';

  // Available subjects for this batch
  subjects?: {
    subjectId: Types.ObjectId;
  }[];

  // Available modules for this batch
  modules?: {
    moduleId: Types.ObjectId;
  }[];
}
```

---

### Module Schema

**Location**: `/workspace/apps/core/src/cpms/modules/schemas/module.schema.ts`

```typescript
class Module {
  name: string;
  code: string;

  // Subjects that comprise this module
  subjects?: {
    subjectId: Types.ObjectId;
    weightage?: number;  // e.g., 50% for each subject
  }[];

  totalCredits: number;
  duration: number;
  durationUnit: string;
  deliveryMode: string;
}
```

---

## Backend Implementation

### 1. Student Approval Endpoint

**File**: `/workspace/apps/core/src/cpms/students/student.controller.ts:166-178`

```typescript
@Post(':id/approve')
async approveStudent(
  @Param('id') id: string,
  @Body() dto: ApproveStudentDto,
  @OrganizationId() organizationId: string,
) {
  return this.service.approveStudent(id, dto, organizationId);
}
```

---

### 2. Approval Service Logic

**File**: `/workspace/apps/core/src/cpms/students/student.service.ts:372-510`

#### Key Steps

1. **Validate Student**
   - Check if student exists
   - Verify pending status
   - Ensure belongs to organization

2. **Validate Active Batch**
   - Only ONE batch can be marked as active
   - If a new active batch is selected, deactivate others

3. **Process Batch Enrollments**
   - For each batch:
     - Validate academicYearId and batchId
     - Generate or validate rollNo
     - **Auto-populate subjects from modules** (if module-based)
     - Store subjects and modules

4. **Update Student**
   - Set `registrationStatus` to `'approved'`
   - Generate `admissionNumber` if not provided
   - Set `approvedAt` timestamp
   - Save batch enrollments

5. **Create User Account**
   - Generate username and temporary password
   - Create borrower record for library access
   - Send approval notification email

#### Auto-Population Logic

**File**: `/workspace/apps/core/src/cpms/students/student.service.ts:432-476`

```typescript
// Process modules and auto-populate subjects from each module
if (batch.modules && batch.modules.length > 0) {
  batchRecord.modules = await Promise.all(
    batch.modules.map(async (moduleDto) => {
      // Fetch module details to get subjects
      const moduleDoc = await this.moduleModel.findById(moduleDto.moduleId).exec();

      if (!moduleDoc) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          `MODULE_NOT_FOUND: ${moduleDto.moduleId}`,
        );
      }

      // Extract subjects from module
      const moduleSubjects = moduleDoc.subjects?.map((s: any) => ({
        subjectId: s.subjectId,
        subjectName: '', // Will be populated below
      })) || [];

      // Fetch subject names
      if (moduleSubjects.length > 0) {
        const subjectIds = moduleSubjects.map((s: any) => s.subjectId);
        const subjectDocs = await this.subjectModel
          .find({ _id: { $in: subjectIds } })
          .exec();

        // Map subject names
        const subjectMap = new Map(
          subjectDocs.map((doc: any) => [doc._id.toString(), doc.name]),
        );

        moduleSubjects.forEach((s: any) => {
          s.subjectName = subjectMap.get(s.subjectId.toString()) || '';
        });
      }

      return {
        moduleId: new Types.ObjectId(moduleDto.moduleId),
        moduleName: moduleDto.moduleName,
        subjects: moduleSubjects,  // Auto-populated!
      };
    }),
  );
}
```

---

### 3. Batch Reference Endpoints

These endpoints provide filtered lists of subjects/modules based on batch configuration.

#### Batch Subjects Reference

**Endpoint**: `GET /batches/:id/subjects/ref`

**File**: `/workspace/apps/core/src/cpms/batches/batch.service.ts:409-481`

**Purpose**: Returns only subjects that are configured for a specific batch.

**Logic**:
```typescript
async findBatchSubjectsReference(batchId: string, params, tenantId: string) {
  const batch = await this.repository.findById(batchId);

  // Check if batch supports subjects
  if (!['subject-based', 'hybrid'].includes(batch.learningMode)) {
    return { data: [], total: 0, message: 'Batch does not support subjects' };
  }

  // Extract subject IDs configured for this batch
  const subjectIds = batch.subjects?.map(s => s.subjectId) || [];

  // Fetch subject details
  const subjects = await this.subjectModel.find({
    _id: { $in: subjectIds },
    organizationId: tenantId,
    deletedAt: null
  });

  return { data: subjects, total: subjects.length };
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "_id": "507f1f77bcf86cd799439011",
      "name": "Mathematics",
      "code": "MATH-101",
      "credits": 3,
      "category": "core"
    }
  ],
  "total": 1
}
```

---

#### Batch Modules Reference

**Endpoint**: `GET /batches/:id/modules/ref`

**File**: `/workspace/apps/core/src/cpms/batches/batch.service.ts:487-560`

**Purpose**: Returns only modules that are configured for a specific batch.

**Logic**: Similar to subjects reference, but filters by `learningMode: ['module-based', 'hybrid']`

**Response**:
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "_id": "507f1f77bcf86cd799439012",
      "name": "Basic Sciences",
      "code": "MOD-101",
      "totalCredits": 20,
      "duration": 12,
      "durationUnit": "weeks",
      "deliveryMode": "on-campus"
    }
  ],
  "total": 1
}
```

---

## Frontend Integration

### 1. Form Schema Configuration

**File**: `/workspace/apps/core/src/cpms/initialize/cpms-initialize.config.ts:933-1104`

The form schema is defined in the `extraActionForms` configuration and synced to MongoDB.

#### Complete Form Structure

```typescript
{
  actionKey: 'approveStudent',
  title: { en: 'Approve Student', mm: 'ကျောင်းသားအတည်ပြုခြင်း' },
  endpoint: '/:id/approve',
  method: 'POST',
  formType: 'modal',
  formWidth: 'xl',
  formFields: [
    // Admission Number
    {
      fieldName: 'admissionNumber',
      fieldType: 'text',
      label: { en: 'Admission Number', mm: 'ဝင်ခွင့်အမှတ်စဉ်' },
      required: false  // Auto-generated if empty
    },

    // Batch Enrollments (Array)
    {
      fieldName: 'batches',
      fieldType: 'arrayField',
      label: { en: 'Batch Enrollments', mm: 'အပတ်စဥ်စာရင်းသွင်းမှုများ' },
      children: [
        // Is Active Checkbox
        {
          fieldName: 'isActive',
          fieldType: 'checkbox',
          label: { en: 'Active Batch', mm: 'လက်ရှိအသုတ်' },
          defaultValue: false,
          helpText: { en: 'Only one batch can be active' }
        },

        // Academic Year (Required)
        {
          fieldName: 'academicYearId',
          fieldType: 'dynamicSelect',
          label: { en: 'Academic Year', mm: 'ပညာသင်နှစ်' },
          dataSource: {
            endpoint: '/academic-years/ref',
            method: 'GET',
            labelField: 'name',
            valueField: 'id',
            serviceName: 'cpms'
          },
          validationRule: { required: true }
        },

        // Batch (Depends on Academic Year)
        {
          fieldName: 'batchId',
          fieldType: 'dependentSelect',
          label: { en: 'Batch', mm: 'အပတ်စဥ်' },
          dataSource: {
            endpoint: '/batches/ref',
            dependentField: 'academicYearId',  // Filters by academic year
            serviceName: 'cpms'
          },
          validationRule: { required: true }
        },

        // Roll Number
        {
          fieldName: 'rollNo',
          fieldType: 'text',
          label: { en: 'Roll Number', mm: 'ခုံအမှတ်' }
        },

        // MODULES (Conditional - shown for module-based/hybrid)
        {
          fieldName: 'modules',
          fieldType: 'arrayField',
          label: { en: 'Modules', mm: 'မော်ဂျူးများ' },
          conditionalDisplay: {
            dependsOn: 'batchId',
            showWhen: { learningMode: ['module-based', 'hybrid'] }
          },
          children: [
            {
              fieldName: 'moduleId',
              fieldType: 'dynamicSelect',
              label: { en: 'Module', mm: 'မော်ဂျူး' },
              dataSource: {
                endpoint: '/batches/:batchId/modules/ref',
                dependentField: 'batchId',
                serviceName: 'cpms'
              },
              validationRule: { required: true }
            },
            {
              fieldName: 'moduleName',
              fieldType: 'text',
              readOnly: true,
              autoFill: {
                sourceField: 'moduleId',
                sourceProperty: 'name'
              }
            }
          ]
        },

        // SUBJECTS (Conditional - shown for subject-based/hybrid)
        {
          fieldName: 'subjects',
          fieldType: 'arrayField',
          label: { en: 'Subjects', mm: 'ဘာသာရပ်များ' },
          conditionalDisplay: {
            dependsOn: 'batchId',
            showWhen: { learningMode: ['subject-based', 'hybrid'] }
          },
          children: [
            {
              fieldName: 'subjectId',
              fieldType: 'dynamicSelect',
              label: { en: 'Subject', mm: 'ဘာသာရပ်' },
              dataSource: {
                endpoint: '/batches/:batchId/subjects/ref',
                dependentField: 'batchId',
                serviceName: 'cpms'
              },
              validationRule: { required: true }
            },
            {
              fieldName: 'subjectName',
              fieldType: 'text',
              readOnly: true,
              autoFill: {
                sourceField: 'subjectId',
                sourceProperty: 'name'
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 2. Conditional Display Implementation

The conditional display is controlled by the `learningMode` property from the batch. Here's the complete flow:

#### Flow Diagram

```
User Action                    Backend Response               Frontend Action
═══════════════               ══════════════════             ═══════════════════

1. Select Academic Year
        │
        ▼
2. Select Batch  ────────►  GET /batches/ref  ────────►  Response includes:
   (batchId)                  ?id={batchId}                 {
                                                              "learningMode": "module-based",
                                                              "name": "MBBS Year 1",
                                                              ...
                                                            }
        │                                                      │
        ▼                                                      ▼
3. Store learningMode  ◄────────────────────────────────  Parse learningMode
        │
        ▼
4. Evaluate Conditions:
   ┌──────────────────────────────────────────────┐
   │ if learningMode = 'subject-based':           │
   │   → Show: Subjects ✅                        │
   │   → Hide: Modules ❌                         │
   ├──────────────────────────────────────────────┤
   │ if learningMode = 'module-based':            │
   │   → Show: Modules ✅                         │
   │   → Hide: Subjects ❌                        │
   ├──────────────────────────────────────────────┤
   │ if learningMode = 'hybrid':                  │
   │   → Show: Modules ✅                         │
   │   → Show: Subjects ✅                        │
   └──────────────────────────────────────────────┘
        │
        ▼
5. Render Form Fields Conditionally
```

---

#### Step 1: Batch Selection Handler

When user selects a batch, fetch its details to get the `learningMode`:

```javascript
const handleBatchChange = async (batchId, arrayIndex) => {
  try {
    // Fetch batch details including learningMode
    const response = await fetch(
      `/batches/ref?id=${batchId}`,
      {
        headers: {
          'x-tenant-id': organizationId,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const { data } = await response.json();

    if (!data || data.length === 0) {
      console.error('Batch not found');
      return;
    }

    const batch = data[0];
    const learningMode = batch.learningMode;

    // Update form state with learningMode
    updateBatchLearningMode(arrayIndex, learningMode);

  } catch (error) {
    console.error('Failed to fetch batch details:', error);
  }
};
```

---

#### Step 2: Conditional Field Display Logic

```javascript
/**
 * Determines if modules field should be shown
 * @param {string} learningMode - 'subject-based', 'module-based', or 'hybrid'
 * @returns {boolean}
 */
const shouldShowModules = (learningMode) => {
  return ['module-based', 'hybrid'].includes(learningMode);
};

/**
 * Determines if subjects field should be shown
 * @param {string} learningMode - 'subject-based', 'module-based', or 'hybrid'
 * @returns {boolean}
 */
const shouldShowSubjects = (learningMode) => {
  return ['subject-based', 'hybrid'].includes(learningMode);
};

// Usage in component
const BatchEnrollmentForm = ({ batch, index }) => {
  const showModules = shouldShowModules(batch.learningMode);
  const showSubjects = shouldShowSubjects(batch.learningMode);

  return (
    <div className="batch-enrollment">
      {/* Always visible fields */}
      <AcademicYearSelect {...} />
      <BatchSelect onChange={(batchId) => handleBatchChange(batchId, index)} />
      <RollNumberInput {...} />

      {/* Conditionally visible: Modules */}
      {showModules && (
        <ModulesArrayField
          batchId={batch.batchId}
          onChange={handleModulesChange}
        />
      )}

      {/* Conditionally visible: Subjects */}
      {showSubjects && (
        <SubjectsArrayField
          batchId={batch.batchId}
          onChange={handleSubjectsChange}
        />
      )}
    </div>
  );
};
```

---

#### Step 3: React State Management Example

```javascript
import { useState, useEffect } from 'react';

const StudentApprovalForm = ({ studentId }) => {
  const [formData, setFormData] = useState({
    admissionNumber: '',
    batches: [
      {
        isActive: false,
        academicYearId: '',
        batchId: '',
        rollNo: '',
        learningMode: null,  // ⭐ Stored from batch response
        modules: [],
        subjects: []
      }
    ]
  });

  /**
   * Updates learningMode when batch is selected
   */
  const updateBatchLearningMode = (batchIndex, learningMode) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.map((batch, idx) =>
        idx === batchIndex
          ? { ...batch, learningMode }
          : batch
      )
    }));
  };

  /**
   * Handles batch selection and fetches learningMode
   */
  const handleBatchSelect = async (batchId, batchIndex) => {
    // Update batchId first
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.map((batch, idx) =>
        idx === batchIndex
          ? { ...batch, batchId }
          : batch
      )
    }));

    // Fetch batch details
    const response = await fetch(`/batches/ref?id=${batchId}`, {
      headers: { 'x-tenant-id': organizationId }
    });
    const { data } = await response.json();
    const learningMode = data[0]?.learningMode;

    // Update learningMode
    updateBatchLearningMode(batchIndex, learningMode);

    // Clear modules/subjects based on learning mode
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.map((batch, idx) =>
        idx === batchIndex
          ? {
              ...batch,
              modules: shouldShowModules(learningMode) ? batch.modules : [],
              subjects: shouldShowSubjects(learningMode) ? batch.subjects : []
            }
          : batch
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {formData.batches.map((batch, index) => (
        <div key={index} className="batch-section">
          {/* Batch Selection */}
          <BatchSelect
            value={batch.batchId}
            onChange={(batchId) => handleBatchSelect(batchId, index)}
          />

          {/* Conditional: Modules (module-based or hybrid) */}
          {shouldShowModules(batch.learningMode) && (
            <ModulesField
              batchId={batch.batchId}
              value={batch.modules}
              onChange={(modules) => updateBatchModules(index, modules)}
            />
          )}

          {/* Conditional: Subjects (subject-based or hybrid) */}
          {shouldShowSubjects(batch.learningMode) && (
            <SubjectsField
              batchId={batch.batchId}
              value={batch.subjects}
              onChange={(subjects) => updateBatchSubjects(index, subjects)}
            />
          )}
        </div>
      ))}
    </form>
  );
};
```

---

#### Step 4: Quick Reference Table

| User Action | API Call | Response Property | Frontend Updates |
|-------------|----------|-------------------|------------------|
| Select Batch | `GET /batches/ref?id={batchId}` | `learningMode` | Store in state, evaluate conditionals |
| learningMode = `'subject-based'` | - | - | Show: Subjects ✅, Hide: Modules ❌ |
| learningMode = `'module-based'` | - | - | Show: Modules ✅, Hide: Subjects ❌ |
| learningMode = `'hybrid'` | - | - | Show: Both Modules ✅ and Subjects ✅ |
| Select Module | `GET /batches/:batchId/modules/ref` | Array of modules | Populate module dropdown |
| Select Subject | `GET /batches/:batchId/subjects/ref` | Array of subjects | Populate subject dropdown |

---

#### Step 5: Form Submission

```javascript
const handleApprove = async (studentId, formData) => {
  const payload = {
    admissionNumber: formData.admissionNumber || null,
    batches: formData.batches.map(batch => ({
      isActive: batch.isActive,
      academicYearId: batch.academicYearId,
      batchId: batch.batchId,
      rollNo: batch.rollNo,

      // Include modules (backend will auto-populate subjects)
      modules: batch.modules?.map(m => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName
        // subjects will be auto-populated by backend
      })) || [],

      // Include subjects (for subject-based/hybrid)
      subjects: batch.subjects?.map(s => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName
      })) || []
    }))
  };

  const response = await fetch(`/students/${studentId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': organizationId
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    showSuccess('Student approved successfully');
    refreshStudentList();
  }
};
```

---

## API Reference

### Approve Student

**Endpoint**: `POST /students/:id/approve`

**Headers**:
```
Content-Type: application/json
x-tenant-id: {organizationId}
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "admissionNumber": "2024-001",  // Optional, auto-generated if omitted
  "batches": [
    {
      "isActive": true,
      "academicYearId": "507f1f77bcf86cd799439011",
      "batchId": "507f1f77bcf86cd799439012",
      "rollNo": "101",

      // For module-based learning
      "modules": [
        {
          "moduleId": "507f1f77bcf86cd799439013",
          "moduleName": "Basic Sciences"
          // subjects will be auto-populated
        }
      ],

      // For subject-based/hybrid learning
      "subjects": [
        {
          "subjectId": "507f1f77bcf86cd799439014",
          "subjectName": "Mathematics"
        }
      ]
    }
  ]
}
```

**Success Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "admissionNumber": "2024-001",
  "nameMyanmar": "မောင်ဇော်မင်း",
  "nameEnglish": "Mg Zaw Min",
  "registrationStatus": "approved",
  "approvedAt": "2024-01-15T10:30:00.000Z",
  "batches": [
    {
      "batchId": "507f1f77bcf86cd799439012",
      "academicYearId": "507f1f77bcf86cd799439011",
      "rollNo": "101",
      "isActive": true,
      "modules": [
        {
          "moduleId": "507f1f77bcf86cd799439013",
          "moduleName": "Basic Sciences",
          "subjects": [  // Auto-populated!
            {
              "subjectId": "507f1f77bcf86cd799439016",
              "subjectName": "Anatomy"
            },
            {
              "subjectId": "507f1f77bcf86cd799439017",
              "subjectName": "Physiology"
            }
          ]
        }
      ],
      "subjects": []
    }
  ]
}
```

**Error Responses**:

- **404 Not Found**: Student not found
  ```json
  { "statusCode": 404, "message": "STUDENT_NOT_FOUND" }
  ```

- **400 Bad Request**: Multiple active batches
  ```json
  { "statusCode": 400, "message": "MULTIPLE_ACTIVE_BATCHES" }
  ```

- **404 Not Found**: Module not found
  ```json
  { "statusCode": 404, "message": "MODULE_NOT_FOUND: {moduleId}" }
  ```

---

### Get Batch Subjects Reference

**Endpoint**: `GET /batches/:id/subjects/ref`

**Query Parameters**:
- `search` (optional): Search by subject name or code
- `limit` (optional): Number of results (default: 20)

**Headers**:
```
x-tenant-id: {organizationId}
```

**Response**:
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "_id": "507f1f77bcf86cd799439011",
      "name": "Mathematics",
      "code": "MATH-101",
      "credits": 3,
      "category": "core",
      "subjectType": "theory"
    }
  ],
  "total": 1
}
```

**Empty Response** (for module-based batch):
```json
{
  "data": [],
  "total": 0,
  "message": "This batch does not support subject-based learning"
}
```

---

### Get Batches Reference (For Batch Selection)

**Endpoint**: `GET /batches/ref`

**Purpose**: Returns list of batches for selection in the approval form. **Critically important**: This endpoint includes the `learningMode` property which the frontend uses to determine whether to show modules, subjects, or both.

**Query Parameters**:
- `search` (optional): Search by batch name or code
- `limit` (optional): Number of results (default: 20)
- `academicYearId` (optional): Filter by academic year

**Headers**:
```
x-tenant-id: {organizationId}
```

**Response**:
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "_id": "507f1f77bcf86cd799439011",
      "name": "MBBS Year 1 - 2024",
      "code": "MBBS-Y1-2024",
      "learningMode": "module-based",  // ⭐ KEY PROPERTY for frontend!
      "academicYearId": "507f1f77bcf86cd799439010",
      "courseId": "507f1f77bcf86cd799439009",
      "capacity": 50,
      "enrolledCount": 32,
      "status": "active",
      "isActive": true
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "_id": "507f1f77bcf86cd799439012",
      "name": "Engineering Batch 2024",
      "code": "ENG-2024",
      "learningMode": "subject-based",  // ⭐ Determines form behavior
      "academicYearId": "507f1f77bcf86cd799439010",
      "capacity": 100,
      "status": "active"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "_id": "507f1f77bcf86cd799439013",
      "name": "Hybrid Program 2024",
      "code": "HYB-2024",
      "learningMode": "hybrid",  // ⭐ Shows both modules AND subjects
      "academicYearId": "507f1f77bcf86cd799439010",
      "status": "active"
    }
  ],
  "total": 3
}
```

**Frontend Usage**:

```javascript
// When user selects a batch from dropdown
const handleBatchChange = async (batchId, arrayIndex) => {
  // Fetch batch details from the ref endpoint
  const response = await fetch(`/batches/ref?id=${batchId}`, {
    headers: { 'x-tenant-id': organizationId }
  });
  const { data } = await response.json();
  const batch = data[0];

  // Use learningMode to control conditional display
  const learningMode = batch.learningMode;

  // Update form state
  setFormState(prev => ({
    ...prev,
    batches: prev.batches.map((b, idx) =>
      idx === arrayIndex
        ? {
            ...b,
            learningMode,  // Store for conditional rendering
            showModules: ['module-based', 'hybrid'].includes(learningMode),
            showSubjects: ['subject-based', 'hybrid'].includes(learningMode)
          }
        : b
    )
  }));
};
```

**Learning Mode Impact on Form**:

| learningMode | Shows Modules? | Shows Subjects? |
|--------------|----------------|-----------------|
| `subject-based` | ❌ No | ✅ Yes |
| `module-based` | ✅ Yes | ❌ No |
| `hybrid` | ✅ Yes | ✅ Yes |

**Important Notes**:
1. The `learningMode` property is **essential** for the conditional display logic
2. Frontend MUST fetch this property when a batch is selected
3. The backend already includes `learningMode` in the batch reference response
4. This is implemented in: `/workspace/apps/core/src/cpms/batches/batch.service.ts:349-402`

**Implementation Details**:

The `findReference` method in BatchService includes `learningMode` in the response:

```typescript
// File: batch.service.ts
async findReference(params, accessResult, tenantId) {
  // ... query logic ...

  return {
    data: result.data.map(batch => ({
      id: batch._id,
      _id: batch._id,
      name: batch.name,
      code: batch.code,
      learningMode: batch.learningMode,  // ⭐ Included in response
      academicYearId: batch.academicYearId,
      courseId: batch.courseId,
      capacity: batch.capacity,
      enrolledCount: batch.enrolledCount,
      startDate: batch.startDate,
      endDate: batch.endDate,
      currentSemester: batch.currentSemester,
      status: batch.status,
      isActive: batch.isActive,
    })),
    total: result.total
  };
}
```

---

### Get Batch Modules Reference

**Endpoint**: `GET /batches/:id/modules/ref`

**Query Parameters**:
- `search` (optional): Search by module name or code
- `limit` (optional): Number of results (default: 20)

**Headers**:
```
x-tenant-id: {organizationId}
```

**Response**:
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "_id": "507f1f77bcf86cd799439012",
      "name": "Basic Sciences",
      "code": "MOD-101",
      "totalCredits": 20,
      "duration": 12,
      "durationUnit": "weeks",
      "deliveryMode": "on-campus"
    }
  ],
  "total": 1
}
```

---

## Workflow Examples

### Example 1: Subject-Based Learning Approval

**Scenario**: Traditional university approving a student for individual courses.

**Batch Configuration**:
```json
{
  "name": "Science Batch 2024",
  "learningMode": "subject-based",
  "subjects": [
    { "subjectId": "math101" },
    { "subjectId": "phys201" },
    { "subjectId": "chem101" }
  ]
}
```

**Approval Flow**:

1. Admin selects student from pending list
2. Clicks "Approve Student"
3. Form shows:
   - ✅ Academic Year selector
   - ✅ Batch selector
   - ✅ Roll Number field
   - ✅ **Subjects array** (shows Math 101, Physics 201, Chemistry 101)
   - ❌ Modules array (hidden)

4. Admin selects:
   - Academic Year: "2024-2025"
   - Batch: "Science Batch 2024"
   - Roll No: "101"
   - Subjects: Math 101, Physics 201

5. Submits form

**Backend Processing**:
```typescript
// Validation: learningMode = 'subject-based'
// ✅ Subjects provided → OK
// ❌ Modules empty → OK
// Saves directly without transformation
```

**Result**:
```json
{
  "batches": [{
    "batchId": "batch123",
    "subjects": [
      { "subjectId": "math101", "subjectName": "Mathematics" },
      { "subjectId": "phys201", "subjectName": "Physics" }
    ],
    "modules": []
  }]
}
```

---

### Example 2: Module-Based Learning Approval

**Scenario**: Medical school approving a student for integrated modules.

**Batch Configuration**:
```json
{
  "name": "MBBS Year 1",
  "learningMode": "module-based",
  "modules": [
    { "moduleId": "basic-sciences" }
  ]
}
```

**Module Configuration**:
```json
{
  "moduleId": "basic-sciences",
  "name": "Basic Medical Sciences",
  "subjects": [
    { "subjectId": "anatomy", "weightage": 50 },
    { "subjectId": "physiology", "weightage": 50 }
  ]
}
```

**Approval Flow**:

1. Admin selects student from pending list
2. Clicks "Approve Student"
3. Form shows:
   - ✅ Academic Year selector
   - ✅ Batch selector (returns learningMode: 'module-based')
   - ✅ Roll Number field
   - ✅ **Modules array** (shows "Basic Medical Sciences")
   - ❌ Subjects array (hidden)

4. Admin selects:
   - Academic Year: "2024-2025"
   - Batch: "MBBS Year 1"
   - Roll No: "M-2024-001"
   - Modules: "Basic Medical Sciences"

5. Submits form

**Backend Processing**:
```typescript
// 1. Receives: modules: [{ moduleId: "basic-sciences", moduleName: "..." }]
// 2. Fetches module details
// 3. Extracts subjects: ["anatomy", "physiology"]
// 4. Fetches subject names from database
// 5. Auto-populates subjects array within module
```

**Result**:
```json
{
  "batches": [{
    "batchId": "batch123",
    "modules": [
      {
        "moduleId": "basic-sciences",
        "moduleName": "Basic Medical Sciences",
        "subjects": [  // ⚙️ AUTO-POPULATED BY BACKEND!
          { "subjectId": "anatomy", "subjectName": "Anatomy" },
          { "subjectId": "physiology", "subjectName": "Physiology" }
        ]
      }
    ],
    "subjects": []
  }]
}
```

---

### Example 3: Hybrid Learning Approval

**Scenario**: Program with core modules + elective subjects.

**Batch Configuration**:
```json
{
  "name": "Engineering Year 2",
  "learningMode": "hybrid",
  "modules": [
    { "moduleId": "core-engineering" }
  ],
  "subjects": [
    { "subjectId": "elective-ai" },
    { "subjectId": "elective-robotics" }
  ]
}
```

**Approval Flow**:

1. Form shows **both** modules and subjects arrays
2. Admin selects:
   - Module: "Core Engineering" (contains Math + Physics)
   - Subjects: "AI Elective", "Robotics Elective"

3. Submits form

**Backend Processing**:
```typescript
// 1. Process modules → auto-populate subjects
// 2. Process subjects → store as-is
// 3. Save both
```

**Result**:
```json
{
  "batches": [{
    "batchId": "batch123",
    "modules": [
      {
        "moduleId": "core-engineering",
        "moduleName": "Core Engineering",
        "subjects": [  // Auto-populated
          { "subjectId": "math", "subjectName": "Mathematics" },
          { "subjectId": "physics", "subjectName": "Physics" }
        ]
      }
    ],
    "subjects": [  // Manually selected
      { "subjectId": "elective-ai", "subjectName": "AI Elective" },
      { "subjectId": "elective-robotics", "subjectName": "Robotics" }
    ]
  }]
}
```

---

## Testing Guide

### 1. Unit Tests

**Test File**: `student.service.spec.ts`

```typescript
describe('StudentService - Approve', () => {
  it('should auto-populate subjects from modules', async () => {
    const moduleId = 'mod123';
    const moduleDoc = {
      _id: moduleId,
      name: 'Test Module',
      subjects: [
        { subjectId: 'subj1' },
        { subjectId: 'subj2' }
      ]
    };

    moduleModel.findById.mockResolvedValue(moduleDoc);
    subjectModel.find.mockResolvedValue([
      { _id: 'subj1', name: 'Subject 1' },
      { _id: 'subj2', name: 'Subject 2' }
    ]);

    const result = await service.approveStudent('student123', {
      batches: [{
        batchId: 'batch123',
        modules: [{ moduleId, moduleName: 'Test Module' }]
      }]
    });

    expect(result.batches[0].modules[0].subjects).toHaveLength(2);
    expect(result.batches[0].modules[0].subjects[0].subjectName).toBe('Subject 1');
  });

  it('should enforce single active batch constraint', async () => {
    await expect(
      service.approveStudent('student123', {
        batches: [
          { batchId: 'batch1', isActive: true },
          { batchId: 'batch2', isActive: true }
        ]
      })
    ).rejects.toThrow('MULTIPLE_ACTIVE_BATCHES');
  });
});
```

---

### 2. Integration Tests

**Test Scenario**: End-to-end approval flow

```typescript
describe('POST /students/:id/approve', () => {
  it('should approve student with module-based learning', async () => {
    const student = await createPendingStudent();
    const batch = await createBatch({ learningMode: 'module-based' });
    const module = await createModule({
      subjects: [{ subjectId: subject1._id }, { subjectId: subject2._id }]
    });

    const response = await request(app)
      .post(`/students/${student._id}/approve`)
      .set('x-tenant-id', org._id)
      .send({
        batches: [{
          batchId: batch._id,
          modules: [{ moduleId: module._id, moduleName: module.name }]
        }]
      });

    expect(response.status).toBe(200);
    expect(response.body.registrationStatus).toBe('approved');
    expect(response.body.batches[0].modules[0].subjects).toHaveLength(2);
  });
});
```

---

### 3. Manual Testing Checklist

#### Subject-Based Learning
- [ ] Form hides modules field
- [ ] Form shows subjects field
- [ ] Can select multiple subjects
- [ ] Subjects are saved correctly
- [ ] No module data in database

#### Module-Based Learning
- [ ] Form shows modules field
- [ ] Form hides subjects field
- [ ] Can select multiple modules
- [ ] Modules are saved correctly
- [ ] **Subjects are auto-populated in modules.subjects**
- [ ] No subjects data at batch level

#### Hybrid Learning
- [ ] Form shows both modules and subjects
- [ ] Can select modules AND subjects
- [ ] Both are saved correctly
- [ ] Module subjects are auto-populated
- [ ] Direct subjects are saved separately

#### Active Batch Validation
- [ ] Can set one batch as active
- [ ] Cannot set multiple batches as active
- [ ] Error message shown for multiple active batches

#### API Endpoints
- [ ] `/batches/:id/subjects/ref` returns correct subjects
- [ ] `/batches/:id/modules/ref` returns correct modules
- [ ] Empty response for unsupported learning modes
- [ ] Search functionality works
- [ ] Tenant isolation works

---

## Troubleshooting

### Issue: Form not showing modules/subjects

**Cause**: Schema not synced to MongoDB

**Solution**:
```bash
# Run MongoDB update script
mongosh "mongodb://cpms_user:cpms1234@mongo:27017/ciapp?authSource=admin" \
  /workspace/scripts/update-student-approval-form.js

# Clear Redis cache
docker exec ciapp-redis-1 redis-cli FLUSHDB

# Restart CPMS service
pkill -f "nx.*serve-cpms"
make cpms
```

---

### Issue: Subjects not auto-populated

**Cause**: Module doesn't have subjects configured

**Solution**: Check module configuration
```javascript
// Module must have subjects array
{
  "moduleId": "mod123",
  "subjects": [
    { "subjectId": "subj1" }  // Required!
  ]
}
```

---

### Issue: Multiple active batches error

**Cause**: Business rule violation

**Solution**: Ensure only one batch has `isActive: true`
```javascript
{
  "batches": [
    { "batchId": "batch1", "isActive": true },   // ✅ OK
    { "batchId": "batch2", "isActive": false }   // ✅ OK
  ]
}
```

---

## Summary

The student approval system provides:

✅ **Flexible Learning Modes**: Subject-based, module-based, and hybrid
✅ **Conditional UI**: Dynamic form based on batch configuration
✅ **Auto-Population**: Backend automatically extracts subjects from modules
✅ **Validation**: Single active batch enforcement
✅ **Tenant Isolation**: Batch-specific subject/module filtering
✅ **Complete Audit Trail**: Tracks approval timestamps and user info

**Key Files**:
- Student Schema: `apps/core/src/cpms/students/schemas/student.schema.ts`
- Student Service: `apps/core/src/cpms/students/student.service.ts`
- Batch Service: `apps/core/src/cpms/batches/batch.service.ts`
- Form Config: `apps/core/src/cpms/initialize/cpms-initialize.config.ts`

**Deployment**:
1. Code changes are complete ✅
2. Database schema updated via script ✅
3. Clear Redis cache ✅
4. Restart CPMS service ⏳

The system is production-ready!
