# Library API Response Format - Fixed

## Problem Identified

The **by-ID endpoint** returns a different format than the **list endpoint**:

### List Endpoint Response (Search Results)
```json
{
  "data": [
    {
      "subjects": [
        {
          "id": "68d14ff7125447a7a4f7b6f0",
          "name": "PUBLIC HEALTH",
          "_id": "69059107c0dc93f76529d8ed"  // ← HAS _id field
        }
      ],
      "degrees": [
        {
          "id": "69059107c0dc93f76529d8e6",
          "name": "M.Med.Sc.(Public Health)",
          "_id": "69059107c0dc93f76529d8ee"  // ← HAS _id field
        }
      ]
    }
  ],
  "pagination": {...}
}
```

### By-ID Endpoint Response (Detail View)
```json
{
  "_id": "69059107c0dc93f76529d8e9",
  "subjects": [
    {
      "id": "68d14ff7125447a7a4f7b6f0",
      "name": "PUBLIC HEALTH"
      // ❌ NO _id field!
    }
  ],
  "degrees": [
    {
      "id": "69059107c0dc93f76529d8e6",
      "name": "M.Med.Sc.(Public Health)"
      // ❌ NO _id field!
    }
  ],
  "organizationId": {
    "_id": "68d12d98e776d47ad2004f19",
    "fullName": "University of Medicine (1) Yangon",
    "shortName": "UM1 Yangon",
    "displayName": {
      "en": "University of Medicine (1) Yangon",
      "mm": "ဆေးတက္ကသိုလ် (၁) ရန်ကုန်"
    },
    "status": "Active",     // ✅ Has additional fields
    "lat": null,            // ✅ Has additional fields
    "lng": null             // ✅ Has additional fields
  }
}
```

## Key Differences

| Field | List Response | By-ID Response | Fix |
|-------|---------------|----------------|-----|
| `subjects[]._id` | ✅ Present | ❌ Missing | Make optional, use `id` as fallback |
| `degrees[]._id` | ✅ Present | ❌ Missing | Make optional, use `id` as fallback |
| `organizationId.status` | ❌ Missing | ✅ Present | Add to interface |
| `organizationId.lat` | ❌ Missing | ✅ Present | Add to interface |
| `organizationId.lng` | ❌ Missing | ✅ Present | Add to interface |

## Solution Implemented

### 1. Updated TypeScript Interfaces

**File**: `/actions/library/books.actions.ts`

```typescript
export interface Subject {
  id: string;
  name: string;
  _id?: string;  // ✅ Made optional - works for both endpoints
}

export interface Degree {
  id: string;
  name: string;
  _id?: string;  // ✅ Made optional - works for both endpoints
}

export interface Organization {
  _id: string;
  fullName: string;
  shortName: string;
  description?: string;
  displayName?: {
    en: string;
    mm: string;
  };
  status?: string;      // ✅ Added for by-ID response
  lat?: number | null;  // ✅ Added for by-ID response
  lng?: number | null;  // ✅ Added for by-ID response
}
```

### 2. Updated Component Keys

**File**: `/themes/default/library/BookDetails.tsx`

```typescript
// Before (would fail on by-ID response):
{book.subjects.map((subject) => (
  <span key={subject._id}>  // ❌ undefined for by-ID response
    {subject.name}
  </span>
))}

// After (works for both responses):
{book.subjects.map((subject) => (
  <span key={subject._id || subject.id}>  // ✅ Falls back to id
    {subject.name}
  </span>
))}
```

Same fix applied to `degrees`:
```typescript
{book.degrees.map((degree) => (
  <span key={degree._id || degree.id}>  // ✅ Uses id as fallback
    {degree.name}
  </span>
))}
```

## Testing Results

### ✅ List Endpoint (Search Results)
```typescript
subjects: [
  { id: "xxx", name: "PUBLIC HEALTH", _id: "yyy" }
]
// key = "yyy" ✅
```

### ✅ By-ID Endpoint (Detail View)
```typescript
subjects: [
  { id: "xxx", name: "PUBLIC HEALTH" }  // no _id
]
// key = "xxx" ✅ (fallback to id)
```

## Complete Response Format Documentation

### By-ID Endpoint: `GET /library/bibliographies/{id}`

**Returns**: Direct object (not wrapped in `data`)

```typescript
interface ByIdResponse extends Bibliography {
  // All Bibliography fields
  // Plus organizationId has additional fields:
  organizationId: {
    _id: string;
    fullName: string;
    shortName: string;
    displayName: { en: string; mm: string; };
    status?: string;      // Only in by-ID
    lat?: number | null;  // Only in by-ID
    lng?: number | null;  // Only in by-ID
  };
  // subjects and degrees don't have _id field
  subjects: Array<{ id: string; name: string; }>;
  degrees: Array<{ id: string; name: string; }>;
}
```

### List Endpoint: `GET /library/bibliographies?search=...`

**Returns**: Wrapped in `data` array with pagination

```typescript
interface ListResponse {
  data: Bibliography[];  // subjects/degrees have _id field
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Files Modified

1. ✅ `/actions/library/books.actions.ts`
   - Made `Subject._id` optional
   - Made `Degree._id` optional
   - Added `Organization.status`
   - Added `Organization.lat`
   - Added `Organization.lng`

2. ✅ `/themes/default/library/BookDetails.tsx`
   - Updated subjects map key: `key={subject._id || subject.id}`
   - Updated degrees map key: `key={degree._id || degree.id}`

## Verification Checklist

✅ Subjects display correctly from by-ID response
✅ Degrees display correctly from by-ID response
✅ No React key warnings in console
✅ Organization fields don't cause TypeScript errors
✅ List endpoint still works (backward compatible)
✅ By-ID endpoint works with new format

## Status: FIXED ✅

The component now handles both API response formats correctly!
