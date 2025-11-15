# Core Application Exploration - Complete Summary

**Date**: November 14, 2025
**Project**: Frontend Monorepo
**Target**: `/apps/core` - Next.js Enterprise ERP System

---

## Overview

The Core application is a sophisticated multi-tenant enterprise resource planning system built with modern Next.js 15.4 and React 19. It implements a flexible **staticModules** pattern that allows custom module implementations while maintaining automatic fallback to generic handlers.

---

## What Was Explored

### 1. Directory Structure
- Analyzed complete `/apps/core` structure
- Mapped out routing architecture
- Identified staticModules directory and pattern
- Documented components and utilities organization

### 2. Reference Implementation
- Studied `staticModules/cpms/students/` module (primary implementation)
- Analyzed `staticModules/cpms/staffs/` module (placeholder)
- Examined generic fallback system

### 3. Core Patterns
- **Static Modules Pattern**: Custom module pages that override generic routing
- **Authentication & Authorization**: Three-tier security (app, module, operation level)
- **Smart Pagination**: Automatic detection of client vs server-side pagination
- **Data Fetching**: Timeout handling with automatic fallback
- **Form System**: Schema-driven, multilingual form generation
- **Media Handling**: S3 URL transformation for image display

### 4. Key Files Analyzed

| File | Purpose |
|------|---------|
| `app/[appId]/[module]/page.tsx` | Route handler for module list (checks for static module) |
| `app/[appId]/[module]/new/page.tsx` | Route handler for create page (checks for static module) |
| `app/[appId]/[module]/[id]/page.tsx` | Route handler for detail/edit page (checks for static module) |
| `lib/auth-utils.ts` | Authentication & authorization utilities (app, module, operation level) |
| `lib/module-access-utils.ts` | Access control and permission checking |
| `lib/layout-data.ts` | Layout data fetching with role-based filtering |
| `staticModules/cpms/students/page.tsx` | Reference: List page implementation |
| `staticModules/cpms/students/new.tsx` | Reference: Create form implementation |
| `staticModules/cpms/students/detail.tsx` | Reference: Edit/view form implementation |
| `components/modules/ModuleDataTableWrapper.tsx` | Smart pagination router |
| `components/modules/ModuleDataTableWithTimeout.tsx` | Client-side fetch with timeout handling |

---

## Architecture Patterns Discovered

### Pattern 1: Static Module Override
Routes check for static module existence before falling back to generic handlers:

```
Dynamic Route → Check staticModules → Use Static or Fall Back to Generic
```

