/**
 * Page Module TypeScript Types
 * Static pages with sections and multi-language support
 */

import type {
  MultiLanguageText,
  BaseEntity,
  ContentStatus,
  PaginationQuery,
  FullSeoMeta,
  Visibility,
  Layout,
} from './common.types';
import type { Section } from './section.types';

// ============================================
// PAGE TEMPLATE
// ============================================

export type PageTemplate =
  | 'default'
  | 'fullWidth'
  | 'sidebar'
  | 'landing'
  | 'blog'
  | 'blank';

// ============================================
// PAGE ENTITY
// ============================================

/**
 * Hybrid section model — each entry on the page is either a reference to a
 * reusable Section doc (`sectionId` only), an inline custom section
 * (`sectionData` only), or a referenced section with per-page overrides
 * (BOTH set; the public renderer merges `sectionData` on top of the
 * resolved Section). `isVisible: false` keeps the entry in the layout but
 * hidden — useful for seasonal feature flags.
 */
export interface PageSectionRef {
  sectionId?: string | null;
  sectionData?: Section | Record<string, unknown> | null;
  order: number;
  isVisible?: boolean;
}

/**
 * Layout discriminator — every page uses ONE of these channels for its
 * body content:
 *  - `tiptap`   → rich-text body via Tiptap (default for content pages
 *    like Faculty / Program / News). Lives in `bodyTiptap`.
 *  - `sections` → section composition (Hero/FAQ/CTA/etc). Reserved for
 *    homepage + a handful of marketing pages. Lives in `sectionRefs`.
 * Both fields stay on the doc so toggling modes preserves data.
 */
export type PageLayoutMode = 'tiptap' | 'sections';

export interface Page extends BaseEntity {
  title: MultiLanguageText;
  slug: string;
  description?: MultiLanguageText;
  content?: MultiLanguageText;
  featuredImage?: string;
  featuredImageAlt?: MultiLanguageText;
  template: PageTemplate;
  layout?: Layout;
  /** Picks `bodyTiptap` vs `sectionRefs` as the active body channel. */
  layoutMode?: PageLayoutMode;
  /** Tiptap ProseMirror JSON per language. Used when layoutMode === 'tiptap'. */
  bodyTiptap?: {
    en?: Record<string, unknown>;
    mm?: Record<string, unknown>;
  };
  /** Hybrid section model — references, inline data, or both with overrides. */
  sectionRefs: PageSectionRef[];
  /** @deprecated use `sectionRefs` — kept for old API consumers reading legacy responses. */
  sectionIds?: string[];
  /** Resolved sections post-population (server hydrates from `sectionRefs`). */
  sections?: Section[];
  parentId?: string;
  parent?: Page;
  children?: Page[];
  childrenCount?: number;
  level: number;
  path: string[];
  order: number;
  showInNavigation: boolean;
  showBreadcrumbs: boolean;
  showTitle: boolean;
  showFeaturedImage: boolean;
  visibility: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  viewCount: number;
  seo: FullSeoMeta;
  status: ContentStatus;
  isHomePage: boolean;
}

// ============================================
// PAGE TREE NODE
// ============================================

export interface PageTreeNode extends Omit<Page, 'children' | 'sections'> {
  children: PageTreeNode[];
}

// ============================================
// CREATE DTO
// ============================================

// Used in the page-create / page-update flow when the form persists
// section instances inline (or as a mix of references + inline overrides).
export interface CreatePageSectionRefDto {
  sectionId?: string | null;
  sectionData?: Record<string, unknown> | null;
  order: number;
  isVisible?: boolean;
}

export interface CreatePageDto {
  title: MultiLanguageText;
  slug?: string;
  description?: MultiLanguageText;
  content?: MultiLanguageText;
  featuredImage?: string;
  featuredImageAlt?: MultiLanguageText;
  template?: PageTemplate;
  layout?: Partial<Layout>;
  layoutMode?: PageLayoutMode;
  bodyTiptap?: {
    en?: Record<string, unknown>;
    mm?: Record<string, unknown>;
  };
  /** Hybrid section model. Use `sectionRefs` going forward; `sectionIds`
   *  is kept for legacy API compatibility (server normalizes it). */
  sectionRefs?: CreatePageSectionRefDto[];
  /** @deprecated use `sectionRefs` */
  sectionIds?: string[];
  parentId?: string;
  order?: number;
  showInNavigation?: boolean;
  showBreadcrumbs?: boolean;
  showTitle?: boolean;
  showFeaturedImage?: boolean;
  visibility?: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  scheduledAt?: string;
  seo?: Partial<FullSeoMeta>;
  status?: ContentStatus;
  isHomePage?: boolean;
  departmentId?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdatePageDto = Partial<CreatePageDto>;

// ============================================
// SECTION MANAGEMENT
// ============================================

export interface AddSectionToPageDto {
  sectionId: string;
  order?: number;
}

export interface RemoveSectionFromPageDto {
  sectionId: string;
}

export interface ReorderPageSectionsDto {
  sectionIds: string[];
}

export interface CreateInlineSectionDto {
  // Section data to create inline
  type: string;
  name: string;
  title: MultiLanguageText;
  // ... other section fields
  [key: string]: unknown;
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface PageQuery extends PaginationQuery {
  search?: string;
  parentId?: string;
  template?: PageTemplate;
  status?: ContentStatus;
  visibility?: Visibility;
  showInNavigation?: boolean;
  isHomePage?: boolean;
  departmentId?: string;
  level?: number;
  includeChildren?: boolean;
  includeSections?: boolean;
  includeDeleted?: boolean;
  treeStructure?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// MOVE / REORDER
// ============================================

export interface MovePageDto {
  targetParentId?: string;
  targetOrder: number;
}

export interface ReorderPagesDto {
  items: Array<{
    id: string;
    order: number;
    parentId?: string;
  }>;
}

// ============================================
// DUPLICATE PAGE
// ============================================

export interface DuplicatePageDto {
  newTitle?: MultiLanguageText;
  newSlug?: string;
  includeSections?: boolean;
  includeChildren?: boolean;
}

// ============================================
// PAGE BREADCRUMB
// ============================================

export interface PageBreadcrumb {
  _id: string;
  title: MultiLanguageText;
  slug: string;
}

export interface PageWithBreadcrumb extends Page {
  breadcrumbs: PageBreadcrumb[];
}

// ============================================
// PAGE REVISION
// ============================================

export interface PageRevision {
  _id: string;
  pageId: string;
  title: MultiLanguageText;
  content?: MultiLanguageText;
  sectionIds: string[];
  createdBy: string;
  createdAt: string;
  version: number;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkPageOperation {
  ids: string[];
  operation: 'publish' | 'unpublish' | 'archive' | 'delete' | 'restore';
}

// ============================================
// STATISTICS
// ============================================

export interface PageStatistics {
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  scheduledPages: number;
  totalViews: number;
  pagesByTemplate: Array<{
    template: PageTemplate;
    count: number;
  }>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PageListResponse {
  statusCode: number;
  message: string;
  data: Page[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PageTreeResponse {
  statusCode: number;
  message: string;
  data: PageTreeNode[];
}

export interface PageDetailResponse {
  statusCode: number;
  message: string;
  data: Page;
}

export interface PageWithBreadcrumbResponse {
  statusCode: number;
  message: string;
  data: PageWithBreadcrumb;
}

export interface PageRevisionListResponse {
  statusCode: number;
  message: string;
  data: PageRevision[];
}

export interface PageStatisticsResponse {
  statusCode: number;
  message: string;
  data: PageStatistics;
}
