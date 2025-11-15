# Student Profile Edit Feature - Requirements & Implementation

## Overview
Enable students to edit their registration profile when status is "pending". Currently, the form only supports initial registration (create mode).

## Current Issues
1. **Access Control**: `/profileSetup/student` redirects non-guest users away
2. **No Edit Mode**: Form doesn't fetch or pre-populate existing data
3. **Create-Only API**: Only supports POST (create), not PUT/PATCH (update)
4. **No Profile Fetch**: Missing API to retrieve existing student profile for editing

---

## Backend Requirements

### 1. API Endpoint: Get Student Profile for Editing
**Purpose**: Fetch existing student profile data to pre-populate the form

**Endpoint**: `GET /api/cpms/students/my-profile`

**Authentication**: Required (JWT token)

**Response Format**:
```json
{
  "success": true,
  "data": {
    "_id": "673e84bedd08b5a8265c5a59",
    "userId": "6908a38149b34e30eb522dae",
    "organizationId": "68d12d98e776d47ad2004f19",
    "registrationStatus": "pending",

    // Personal Information
    "nameMyanmar": "မောင်မောင်",
    "nameEnglish": "Maung Maung",
    "gender": "male",
    "dateOfBirth": "2000-01-01",
    "placeOfBirth": "Yangon",
    "ethnicity": "Bamar",
    "religion": "Buddhism",
    "bloodGroup": "O+",
    "nrcNumber": "12/OUKAMA(N)123456",
    "profilePhoto": "um1/cpms/private/common/students/photos/abc123.jpg",

    // Contact Information
    "phoneNumber": "09123456789",
    "email": "student@example.com",

    // Address Information
    "permanentAddress": "123 Main Street",
    "currentAddress": "123 Main Street",
    "stateRegionId": "state123",
    "stateRegionName": "Yangon",
    "districtId": "district123",
    "districtName": "Yangon East",
    "townshipId": "township123",
    "townshipName": "Botahtaung",
    "townId": "town123",
    "townName": "Downtown",
    "wardVillageId": "ward123",
    "wardVillageName": "Ward 1",

    // Family Information
    "father": {
      "nameMyanmar": "ဦးအောင်အောင်",
      "nameEnglish": "U Aung Aung",
      "nrcNumber": "12/OUKAMA(N)111111",
      "occupation": "Teacher"
    },
    "mother": {
      "nameMyanmar": "ဒေါ်မာမာ",
      "nameEnglish": "Daw Ma Ma",
      "nrcNumber": "12/OUKAMA(N)222222",
      "occupation": "Nurse"
    },
    "guardian": {
      "nameMyanmar": "ဦးအောင်အောင်",
      "nameEnglish": "U Aung Aung",
      "nrcNumber": "12/OUKAMA(N)111111",
      "occupation": "Teacher",
      "relationship": "father",
      "phoneNumber": "09123456789",
      "email": "guardian@example.com",
      "address": "123 Main Street"
    },

    // Academic Information
    "batches": [
      {
        "_id": "batch123",
        "batchId": "batch001",
        "academicYearId": "year2024",
        "rollNo": "2024001"
      }
    ],
    "previousEducation": [
      {
        "_id": "edu123",
        "className": "Grade 10",
        "rollNumber": "2019001",
        "examBoard": "DBEB",
        "year": 2019,
        "totalMarks": 450,
        "subjects": [
          {
            "_id": "sub123",
            "subjectId": "math001",
            "name": "Mathematics",
            "mark": 85,
            "isDistinction": true
          }
        ]
      }
    ],

    // Additional Information
    "hobbies": "Reading, Sports",
    "skills": "Computer, English",
    "disabilities": null,
    "medicalConditions": null,
    "specialRequirements": null,

    "slug": "2024-STU-001",
    "createdAt": "2024-11-04T03:00:00.000Z",
    "updatedAt": "2024-11-04T03:00:00.000Z"
  }
}
```

**Notes**:
- This endpoint already exists (used in profile view page)
- ✅ **Already implemented** - no backend changes needed

---

### 2. API Endpoint: Update Student Profile
**Purpose**: Update existing student profile (only allowed when status is "pending")

**Endpoint**: `PUT /api/cpms/students/my-profile`

**Authentication**: Required (JWT token)

**Authorization**:
- Only allow updates when `registrationStatus === "pending"`
- Return `403 Forbidden` if status is "approved" or "rejected"

