# Core Application Development Guide

**Index of all documentation files**

---

## Quick Navigation

### For First-Time Understanding
1. Start with: **EXPLORATION_SUMMARY.md** (this gives you the complete overview)
2. Then read: **CORE_ARCHITECTURE_DIAGRAM.txt** (visual understanding)
3. Finally explore: **CORE_ARCHITECTURE.md** (deep dive)

### For Quick Development
1. Reference: **CORE_QUICK_REFERENCE.md** (functions, props, snippets)
2. Copy template from: **CORE_ARCHITECTURE.md** section "Creating a New Static Module"
3. Validate against checklist in: **CORE_QUICK_REFERENCE.md** section "Development Checklist"

### For Code Review
1. Check: **CORE_ARCHITECTURE.md** section "Students Module (Reference Implementation)"
2. Verify against: **CORE_ARCHITECTURE.md** section "Important Patterns & Best Practices"
3. Test using checklist from: **CORE_QUICK_REFERENCE.md**

---

## Documentation Files Overview

### EXPLORATION_SUMMARY.md
**Size**: ~380 lines
**Purpose**: Executive summary and high-level overview
**Contains**:
- What was explored
- Architecture patterns discovered
- Key technical insights
- Directory organization
- How to create new modules
- Key takeaways

**Read when**: You need a quick overview before diving deep

---

### CORE_ARCHITECTURE.md
**Size**: ~750 lines
**Purpose**: Comprehensive architecture reference
**Contains**:
- Complete directory structure
- Core concepts (5 main patterns)
- Students module breakdown (reference implementation)
- Generic module system explanation
- Key components and utilities
- Step-by-step guide for creating library module
- Type definitions
- Development workflow
- Common gotchas

**Read when**: You need detailed explanations or creating a new module

---

### CORE_QUICK_REFERENCE.md
**Size**: ~480 lines
**Purpose**: Quick lookup and copy-paste templates
**Contains**:
- File locations at a glance
- Key function signatures
- Component props reference
- Static module template (ready to copy)
- Routing path reference
- Timeout and error handling patterns
- Type imports
- Environment and configuration
- Common errors and solutions
- Development checklist

**Read when**: You're implementing features or need specific function signatures

---

### CORE_ARCHITECTURE_DIAGRAM.txt
**Size**: ~280 lines
**Purpose**: Visual flow diagrams and relationships
**Contains**:
- User request flow diagram
- Static module pattern diagram
- Authorization flow diagram
- Module schema structure
- Static module file tree
- Data fetch strategies (client vs server)
- Form submission flow

**Read when**: You need visual understanding of how components interact

---

## Implementation Workflow

### Phase 1: Understanding (30 minutes)
```
1. Read EXPLORATION_SUMMARY.md (5 min)
2. Review CORE_ARCHITECTURE_DIAGRAM.txt (10 min)
3. Skim CORE_ARCHITECTURE.md "Students Module" section (15 min)
```

### Phase 2: Planning (15 minutes)
```
1. Identify module requirements
2. Check module schema configuration
3. Decide if static or generic approach needed
4. Review CORE_ARCHITECTURE_DIAGRAM.txt for applicable patterns
```

### Phase 3: Implementation (30-60 minutes)
```
1. Create directory: src/staticModules/[appId]/[module]/
2. Copy template from CORE_QUICK_REFERENCE.md
3. Implement page.tsx (list view)
4. Implement new.tsx (create form)
5. Implement detail.tsx (edit form)
6. Add custom utilities if needed
```

### Phase 4: Testing (20 minutes)
```
1. Use checklist from CORE_QUICK_REFERENCE.md
2. Test at http://app.um1ygn.edu.mm/[appId]/[module]
3. Verify auth, timeout, form submission
4. Check permissions and multilanguage
```

---

## Key Concepts at a Glance

### Static Module Pattern
Custom implementation that overrides generic routing:
```
/staticModules/cpms/students/
├── page.tsx      ← List view
├── new.tsx       ← Create form
└── detail.tsx    ← Edit/view form
```

### Authorization Layers
```
Request → App Access → Module Access → Operation Access → Granted/Denied
```

### Data Fetching Strategy
```
Pagination Type? 
├─ Client-side: Load all data at once, paginate in browser
└─ Server-side: Load per page, lazy-load from API
```

### Form System
```
Schema Configuration → FormWithLanguage → Zod Validation → Server Action → Backend API
```

---

## Critical Files in Codebase

**Must understand these before creating modules**:

| File | Purpose | Importance |
|------|---------|-----------|
| `app/[appId]/[module]/page.tsx` | How static modules are detected | Critical |
| `lib/auth-utils.ts` | How authorization works | Critical |
| `lib/module-access-utils.ts` | How permissions are calculated | Critical |
| `components/modules/ModuleDataTableWrapper.tsx` | How pagination routing works | High |
| `staticModules/cpms/students/` | Reference implementation | High |
| `lib/layout-data.ts` | How data is fetched | Medium |
| `lib/enable-multilang.ts` | How multilang works | Medium |

---

## Common Tasks & Where to Find Help