### Pattern 2: Three-Tier Authorization
Security checks happen at multiple levels:
1. Application access (app must exist and be active)
2. Module access (module must be accessible to user's role)
3. Operation access (create, update, delete permissions)

### Pattern 3: Smart Pagination Router
Based on schema configuration, automatically determines pagination strategy:
- **Client-side**: All data loaded at once, pagination in browser
- **Server-side**: Empty initial data, lazy-load per page

### Pattern 4: Server + Client Fetch Fallback
1. Try server-side fetch with 10-second timeout
2. If timeout, fall back to client-side with automatic retry
3. User can manually trigger refresh

### Pattern 5: Component Composition
- Server Components for data fetching and auth
- Client Components for form interactivity
- Schema-driven UI generation
- Built-in multilanguage support

---

## Key Technical Insights

### Authentication
- Middleware validates session before route handler
- `requireModuleAccess()` performs server-side auth checks
- Access policies define role-based permissions
- Sensitive policies never exposed to client

### Data Fetching Strategy
```
Page.tsx (Server)
├─ Fetch layout data
├─ Check pagination type from schema
└─ If client-side paging:
    └─ getModuleList() with 10s timeout
       ├─ Success → Pass data to wrapper
       └─ Timeout → Use client-side fetcher
```

### Form Handling
- `FormWithLanguage` is main form component
- Schema-driven field generation
- Zod validation on client and server
- Special handling flags: `isStudentWizardForm`, `isWizardForm`, etc.
- Navigation support for prev/next in list

### Media Handling
- S3 keys stored in database
- `transformS3KeysToUrls()` converts to signed URLs
- Applied before passing to form

---

## Directory Organization

```
apps/core/src/
├── app/                                 # Next.js routing
│   ├── [appId]/[module]/page.tsx        # List (static module check)
│   ├── [appId]/[module]/new/page.tsx    # Create (static module check)
│   └── [appId]/[module]/[id]/page.tsx   # Detail (static module check)
│
├── staticModules/                       # Custom module implementations
│   ├── cpms/students/                   # REFERENCE IMPLEMENTATION
│   │   ├── page.tsx                     # List view
│   │   ├── new.tsx                      # Create form (client)
│   │   ├── detail.tsx                   # Edit/view form (server)
│   │   ├── actions/                     # (Reserved)
│   │   ├── batch/                       # (Reserved)
│   │   ├── detail/                      # (Reserved)
│   │   ├── shared/                      # (Reserved)
│   │   └── wizard/                      # (Reserved)
│   ├── cpms/staffs/                     # Placeholder implementation
│   ├── library/                         # Empty (uses generic)
│   └── ctms/                            # Empty (uses generic)
│
├── components/
│   ├── modules/
│   │   ├── ModuleDataTableWrapper.tsx           # Pagination router
│   │   ├── ModuleDataTableWithTimeout.tsx       # Timeout handling
│   │   ├── ClientSidePaginationWrapper.tsx      # Client paging
│   │   ├── ServerSidePaginationWrapper.tsx      # Server paging
│   │   └── ModuleListPage.tsx                   # Generic list UI
│   ├── forms/
│   │   └── FormWithLanguage.tsx                 # Schema-driven forms
│   └── ui/                              # shadcn/ui components
│
├── lib/
│   ├── auth-utils.ts                    # Authentication utilities
│   ├── module-access-utils.ts           # Access control
│   ├── layout-data.ts                   # Layout data fetching
│   ├── enable-multilang.ts              # Multilanguage support
│   └── [other utilities]
│
└── types/
    └── layout.ts                        # Layout-related types
```

---

## How to Create a New Static Module

### Quick Start: Library Module

```bash
# 1. Create directory
mkdir -p src/staticModules/library/{actions,batch,detail,wizard,shared}

# 2. Create page.tsx (list page)
# 3. Create new.tsx (create form)
# 4. Create detail.tsx (edit form)

# 5. Test at http://app.um1ygn.edu.mm/cpms/library
```

### Detailed Steps

**Step 1: List Page (page.tsx - Server Component)**
- Fetch layout data
- Check pagination type from schema
- For client-side: Fetch all data with 10s timeout
- For server-side: Return empty initialData
- Pass to appropriate wrapper component

**Step 2: Create Page (new.tsx - Client Component)**
- Use `"use client"` directive
- Return FormWithLanguage with action="create"
- Pass module, appId, tenantId, username

**Step 3: Edit Page (detail.tsx - Server Component)**
- Check if create or edit mode (itemId === 'new')
- If edit: Fetch item with navigation, transform S3 URLs
- Enable multilanguage fields
- Return FormWithLanguage with appropriate action

---

## Documentation Files Created

1. **CORE_ARCHITECTURE.md** (749 lines)
   - Comprehensive architecture overview
   - Detailed component descriptions
   - Pattern explanations
   - Students module breakdown
   - Step-by-step guide for creating new modules
   - Type definitions and workflows

2. **CORE_QUICK_REFERENCE.md** (484 lines)
   - File locations at a glance
   - Function signatures
   - Component props reference
   - Static module template
   - Common errors and solutions
   - Development checklist

3. **CORE_ARCHITECTURE_DIAGRAM.txt** (281 lines)
   - Visual flow diagrams
   - Authorization flow
   - Static module pattern diagram
   - Data fetch strategies
   - Form submission flow

---

## Key Takeaways

### What Makes This Architecture Elegant

1. **Flexible Fallback**: Modules can be generic (automatic) or custom (static) - no breaking changes
2. **Security First**: Three-tier auth prevents unauthorized access at every level
3. **Smart Fetching**: Automatic timeout detection with graceful degradation
4. **Schema-Driven**: Configuration defines UI, reducing boilerplate
5. **Multilingual**: Built-in support for multiple languages
6. **Reusable Components**: `FormWithLanguage`, data table wrappers, etc.

### Critical Files to Understand

1. `lib/auth-utils.ts` - How authorization works
2. `lib/layout-data.ts` - How data is fetched and cached
3. `app/[appId]/[module]/page.tsx` - How static module routing works
4. `components/modules/ModuleDataTableWrapper.tsx` - How pagination routing works
5. `staticModules/cpms/students/` - Reference implementation to follow

---

## Testing Checklist

When creating a new static module, verify:

- [ ] Auth redirects work (no direct URL access)
- [ ] Server-side fetch timeout works
- [ ] Client-side fetch fallback works
- [ ] Form submission succeeds
- [ ] Permissions display correctly
- [ ] Multilanguage fields work
- [ ] S3 URLs transform correctly (if applicable)
- [ ] Navigation buttons work (if using navigation data)
- [ ] Error messages display properly
- [ ] Refresh button works

---

## Important Notes

1. **Always use DNS domain**: `http://app.um1ygn.edu.mm` (not localhost:3001)
2. **Static modules are checked automatically** by parent routes - no registration needed
3. **Path must be exact**: `staticModules/[appId]/[moduleName]/(page|new|detail).tsx`
4. **Server components by default**: Use client components only for interactivity
5. **Timeouts are intentional**: Ensures UI remains responsive even if backend is slow
6. **Schema defines everything**: Form fields, columns, layout, pagination - all from schema

---

## Related Documentation

- See `CORE_ARCHITECTURE.md` for detailed component explanations
- See `CORE_QUICK_REFERENCE.md` for copy-paste templates
- See `CORE_ARCHITECTURE_DIAGRAM.txt` for visual flow diagrams
- Reference: `/apps/core/src/staticModules/cpms/students/` for working example

---

## Conclusion

The Core application demonstrates a well-architected pattern for building enterprise-grade applications with Next.js. The staticModules system provides flexibility while maintaining a consistent, secure fallback system. Understanding this architecture makes it easy to:

1. Create new module implementations
2. Add custom features to existing modules
3. Maintain security through proper auth checks
4. Optimize performance through smart pagination
5. Support multiple languages and tenants

All documentation is self-contained and ready for reference during development.