**Request Body**: Same format as create endpoint
```json
{
  // Personal Information
  "nameMyanmar": "မောင်မောင်",
  "nameEnglish": "Maung Maung",
  "gender": "male",
  "dateOfBirth": "2000-01-01",
  "placeOfBirth": "Yangon",
  "ethnicity": "Bamar",
  "religion": "Buddhism",
  "bloodGroup": "O+",
  "nrcNumber": "12/OUKAMA(N)123456",
  "profilePhoto": "um1/cpms/private/common/students/photos/abc123.jpg",

  // Contact Information
  "phoneNumber": "09123456789",
  "email": "student@example.com",

  // Address Information
  "permanentAddress": "123 Main Street",
  "currentAddress": "123 Main Street",
  "stateRegionId": "state123",
  "districtId": "district123",
  "townshipId": "township123",
  "townId": "town123",
  "wardVillageId": "ward123",

  // Family Information
  "father": {
    "nameMyanmar": "ဦးအောင်အောင်",
    "nameEnglish": "U Aung Aung",
    "nrcNumber": "12/OUKAMA(N)111111",
    "occupation": "Teacher"
  },
  "mother": {
    "nameMyanmar": "ဒေါ်မာမာ",
    "nameEnglish": "Daw Ma Ma",
    "nrcNumber": "12/OUKAMA(N)222222",
    "occupation": "Nurse"
  },
  "guardian": {
    "nameMyanmar": "ဦးအောင်အောင်",
    "nameEnglish": "U Aung Aung",
    "nrcNumber": "12/OUKAMA(N)111111",
    "occupation": "Teacher",
    "relationship": "father",
    "phoneNumber": "09123456789",
    "email": "guardian@example.com",
    "address": "123 Main Street"
  },

  // Academic Information (if applicable)
  "batches": [
    {
      "batchId": "batch001",
      "academicYearId": "year2024",
      "rollNo": "2024001"
    }
  ],
  "previousEducation": [
    {
      "className": "Grade 10",
      "rollNumber": "2019001",
      "examBoard": "DBEB",
      "year": 2019,
      "totalMarks": 450,
      "subjects": [
        {
          "subjectId": "math001",
          "mark": 85,
          "isDistinction": true
        }
      ]
    }
  ],

  // Additional Information
  "hobbies": "Reading, Sports",
  "skills": "Computer, English",
  "disabilities": null,
  "medicalConditions": null,
  "specialRequirements": null
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Same format as GET response
    "_id": "673e84bedd08b5a8265c5a59",
    "userId": "6908a38149b34e30eb522dae",
    // ... full profile data
  }
}
```

**Error Responses**:

1. **Profile Not Found**:
```json
{
  "success": false,
  "error": "Profile not found",
  "statusCode": 404
}
```

2. **Cannot Edit (Not Pending)**:
```json
{
  "success": false,
  "error": "Profile cannot be edited. Current status: approved",
  "statusCode": 403
}
```

3. **Validation Error**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "nameEnglish": "Name is required",
    "phoneNumber": "Invalid phone number format"
  },
  "statusCode": 400
}
```

---

### 3. Backend Business Logic

#### Status Check Before Update
```javascript
// Before allowing update
if (existingProfile.registrationStatus !== 'pending') {
  throw new Error(`Profile cannot be edited. Current status: ${existingProfile.registrationStatus}`);
}
```

#### Preserve System Fields
When updating, preserve these fields (don't allow client to modify):
- `_id`
- `userId`
- `organizationId`
- `slug` (record ID)
- `registrationStatus` (can only be changed by admin)
- `createdAt`
- Update `updatedAt` to current timestamp

#### Nested Document Updates
For array fields like `previousEducation` and `batches`:
- If item has `_id`, update existing item
- If item has no `_id`, create new item
- If existing items are not in the array, they should be removed

**Example**:
```javascript
// Existing education records
existingProfile.previousEducation = [
  { _id: "edu1", className: "Grade 10", ... },
  { _id: "edu2", className: "Grade 11", ... }
]

// Update request includes
requestBody.previousEducation = [
  { _id: "edu1", className: "Grade 10", ... }, // Update existing
  { className: "Grade 12", ... }  // Create new (no _id)
  // edu2 not included = should be removed
]
```

---

## Frontend Implementation Requirements

### 1. Page Access Control Update

**File**: `/apps/publicWeb/src/app/(register)/profileSetup/student/page.tsx`

**Current Logic**:
```typescript
// Redirect non-guest users to home
if (!isGuestUser) {
  redirect("/");
}
```

**New Logic**:
```typescript
// Allow access if:
// 1. User is guest (first-time registration), OR
// 2. User has pending profile (edit mode)

// Fetch existing profile to check status
const profileResult = await getMyProfile();
const hasPendingProfile = profileResult.success &&
  profileResult.data?.registrationStatus === 'pending';

// Redirect only if user is NOT guest AND does NOT have pending profile
if (!isGuestUser && !hasPendingProfile) {
  redirect("/"); // Already approved/rejected or no profile
}

// Pass mode to client component
const mode = hasPendingProfile ? 'edit' : 'create';
const existingProfile = hasPendingProfile ? profileResult.data : null;

return <CompleteProfileClient
  user={user}
  mode={mode}
  existingProfile={existingProfile}