| Task | Primary Resource | Secondary Resource |
|------|-----------------|-------------------|
| Create new module | CORE_ARCHITECTURE.md | CORE_QUICK_REFERENCE.md |
| Understand auth flow | CORE_ARCHITECTURE.md "Auth" | CORE_ARCHITECTURE_DIAGRAM.txt |
| Add custom components | CORE_ARCHITECTURE.md | CORE_QUICK_REFERENCE.md |
| Handle S3 media | CORE_ARCHITECTURE.md | Students module detail.tsx |
| Implement multilang | CORE_ARCHITECTURE.md | lib/enable-multilang.ts |
| Debug timeout issues | CORE_QUICK_REFERENCE.md | ModuleDataTableWithTimeout.tsx |
| Understand pagination | CORE_ARCHITECTURE_DIAGRAM.txt | CORE_ARCHITECTURE.md |
| Find function signature | CORE_QUICK_REFERENCE.md | lib/auth-utils.ts |

---

## File Locations Quick Map

```
/Users/kaunghtet/Projects/frontend/

Documentation (newly created):
├── EXPLORATION_SUMMARY.md              ← Start here first
├── CORE_ARCHITECTURE.md                ← Detailed reference
├── CORE_QUICK_REFERENCE.md             ← Copy-paste templates
├── CORE_ARCHITECTURE_DIAGRAM.txt       ← Visual diagrams
└── CORE_APP_GUIDE.md                   ← This file (navigation)

Code Location:
└── apps/core/src/
    ├── app/[appId]/[module]/page.tsx   ← Main routing
    ├── staticModules/                   ← Custom modules here
    ├── lib/                             ← Utilities
    └── components/                      ← UI components
```

---

## Quick Reference: Function Signatures

### Authentication
```typescript
// lib/auth-utils.ts
requireAppAccess(appId) → { user, tenant } | redirect
requireModuleAccess(appId, moduleSlug) → { user, tenant, module } | redirect
requireModuleOperationAccess(appId, moduleSlug, 'create'|'update'|'delete') → { user, tenant, module } | redirect
```

### Access Control
```typescript
// lib/module-access-utils.ts
getModulePermissions(module, user) → { read, create, update, softDelete, hardDelete }
filterModulesByUserAccess(modules, user) → Module[]
```

### Data Fetching
```typescript
// External library @repo/app-modules
getModuleList(slug, params?) → Promise<any[]>
getModuleItemWithNavigation(slug, id, options) → Promise<{ data, navigation }>
```

---

## Important Settings

### URLs
- **Development**: `http://app.um1ygn.edu.mm` (port 80)
- **Internal**: port 3001
- **Never use**: localhost:3001 (use domain instead)

### Timeouts
- **Server-side fetch**: 10 seconds
- **Client-side fetch**: 15-20 seconds
- **Auto-retry**: Up to 2 times with backoff

### Pagination
- **Determined by**: `schema.dataTableSchema.pagination.isClientSidePaging`
- **Default**: Server-side (safer for large datasets)

---

## Next Steps

1. **For Development**: Start with EXPLORATION_SUMMARY.md, then CORE_QUICK_REFERENCE.md
2. **For Deep Learning**: Read CORE_ARCHITECTURE.md in full
3. **For Visualization**: Study CORE_ARCHITECTURE_DIAGRAM.txt
4. **For Implementation**: Use templates from CORE_QUICK_REFERENCE.md
5. **For Reference**: Bookmark this file for quick navigation

---

## Document Statistics

```
Total Documentation Created: 1,500+ lines
├── CORE_ARCHITECTURE.md        749 lines (54%)
├── CORE_QUICK_REFERENCE.md     484 lines (32%)
├── CORE_ARCHITECTURE_DIAGRAM   281 lines (19%)
├── EXPLORATION_SUMMARY.md      380 lines (25%)
└── CORE_APP_GUIDE.md          ~250 lines (17%)
```

---

## Quick Start Checklist

Before creating a new static module:

- [ ] Read EXPLORATION_SUMMARY.md
- [ ] Review CORE_ARCHITECTURE_DIAGRAM.txt
- [ ] Understand students module from CORE_ARCHITECTURE.md
- [ ] Read "Creating a New Static Module" section
- [ ] Review CORE_QUICK_REFERENCE.md templates
- [ ] Identify module name and appId
- [ ] Check module schema configuration
- [ ] Create directory structure
- [ ] Copy templates for page.tsx, new.tsx, detail.tsx
- [ ] Implement and test using checklist

---

## Support References

**For students module reference**:
- Location: `/apps/core/src/staticModules/cpms/students/`
- Best for: Understanding list, create, and edit patterns

**For generic module fallback**:
- Location: `/apps/core/src/app/[appId]/[module]/page.tsx`
- Best for: Understanding automatic routing and fallback

**For components**:
- Location: `/apps/core/src/components/modules/`
- Best for: Pagination routing and data table handling

**For utilities**:
- Location: `/apps/core/src/lib/`
- Best for: Auth, access control, layout data

---

## Last Updated
November 14, 2025 - Complete exploration and documentation

---

**End of Guide**

For questions or clarifications, refer back to the specific documentation file for that topic.
