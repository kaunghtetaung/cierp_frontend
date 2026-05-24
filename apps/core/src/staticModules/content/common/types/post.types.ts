/**
 * Post Module TypeScript Types
 * Content articles and custom post types
 *
 * Aligned with backend `apps/core/src/content/post/schemas/post.schema.ts`.
 * Drift is the #1 cause of runtime bugs — keep this in sync when backend
 * schema changes.
 */

import type {
  MultiLanguageText,
  BaseEntity,
  ContentStatus,
  ContentFormat,
  ContentBlock,
  PaginationQuery,
  Visibility,
} from './common.types';
import type { Category } from './category.types';
import type { Tag } from './tag.types';
import type { PostType } from './post-type.types';

/**
 * Tiptap ProseMirror JSON document. Stored as opaque JSON in MongoDB —
 * the editor and the renderer agree on the shape; backend treats it as
 * Mixed.
 */
export type ProseMirrorDoc = {
  type: 'doc';
  content?: unknown[];
} & Record<string, unknown>;

/**
 * Multi-language ProseMirror body. Each language is an independent
 * Tiptap document so writers can have different structure per language.
 */
export interface MultiLanguageBody {
  en: ProseMirrorDoc;
  mm: ProseMirrorDoc;
}

/**
 * Featured image — hybrid `{ mediaId?, url, alt?, caption? }`.
 * `mediaId` ties it back to the Media collection so the media library can
 * track usage; `url` is the denormalized URL for fast rendering without
 * a Media lookup.
 */
export interface FeaturedImageRef {
  mediaId?: string;
  url: string;
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
}

/** Custom field value for per-PostType fields. Matches backend exactly. */
export interface CustomFieldValue {
  fieldName: string;
  value?: unknown;
}

/**
 * Per-post content kind. Drives which block on this document carries the
 * actual content (article→body, pdf→pdfBlock, table→tableBlock,
 * gallery→galleryImages, video→videoBlock). Public web renderers branch
 * on this field.
 */
export type PostContentType =
  | 'article'
  | 'pdf'
  | 'table'
  | 'gallery'
  | 'video'
  | 'slides';

/**
 * PDF document block — one of the alternative `contentType` payloads.
 * `display: 'embed-first'` tells the public renderer to embed the first
 * PDF inline (PDF.js / iframe) and list the rest underneath.
 */
export interface PdfBlock {
  files: Array<{
    mediaId?: string;
    url: string;
    title?: { en?: string; mm?: string };
  }>;
  display: 'list' | 'embed-first';
}

/**
 * Slide deck block — one of the alternative `contentType` payloads. Author
 * uploads BOTH a PDF (web preview) and the original PPTX (download). No
 * server-side conversion: the PDF is the canonical preview asset, the
 * PPTX is offered next to it as "Download original".
 */
export interface SlidesBlock {
  /** PDF asset for in-browser preview. Required for the web view. */
  pdfMediaId?: string;
  pdfUrl?: string;
  pdfFilename?: string;
  /** Original PPTX/PPT asset offered as a download. Optional. */
  pptxMediaId?: string;
  pptxUrl?: string;
  pptxFilename?: string;
  title?: { en?: string; mm?: string };
}

/** Table column definition — single language, type-aware. */
export type TableColumnType = 'text' | 'number' | 'date' | 'link';

export interface TableColumn {
  key: string; // unique slug, used as the row's record key
  label: string; // human label (single language by spec)
  type: TableColumnType;
}

/**
 * Tabular data block — one of the alternative `contentType` payloads.
 * Single language by design (column labels and cell values are plain
 * strings/numbers). `settings` drives the public renderer's pagination
 * / search / sort behavior.
 */
export interface TableBlock {
  columns: TableColumn[];
  rows: Array<Record<string, unknown>>;
  settings: {
    pageSize: number; // 0 = no pagination
    searchable: boolean;
    sortable: boolean;
  };
}

/**
 * Where a video came from. Drives playback on the public site:
 *   - `upload`   — direct <video src=…> from the media library
 *   - `youtube`  — iframe embed with normalized YouTube URL
 *   - `vimeo`    — iframe embed with Vimeo player URL
 *   - `external` — generic <video src=…> for any direct video URL
 */
export type VideoSource = 'upload' | 'youtube' | 'vimeo' | 'external';

export interface VideoItem {
  mediaId?: string;
  url: string;
  source: VideoSource;
  title?: { en?: string; mm?: string };
  thumbnailUrl?: string;
  durationSec?: number;
}

/**
 * Video block — used when contentType === 'video'. Mix of uploaded videos
 * and external embeds. `display: 'embed-first'` tells the public renderer
 * to embed the first video inline and list the rest underneath; `'list'`
 * shows every item as a card with a play link.
 */