/>;
```

---

### 2. Form Component Updates

**File**: `/apps/publicWeb/src/app/(register)/profileSetup/student/components/StudentRegistrationWizard.tsx`

#### Add Edit Mode Support

**Props Update**:
```typescript
interface StudentRegistrationWizardProps {
  user: User;
  mode: 'create' | 'edit';  // NEW
  existingProfile?: StudentProfileData;  // NEW
}
```

#### Pre-populate Form with Existing Data

**In useEffect or initialization**:
```typescript
useEffect(() => {
  if (mode === 'edit' && existingProfile) {
    // Transform API data to form format
    const formData = transformProfileToFormData(existingProfile);

    // Set form values using react-hook-form
    Object.keys(formData).forEach(key => {
      setValue(key, formData[key]);
    });
  }
}, [mode, existingProfile]);
```

#### Update Submit Logic

**Current**: Always POST to create
**New**: Conditional based on mode

```typescript
const onSubmit = async (data) => {
  try {
    if (mode === 'edit') {
      // Update existing profile
      await updateStudentProfile(data);
    } else {
      // Create new profile
      await createStudentProfile(data);
    }

    // Success handling...
  } catch (error) {
    // Error handling...
  }
};
```

---

### 3. API Actions Update

**File**: `/apps/publicWeb/src/actions/student-profile.ts` (or similar)

#### Add Update Function

```typescript
export async function updateStudentProfile(data: StudentProfileFormData) {
  return withServerActionErrorHandler(async () => {
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    const result = await httpClient.request('/cpms/students/my-profile', {
      method: 'PUT',  // Use PUT for update
      body: data,
      withAuth: true,
      tokenStrategy: 'auto',
    });

    return {
      success: true,
      data: result.data,
    };
  }, {
    operation: 'update-student-profile',
    component: 'student-profile-actions'
  });
}
```

---

### 4. Data Transformation Functions

Need helper functions to transform between API format and form format:

```typescript
// Transform API profile data to form format
function transformProfileToFormData(profile: StudentProfileData): FormData {
  return {
    // Personal info
    nameMyanmar: profile.nameMyanmar,
    nameEnglish: profile.nameEnglish,
    gender: profile.gender,
    dateOfBirth: new Date(profile.dateOfBirth),
    // ... map all fields

    // Address - need to handle nested structure
    address: {
      stateRegionId: profile.stateRegionId,
      districtId: profile.districtId,
      // ...
    },

    // Previous education - preserve IDs
    previousEducation: profile.previousEducation?.map(edu => ({
      _id: edu._id,  // Important: preserve ID for update
      className: edu.className,
      // ...
    })),
  };
}

// Transform form data to API format
function transformFormDataToProfile(formData: FormData): ProfileUpdateRequest {
  // Similar transformation in reverse
}
```

---

### 5. UI Updates

#### Show Edit Mode Indicator
```tsx
{mode === 'edit' && (
  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
    <p className="text-sm text-amber-800">
      ✏️ You are editing your profile. Your registration status is pending.
    </p>
  </div>
)}
```

#### Update Submit Button Text
```tsx
<Button type="submit">
  {mode === 'edit' ? 'Update Profile' : 'Submit Registration'}
</Button>
```

---

## Testing Checklist

### Backend Testing
- [ ] GET `/api/cpms/students/my-profile` returns existing profile
- [ ] PUT `/api/cpms/students/my-profile` updates profile when status is pending
- [ ] PUT returns 403 when status is approved/rejected
- [ ] Validation errors are properly returned
- [ ] Nested documents (education, batches) are updated correctly
- [ ] System fields (_id, userId, slug) are not modified
- [ ] updatedAt timestamp is updated

### Frontend Testing
- [ ] Guest users can access form (create mode)
- [ ] Users with pending status can access form (edit mode)
- [ ] Users with approved/rejected status are redirected
- [ ] Form pre-populates with existing data in edit mode
- [ ] All form fields show correct existing values
- [ ] Profile photo is displayed if exists
- [ ] Update submission works correctly
- [ ] Success message shows after update
- [ ] Redirects to profile view after successful update
- [ ] Error handling works for validation errors
- [ ] Error handling works for status conflicts (not pending)

---

## Summary

**Backend Needs to Implement**:
1. ✅ GET endpoint for profile (already exists)
2. ❌ PUT endpoint for profile update (NEW - needs implementation)
3. ❌ Status validation before update (NEW - needs implementation)
4. ❌ Nested document update logic (NEW - needs implementation)

**Frontend Needs to Implement**:
1. ❌ Access control update (allow pending users)
2. ❌ Fetch existing profile on page load
3. ❌ Pass mode and data to form component
4. ❌ Pre-populate form with existing data
5. ❌ Conditional submit (create vs update)
6. ❌ Update API action
7. ❌ UI indicators for edit mode

**Priority**: Backend PUT endpoint must be implemented first before frontend changes can be completed.
