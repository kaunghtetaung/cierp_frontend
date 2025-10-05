# Library Catalog Module - Implementation Plan

## 🎯 Correct Development Sequence

### Phase 1: Library Homepage with Simple Search (START HERE)
1. ✅ Create library layout structure
2. ✅ Implement **simple search** functionality
3. ✅ Build homepage sections:
   - Simple search bar
   - New Arrivals section
   - Top Reading List section
   - Library Department News section

### Phase 2: Advanced Search (LATER)
- Only after Phase 1 is complete and working

---

## 📁 Directory Structure (Phase 1 Only)

```
apps/publicWeb/src/
├── app/(cms)/library/
│   └── page.tsx                          # Homepage with simple search
│
├── actions/library/
│   ├── search.actions.ts                 # Simple search action
│   ├── books.actions.ts                  # New arrivals, top reading
│   └── news.actions.ts                   # Department news
│
└── themes/default/library/               # Theme components
    ├── LibraryHome.tsx                   # Main homepage component
    ├── SimpleSearch.tsx                  # Simple search bar
    ├── NewArrivals.tsx                   # New books section
    ├── TopReading.tsx                    # Popular books section
    └── LibraryNews.tsx                   # Department news section
```

---

## 🔨 Phase 1 Implementation Tasks

### Task 1: Create Layout & Structure
```
1. Create /app/(cms)/library/ directory
2. Create /actions/library/ directory
3. Create /themes/default/library/ directory
```

### Task 2: Simple Search Server Action
```typescript
// actions/library/search.actions.ts
'use server';

import { httpClient } from "@repo/api/clients/client";
import { getTenantContext } from "@repo/tenant/wrapper";
import { getUserSession } from "@repo/security/session";

export async function simpleSearch(query: string) {
  const { tenantId } = await getTenantContext();
  const session = await getUserSession();

  return await httpClient.post('/library/search', {
    tenantId,
    userId: session?.userId,
    body: { query }
  });
}
```

### Task 3: Homepage Data Actions
```typescript
// actions/library/books.actions.ts
export async function getNewArrivals(limit = 10) {
  // Fetch new arrivals from /library/books/new-arrivals
}

export async function getTopReading(limit = 10) {
  // Fetch top reading from /library/books/top-reading
}
```

```typescript
// actions/library/news.actions.ts
export async function getLibraryNews(limit = 5) {
  // Fetch department news from /library/news
}
```

### Task 4: Theme-Compatible Components
All using `classCollection` pattern:

1. **SimpleSearch.tsx** - Search input + button
2. **NewArrivals.tsx** - Display new books grid/list
3. **TopReading.tsx** - Display popular books grid/list
4. **LibraryNews.tsx** - Display department news cards
5. **LibraryHome.tsx** - Orchestrates all above components

### Task 5: Library Homepage
```typescript
// app/(cms)/library/page.tsx
import { LibraryHome } from '@/themes/default/library/LibraryHome';
import { getNewArrivals, getTopReading } from '@/actions/library/books.actions';
import { getLibraryNews } from '@/actions/library/news.actions';

export default async function LibraryPage() {
  const [newArrivals, topReading, news] = await Promise.all([
    getNewArrivals(),
    getTopReading(),
    getLibraryNews()
  ]);

  return (
    <LibraryHome
      newArrivals={newArrivals.data}
      topReading={topReading.data}
      news={news.data}
    />
  );
}
```

---

## 📝 Phase 1 Checklist

- [ ] Find existing classCollection file location
- [ ] Create directory structure
- [ ] Implement simple search server action
- [ ] Implement books data actions (new arrivals, top reading)
- [ ] Implement news data action
- [ ] Build SimpleSearch component (using classCollection)
- [ ] Build NewArrivals component (using classCollection)
- [ ] Build TopReading component (using classCollection)
- [ ] Build LibraryNews component (using classCollection)
- [ ] Build LibraryHome orchestrator
- [ ] Create library homepage page.tsx
- [ ] Test with different auth states

---

## ❓ Questions Before Starting

1. **Backend API endpoints** - Confirm:
   - `POST /library/search` (simple search)
   - `GET /library/books/new-arrivals`
   - `GET /library/books/top-reading`
   - `GET /library/news`

2. **Simple Search** - What fields should be searched?
   - Book title only?
   - Or title + author + ISBN?

3. **Data Display** - What information to show:
   - Book cards: title, author, cover image, availability?
   - News cards: title, date, excerpt?

**Ready to find classCollection and start implementing Phase 1?**