export interface VideoBlock {
  items: VideoItem[];
  display: 'list' | 'embed-first';
}

/**
 * Lesson audience binding — only used when the chosen PostType's slug is
 * `'lesson'`. Two valid shapes:
 *
 *   - `subjectId` set, `batchIds: []`     → reach EVERY batch teaching
 *     this subject (now + future).
 *   - `subjectId` set, `batchIds: [...]`  → restrict to those specific
 *     batches.
 */
// ============================================
// ANNOUNCEMENT (Announcements PostType)
// ============================================

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotifyChannel = 'inapp' | 'email' | 'push';

/**
 * Announcement-specific fields, only meaningful when the post's PostType
 * slug is `'announcements'`. Visibility (Public vs Protected +
 * allowedGroups) reuses the post visibility; `targetBatchIds` is an
 * additional intersect-narrow on top of that.
 */
export interface AnnouncementContext {
  priority?: AnnouncementPriority;
  /** Pin to top of feed listings. */
  pinned?: boolean;
  /** ISO string. After this date the announcement auto-archives in feeds. */
  expiresAt?: string;
  /** Reader must click "I've read this" — tracked separately. */
  requiresAcknowledgment?: boolean;
  /** Routing hint for the notification fanout (phase 2). */
  notifyChannels?: NotifyChannel[];
  /** Optional batch narrowing — empty/undefined means "all who pass visibility". */
  targetBatchIds?: string[];
}

// ============================================
// EVENT SCHEDULING (Events PostType)
// ============================================

/**
 * Event-specific fields, only meaningful when the post's PostType slug is
 * `'events'`. Visibility (Public vs Protected + allowedGroups) reuses the
 * existing post visibility — no separate event-only flag needed.
 */
export interface EventContext {
  /** ISO string. Required for any event saved as published. */
  startAt?: string;
  /** ISO string. If unset, the calendar shows a 1-hour block. */
  endAt?: string;
  /** Free-text location ("Lecture Hall A", "Zoom: …", "Online"). */
  location?: string;
  /** All-day events skip the time portion in the calendar UI. */
  isAllDay?: boolean;
}

export interface LessonContext {
  subjectId?: string;
  batchIds: string[];
  /** Optional curriculum unit ("Unit 1 — Cells") — display grouping. */
  unitName?: string;
  /** Sort position within (subject, unit). Lower = earlier. */
  order?: number;
  /** Lesson post IDs that must be completed before this one unlocks. */
  prerequisiteLessonIds?: string[];
}

// ============================================
// LESSON PROGRESS (per-user, per-lesson)
// ============================================

/**
 * One row per (user, lesson). Auto-created with `status='started'` on first
 * fetch of a Restricted lesson; flipped to `'completed'` when the student
 * marks it done (or scrolls to bottom in a future iteration).
 */
export type LessonProgressStatus = 'started' | 'completed';

export interface LessonProgress {
  _id: string;
  userId: string;
  postId: string;
  organizationId: string;
  status: LessonProgressStatus;
  /** First time the student opened this lesson. */
  startedAt: string;
  /** Stamped each time the lesson is fetched by this user. */
  lastViewedAt: string;
  /** Set when status flips to 'completed'. */
  completedAt?: string;
  viewCount: number;
}

// ============================================
// POST ENTITY
// ============================================

export interface Post extends BaseEntity {
  // _id, organizationId, departmentId, createdBy, updatedBy, createdAt,
  // updatedAt, version, deletedAt, deletedBy come from BaseEntity.

