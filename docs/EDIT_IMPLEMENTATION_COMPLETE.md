# Student Profile Edit Implementation - Complete

## ✅ Implementation Summary

The student profile edit functionality has been fully implemented. Students with **pending** or **incomplete** registration status can now edit their profiles by clicking the "Edit Profile" button.

## 🎯 Implementation Details

### 1. Backend Support (Already Exists)
- ✅ **Endpoint**: `PATCH /api/cpms/students/my-profile`
- ✅ **Status Validation**: Only allows updates for `pending` or `incomplete` status
- ✅ **Error Handling**: Returns `403 PROFILE_LOCKED` for approved/rejected profiles
- ✅ **Field Protection**: System fields (userId, organizationId, registrationStatus, etc.) are protected
- ✅ **Array Handling**: Uses full replacement strategy for batches and previousEducation arrays

### 2. Frontend Implementation (Newly Implemented)

#### A. Page Access Control
**File**: [`/apps/publicWeb/src/app/(register)/profileSetup/student/page.tsx`](apps/publicWeb/src/app/(register)/profileSetup/student/page.tsx)

**Changes**:
- Fetches existing profile for non-guest users
- Checks registration status
- Allows access if status is `pending` or `incomplete`
- Redirects to profile view if status is `approved` or `rejected`
- Passes `mode` ('create' | 'edit') and `existingProfile` to components

**Logic**:
```typescript
if (!isGuestUser) {
  const profileResult = await getMyProfile();

  if (profileResult.success && profileResult.data) {
    const status = profileResult.data.registrationStatus;
    const canEdit = ['pending', 'incomplete'].includes(status);

    if (canEdit) {
      mode = 'edit';
      existingProfile = profileResult.data;
    } else {
      redirect("/profile/student"); // Profile locked
    }
  }
}
```

#### B. Component Props Flow
**Files Updated**:
1. [`CompleteProfileClient.tsx`](apps/publicWeb/src/app/(register)/profileSetup/student/CompleteProfileClient.tsx) - Accepts and passes mode/existingProfile
2. [`StudentSelfRegistrationForm.tsx`](apps/publicWeb/src/app/(register)/profileSetup/student/components/StudentSelfRegistrationForm.tsx) - Forwards props to wizard
3. [`StudentRegistrationWizard.tsx`](apps/publicWeb/src/app/(register)/profileSetup/student/components/StudentRegistrationWizard.tsx) - Main implementation

#### C. Form Pre-population
**File**: [`StudentRegistrationWizard.tsx`](apps/publicWeb/src/app/(register)/profileSetup/student/components/StudentRegistrationWizard.tsx)

**New useEffect** (lines 203-255):
```typescript
useEffect(() => {
  if (mode === 'edit' && existingProfile) {
    // Transform API data to form format
    const formData = {
      // Personal Info
      nameMyanmar: existingProfile.nameMyanmar || '',
      nameEnglish: existingProfile.nameEnglish || '',
      gender: existingProfile.gender || '',
      race: existingProfile.ethnicity || '', // Map ethnicity -> race
      religion: existingProfile.religion || '',
      bloodType: existingProfile.bloodGroup || '',
      phone: existingProfile.phoneNumber || '', // Map phoneNumber -> phone
      profilePhoto: existingProfile.profilePhoto || '',

      // Address, Family, Academic, Additional fields...
      // Full mapping in implementation
    };

    reset(formData); // Pre-populate form
  }
}, [mode, existingProfile, reset, user?.email]);
```

**Field Mappings**:
- `ethnicity` (API) → `race` (Form)
- `bloodGroup` (API) → `bloodType` (Form)
- `phoneNumber` (API) → `phone` (Form)

#### D. Update API Action
**File**: [`/apps/publicWeb/src/app/profile/student/actions.ts`](apps/publicWeb/src/app/profile/student/actions.ts)

**New Function** (lines 211-287):
```typescript
export async function updateMyProfile(data: any) {
  return withServerActionErrorHandler(async () => {
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // IMPORTANT: Use PATCH method (not PUT)
    const result = await httpClient.request<StudentProfileData>(
      "/cpms/students/my-profile",
      {
        method: "PATCH",  // Backend uses PATCH
        body: data,
        withAuth: true,
        userId: userId,
        tokenStrategy: "auto",
      }
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      message: result.success ? "Profile updated successfully" : undefined,
    };
  }, {
    operation: 'update-my-profile',
    component: 'profile-student-actions'
  });
}
```