  title: MultiLanguageText;
  slug: string;
  excerpt?: MultiLanguageText;
  /** Tiptap ProseMirror JSON document per language. */
  body: MultiLanguageBody;
  contentFormat: ContentFormat;
  /** Per-post content kind — drives which block carries the payload. */
  contentType?: PostContentType;
  /** PDF document block, present when contentType === 'pdf'. */
  pdfBlock?: PdfBlock;
  /** Tabular data block, present when contentType === 'table'. */
  tableBlock?: TableBlock;
  /** Video block, present when contentType === 'video'. */
  videoBlock?: VideoBlock;
  /** Slide deck block, present when contentType === 'slides'. */
  slidesBlock?: SlidesBlock;
  /** Lesson audience — only meaningful for posts whose PostType slug is `lesson`. */
  lessonContext?: LessonContext;
  /** Event scheduling — only meaningful for posts whose PostType slug is `events`. */
  eventContext?: EventContext;
  /** Announcement settings — only meaningful for posts whose PostType slug is `announcements`. */
  announcementContext?: AnnouncementContext;
  /** Block-based content (legacy / mobile-ready alternative to `body`). */
  contentBlocks?: {
    en: ContentBlock[];
    mm: ContentBlock[];
  };
  featuredImage?: FeaturedImageRef;
  /** Additional images attached to the post (photo galleries, news shots). */
  galleryImages?: FeaturedImageRef[];
  /** Open Graph image — distinct from featured (e.g., 1200×630 social card). */
  ogImage?: FeaturedImageRef;
  /** Canonical URL — for republished content; tells search engines which is authoritative. */
  canonicalUrl?: string;
  /** Legacy reference to a PostType document — optional. The new admin
      form uses the inline `postType` enum string instead. */
  postTypeId?: string;
  /** Inline post-kind enum: 'News' | 'Announcements' | 'Events' | 'Blog Post'. */
  /** Denormalized PostType slug (resolved from the picker). Optional in
      transit; backend treats it as informational. */
  postTypeSlug?: string;
  /** Categories the post belongs to. Replaces the previous `categoryId`. */
  categoryIds?: string[];
  /** Populated category documents (read-only). */
  categories?: Category[];
  tagIds: string[];
  tags?: Tag[];
  customFields?: CustomFieldValue[];
  /** Auto-computed by backend on save — read-only on the client. */
  wordCount?: number;
  readingTimeMinutes?: number;
  visibility: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  allowComments: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  scheduledAt?: string;
  publishedAt?: string;
  /** Flat SEO fields — backend stores them at the top level, not nested. */
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  /** Theme template (chrome / shell). Free-form string. Legacy. */
  template?: string;
  /** Authored Template id — drives the inner content area when set. */
  templateId?: string | null;
  status: ContentStatus;
  /** Audit ref unique to Post (createdBy/updatedBy come from BaseEntity). */
  publishedBy?: string;
  // ─── Page-as-post fields (PostType.slug === 'page') ────────────
  parentId?: string | null;
  /** Materialised ancestry path; populated by the server. */
  path?: string[];
  level?: number;
  orderInParent?: number;
  isHomePage?: boolean;
  showInNavigation?: boolean;
  showBreadcrumbs?: boolean;
  showTitle?: boolean;
  showFeaturedImage?: boolean;
  layoutMode?: 'tiptap' | 'sections';
  bodyTiptap?: {
    en?: Record<string, unknown>;
    mm?: Record<string, unknown>;
  };
  sectionRefs?: Array<{
    sectionId?: string | null;
    sectionData?: Record<string, unknown> | null;
    order: number;
    isVisible?: boolean;
  }>;
  layout?: PageLayout;
}

// ============================================
// PAGE LAYOUT TREE (for layoutMode='sections')
// ============================================

/**
 * Container > Row > Column > sectionRefs hierarchy. Authored via the
 * page builder; rendered by `PageLayoutRenderer` on publicWeb. Each
 * column carries a 12-col grid `width` so multi-column rows are
 * possible (e.g. 8 + 4 for content + sidebar).
 */
export interface PageLayoutColumnRef {
  sectionId?: string | null;
  sectionData?: Record<string, unknown> | null;
  order: number;
  isVisible?: boolean;
}
export interface PageLayoutColumn {
  id: string;
  /** 12-col grid width (1-12). Sum across a row should equal 12. */
  width: number;
  /**
   * Mutually-exclusive content. A column is either a *leaf* that holds
   * section references, OR a *branch* that nests sub-rows for further
   * sub-division. The renderer prefers `rows` when both are populated
   * (treats the column as a branch).
   */
  sectionRefs?: PageLayoutColumnRef[];
  /** Sub-rows nested under this column (recursive layout tree). */
  rows?: PageLayoutRow[];
}
export interface PageLayoutRow {
  id: string;
  settings?: {
    /** Stack columns vertically below `sm` breakpoint. Default true. */
    mobileStack?: boolean;
    /** Tailwind `gap-N` value. Default 'gap-6'. */
    gap?: string;
  } & Record<string, unknown>;
  columns: PageLayoutColumn[];
}
export interface PageLayoutContainer {
  id: string;
  settings?: {
    maxWidth?: 'screen-sm' | 'screen-md' | 'screen-lg' | 'screen-xl' | 'full';
    padding?: string;
    background?: string;
  } & Record<string, unknown>;
  rows: PageLayoutRow[];
}
export interface PageLayout {
  containers: PageLayoutContainer[];
}

// ============================================
// POST REVISION
// ============================================

export interface PostRevision {
  _id: string;
  postId: string;
  title: MultiLanguageText;
  body: MultiLanguageBody;
  excerpt?: MultiLanguageText;
  createdBy: string;
  createdAt: string;
  version: number;
}

// ============================================
// CREATE DTO
// ============================================