#### E. Conditional Submit Logic
**File**: [`StudentRegistrationWizard.tsx`](apps/publicWeb/src/app/(register)/profileSetup/student/components/StudentRegistrationWizard.tsx)

**Updated onSubmit** (lines 385-473):
```typescript
const onSubmit = async (data: any) => {
  setIsSubmitting(true);

  if (mode === 'edit') {
    // Update existing profile
    const { updateMyProfile } = await import("@/app/profile/student/actions");
    result = await updateMyProfile(data);

    if (result.success) {
      toast.success("Profile Updated");
      clearFormDataCache(user.id);
      router.push("/profile/student"); // Redirect to view
      return;
    }
  } else {
    // Create new profile
    const { submitStudentSelfRegistration } = await import("@/actions/student-registration");
    result = await submitStudentSelfRegistration(data);

    if (result.success) {
      clearFormDataCache(user.id);
      setIsSuccess(true); // Show success page
      return;
    }
  }

  // Handle errors (PROFILE_LOCKED, validation, etc.)
};
```

#### F. UI Updates

**1. Edit Mode Banner** (lines 633-652):
```tsx
{mode === 'edit' && (
  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
    <p className="text-sm font-medium text-amber-800">
      Edit Mode - Your registration status is pending
    </p>
    <p className="mt-1 text-sm text-amber-700">
      You can update your profile information. Changes will be reviewed.
    </p>
  </div>
)}
```

**2. Submit Button Text** (lines 788-792):
```tsx
{isSubmitting
  ? (mode === 'edit' ? "Updating..." : "Submitting...")
  : (mode === 'edit' ? "Update Profile" : "Submit Registration")
}
```

**3. Cache Behavior**:
- Edit mode: Cache check disabled (line 259)
- Auto-save still works in both modes
- Cache cleared on successful submission

#### G. Error Handling

**PROFILE_LOCKED Error** (lines 436-445):
```typescript
if (mode === 'edit' && result.error?.includes('PROFILE_LOCKED')) {
  toast.error("Profile Locked", {
    description: "Your profile can no longer be edited because it has been approved or rejected.",
  });
  setTimeout(() => router.push("/profile/student"), 2000);
  return;
}
```

**Validation Errors**:
- Field-level validation errors displayed in toast
- Form validation errors prevent navigation

## 🔄 User Flow

### Edit Flow (Pending/Incomplete Status)
1. User views profile at `/profile/student`
2. Status badge shows "Pending" (amber) or "Incomplete"
3. **"Edit Profile" button is visible** in header
4. User clicks "Edit Profile"
5. Redirects to `/profileSetup/student`
6. Page detects non-guest user, fetches profile
7. Status check: `pending` or `incomplete` → Edit mode enabled
8. **Form pre-populates with existing data**
9. **Edit mode banner appears** (amber background)
10. User makes changes
11. **Submit button shows "Update Profile"**
12. On submit:
    - Calls `PATCH /api/cpms/students/my-profile`
    - Success → Toast "Profile Updated" → Redirect to `/profile/student`
    - Error PROFILE_LOCKED → Toast + Redirect to view
    - Error validation → Show errors

### Blocked Flow (Approved/Rejected Status)
1. User views profile at `/profile/student`
2. Status badge shows "Approved" (green) or "Rejected" (red)
3. **No "Edit Profile" button** visible
4. If user manually navigates to `/profileSetup/student`:
   - Page fetches profile
   - Status check: NOT `pending` or `incomplete`
   - **Automatic redirect** to `/profile/student`

### Create Flow (Guest User)
1. Guest user (no profile)
2. Navigates to `/profileSetup/student`
3. Page detects guest role
4. Mode: **create**
5. Form starts empty (schema defaults)
6. Submit → `POST /api/cpms/students/self-register`
7. Success page shown inline

## 📋 Field Mapping Reference

### API → Form Transformations