export interface CreatePostDto {
  title: MultiLanguageText;
  slug?: string;
  excerpt?: MultiLanguageText;
  body: MultiLanguageBody;
  contentFormat?: ContentFormat;
  contentType?: PostContentType;
  pdfBlock?: PdfBlock;
  tableBlock?: TableBlock;
  videoBlock?: VideoBlock;
  lessonContext?: LessonContext;
  contentBlocks?: {
    en: ContentBlock[];
    mm: ContentBlock[];
  };
  featuredImage?: FeaturedImageRef;
  galleryImages?: FeaturedImageRef[];
  ogImage?: FeaturedImageRef;
  canonicalUrl?: string;
  /** Legacy — optional. Prefer `postType` (string enum). */
  postTypeId?: string;
  /** Denormalized PostType slug (resolved from the picker). Optional in
      transit; backend treats it as informational. */
  postTypeSlug?: string;
  /** Multi-select categories. */
  categoryIds?: string[];
  tagIds?: string[];
  customFields?: CustomFieldValue[];
  visibility?: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  allowComments?: boolean;
  isFeatured?: boolean;
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  template?: string;
  templateId?: string | null;
  status?: ContentStatus;
  departmentId?: string;
  // Page-as-post fields (only meaningful when PostType.slug === 'page')
  parentId?: string | null;
  orderInParent?: number;
  isHomePage?: boolean;
  showInNavigation?: boolean;
  showBreadcrumbs?: boolean;
  showTitle?: boolean;
  showFeaturedImage?: boolean;
  layoutMode?: 'tiptap' | 'sections';
  bodyTiptap?: {
    en?: Record<string, unknown>;
    mm?: Record<string, unknown>;
  };
  sectionRefs?: Array<{
    sectionId?: string | null;
    sectionData?: Record<string, unknown> | null;
    order: number;
    isVisible?: boolean;
  }>;
  layout?: PageLayout;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdatePostDto = Partial<CreatePostDto>;

// ============================================
// QUERY PARAMETERS
// ============================================

export interface PostQuery extends PaginationQuery {
  search?: string;
  postTypeId?: string;
  postTypeSlug?: string;
  categoryId?: string;
  categorySlug?: string;
  tagId?: string;
  tagSlug?: string;
  authorId?: string;
  status?: ContentStatus;
  visibility?: Visibility;
  isFeatured?: boolean;
  isPinned?: boolean;
  departmentId?: string;
  /** Filter to org-level posts only (`departmentId === null`). Mutually exclusive with `departmentId`. */
  orgLevelOnly?: boolean;
  publishedAfter?: string;
  publishedBefore?: string;
  includeDeleted?: boolean;
  includeDrafts?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// SEARCH / FULL-TEXT
// ============================================

export interface PostSearchQuery {
  query: string;
  postTypeId?: string;
  categoryId?: string;
  limit?: number;
  highlight?: boolean;
}

export interface PostSearchResult {
  _id: string;
  title: MultiLanguageText;
  slug: string;
  excerpt?: MultiLanguageText;
  featuredImage?: FeaturedImageRef;
  publishedAt?: string;
  score: number;
  highlights?: {
    title?: string[];
    body?: string[];
  };
}

// ============================================
// RELATED POSTS
// ============================================

export interface RelatedPostsQuery {
  postId: string;
  limit?: number;
  strategy?: 'category' | 'tag' | 'mixed';
}

// ============================================
// STATISTICS
// ============================================

export interface PostStatistics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  postsByCategory: Array<{
    categoryId: string;
    categoryName: MultiLanguageText;
    count: number;
  }>;
  postsByPostType: Array<{
    postTypeId: string;
    postTypeName: MultiLanguageText;
    count: number;
  }>;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkPostOperation {
  ids: string[];
  // `delete` = soft-delete (default for non-admins).
  // `hard-delete` = permanently remove rows; restricted to systemAdmin
  // by the moduleAccessPolicy on the `post` module — the bulk endpoint
  // is at /post/bulk/hard-delete on the backend.
  operation:
    | 'publish'
    | 'unpublish'
    | 'archive'
    | 'delete'
    | 'restore'
    | 'hard-delete';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PostListResponse {
  statusCode: number;
  message: string;
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostDetailResponse {
  statusCode: number;
  message: string;
  data: Post;
}

export interface PostRevisionListResponse {
  statusCode: number;
  message: string;
  data: PostRevision[];
}

export interface PostSearchResponse {
  statusCode: number;
  message: string;
  data: PostSearchResult[];
  meta: {
    total: number;
    query: string;
    took: number;
  };
}

export interface PostStatisticsResponse {
  statusCode: number;
  message: string;
  data: PostStatistics;
}