| API Field (Backend)    | Form Field (Frontend) | Notes                          |
|------------------------|----------------------|--------------------------------|
| `ethnicity`            | `race`               | Different field name           |
| `bloodGroup`           | `bloodType`          | Different field name           |
| `phoneNumber`          | `phone`              | Different field name           |
| `dateOfBirth` (string) | `dateOfBirth` (Date) | Type conversion                |
| `profilePhoto`         | `profilePhoto`       | S3 key path                    |
| `batches[]`            | `batches[]`          | Array - full replacement       |
| `previousEducation[]`  | `previousEducation[]`| Array - full replacement       |
| `father`               | `father`             | Nested object                  |
| `mother`               | `mother`             | Nested object                  |
| `guardian`             | `guardian`           | Nested object                  |

### Form → API Transformations
No transformation needed - form field names match API DTOexpectations (already using `phone`, `race`, `bloodType` which backend accepts via `SelfRegisterStudentDto`).

## 🧪 Testing Checklist

### Backend (Already Verified ✅)
- [x] `PATCH /api/cpms/students/my-profile` endpoint exists
- [x] Status validation (pending/incomplete only)
- [x] PROFILE_LOCKED error for approved/rejected
- [x] System fields protected
- [x] Array replacement strategy

### Frontend (Ready for Testing)
- [ ] **Guest user** → Can create new profile
- [ ] **Pending user** → Can access edit form
- [ ] **Incomplete user** → Can access edit form
- [ ] **Approved user** → Cannot access edit form (redirected)
- [ ] **Rejected user** → Cannot access edit form (redirected)
- [ ] **Form pre-population** → All fields populated correctly
- [ ] **Field mappings** → ethnicity, bloodGroup, phoneNumber map correctly
- [ ] **Profile photo** → S3 key displays and uploads correctly
- [ ] **Nested objects** → Father, mother, guardian data loads
- [ ] **Arrays** → Batches, previousEducation load correctly
- [ ] **Date fields** → Date of birth converts to Date object
- [ ] **Submit update** → PATCH request successful
- [ ] **Success redirect** → Redirects to `/profile/student` after update
- [ ] **Error handling** → PROFILE_LOCKED shows correct message
- [ ] **Validation errors** → Field errors displayed
- [ ] **Edit mode UI** → Amber banner shows
- [ ] **Button text** → "Update Profile" vs "Submit Registration"
- [ ] **Cache behavior** → No cache restore dialog in edit mode

## 🔑 Key Implementation Points

1. **Mode Detection**: Automatic based on user role and profile status
2. **Access Control**: Server-side checks prevent unauthorized access
3. **Data Transformation**: Handled in useEffect with field mapping
4. **HTTP Method**: PATCH (not PUT) as per backend
5. **Array Handling**: Full replacement - must send complete arrays
6. **Error Handling**: PROFILE_LOCKED detection and redirect
7. **User Feedback**: Toast notifications + visual indicators
8. **Navigation**: Auto-redirect after update success

## 📝 Important Notes

### For Future Development

1. **Array Fields Warning**:
   - `batches[]` and `previousEducation[]` use **full replacement**
   - When updating, must include ALL existing items
   - Missing items will be deleted from database
   - Form pre-population handles this automatically

2. **Field Name Discrepancies**:
   - Watch for API vs Form field name differences
   - Current mappings: ethnicity↔race, bloodGroup↔bloodType, phoneNumber↔phone
   - Add validation if new fields added

3. **Status Transitions**:
   - Only `pending` and `incomplete` allow edits
   - Backend enforces this - frontend respects it
   - Admin approval changes status to `approved` → locks profile

4. **Photo Upload**:
   - Profile photo stored as S3 key path
   - Form upload component should set `profilePhoto` field
   - Display requires signed URL generation

5. **Cache Behavior**:
   - Edit mode disables cache restore dialog
   - Auto-save still active (useful for long edits)
   - Cache cleared on successful update

## 🎉 Implementation Complete

All components have been updated to support edit functionality. The system now allows students with pending/incomplete status to edit their profiles through the same registration form interface, with automatic pre-population and conditional submission logic.

**Status**: ✅ Ready for Testing
**Next Step**: End-to-end testing with real user data
