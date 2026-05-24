/**
 * Post Zod Schemas
 * Validation schemas for post forms.
 *
 * Aligned with backend `apps/core/src/content/post/schemas/post.schema.ts`
 * and frontend `post.types.ts`. Body is Tiptap ProseMirror JSON; featured
 * image is a hybrid `{ mediaId?, url, alt?, caption? }`.
 */

import { z } from 'zod';
import {
  multiLanguageTextSchema,
  optionalMultiLanguageTextSchema,
  optionalSlugSchema,
  contentStatusSchema,
  contentFormatSchema,
  visibilitySchema,
  contentBlockSchema,
} from './common.schema';

/** Tiptap ProseMirror document shape — loose because the editor enforces it. */
const proseMirrorDocSchema = z.object({
  type: z.literal('doc'),
}).passthrough();

const multiLanguageBodySchema = z.object({
  en: proseMirrorDocSchema,
  mm: proseMirrorDocSchema,
});

const featuredImageRefSchema = z.object({
  mediaId: z.string().optional(),
  url: z.string().url(),
  alt: z
    .object({ en: z.string().optional(), mm: z.string().optional() })
    .optional(),
  caption: z
    .object({ en: z.string().optional(), mm: z.string().optional() })
    .optional(),
});

const customFieldValueSchema = z.object({
  fieldName: z.string(),
  value: z.unknown().optional(),
});

// ============================================
// MULTI-FORMAT BLOCKS (per-post contentType)
// ============================================

const postContentTypeSchema = z.enum([
  'article',
  'pdf',
  'table',
  'gallery',
  'video',
  'slides',
]);

const pdfBlockSchema = z.object({
  files: z
    .array(
      z.object({
        mediaId: z.string().optional(),
        url: z.string().min(1, 'PDF URL is required'),
        title: z
          .object({
            en: z.string().optional(),
            mm: z.string().optional(),
          })
          .optional(),
      }),
    )
    .min(1, 'At least one PDF is required'),
  display: z.enum(['list', 'embed-first']).default('list'),
});

/**
 * Slide deck block — used when contentType === 'slides'. Author uploads
 * BOTH a PDF (web preview) and the original PPTX (download). PDF is
 * required for the form to validate; PPTX is optional.
 */
const slidesBlockSchema = z.object({
  pdfMediaId: z.string().optional(),
  pdfUrl: z.string().min(1, 'PDF preview is required for slides'),
  pdfFilename: z.string().optional(),
  pptxMediaId: z.string().optional(),
  pptxUrl: z.string().optional(),
  pptxFilename: z.string().optional(),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
});

const tableColumnSchema = z.object({
  key: z
    .string()
    .min(1, 'Column key is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Use letters, numbers, and underscores'),
  label: z.string().min(1, 'Column label is required'),
  type: z.enum(['text', 'number', 'date', 'link']).default('text'),
});

const tableBlockSchema = z.object({
  columns: z.array(tableColumnSchema).min(1, 'At least one column is required'),
  rows: z.array(z.record(z.unknown())).default([]),
  settings: z
    .object({
      pageSize: z.number().int().nonnegative().default(10),
      searchable: z.boolean().default(true),
      sortable: z.boolean().default(true),
    })
    .default({ pageSize: 10, searchable: true, sortable: true }),
});

const videoSourceSchema = z.enum(['upload', 'youtube', 'vimeo', 'external']);

const videoItemSchema = z.object({
  mediaId: z.string().optional(),
  url: z.string().min(1, 'Video URL is required'),
  source: videoSourceSchema.default('upload'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  durationSec: z.number().nonnegative().optional(),
});

const videoBlockSchema = z.object({
  items: z.array(videoItemSchema).min(1, 'Add at least one video'),
  display: z.enum(['list', 'embed-first']).default('list'),
});

/**
 * Lesson audience — only relevant when the chosen PostType slug is
 * `'lesson'`. Empty `batchIds` means "all batches teaching the subject".
 * The form's submit guard requires `subjectId` for lesson posts; batches
 * are optional.
 */
const lessonContextSchema = z.object({
  subjectId: z.string().optional(),
  batchIds: z.array(z.string()).default([]),
  // Sequencing — optional, used by the LMS reader to order lessons inside
  // a subject/unit and gate prerequisites.
  unitName: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  prerequisiteLessonIds: z.array(z.string()).optional(),
});

/**
 * Event scheduling — only relevant when the chosen PostType slug is
 * `'events'`. Form keeps datetimes as ISO strings; backend Mixed sub-doc
 * coerces to Date on save. The cross-field "endAt >= startAt" rule is
 * enforced in PostForm's superRefine because Zod can't reach across siblings
 * cleanly inside an inner object schema.
 */
const eventContextSchema = z.object({
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  location: z.string().max(200).optional(),
  isAllDay: z.boolean().optional(),
});

/**
 * Announcement settings — only relevant when the chosen PostType slug is
 * `'announcements'`. Promotes priority/pin/expiry/ack/channels/batches to
 * first-class so the feed/dashboard UI can render them consistently.
 */
const announcementContextSchema = z.object({
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  pinned: z.boolean().optional(),
  expiresAt: z.string().optional(),
  requiresAcknowledgment: z.boolean().optional(),
  notifyChannels: z.array(z.enum(['inapp', 'email', 'push'])).optional(),
  targetBatchIds: z.array(z.string()).optional(),
});

// ============================================
// CREATE POST
// ============================================

// Base shape — kept as a plain ZodObject so `.partial()` still works for
// the update schema. Cross-field validation is layered on top with
// superRefine after the partial derivation.
const createPostBaseSchema = z.object({
  title: multiLanguageTextSchema,
  slug: optionalSlugSchema,
  excerpt: optionalMultiLanguageTextSchema.optional(),
  body: multiLanguageBodySchema,
  contentFormat: contentFormatSchema.default('json'),
  // Per-post content kind. Default 'article' so existing forms keep working.
  // The PostForm cross-validates: if contentType === 'pdf' the pdfBlock must
  // be present (via superRefine), and likewise for 'table' / 'gallery'.
  contentType: postContentTypeSchema.default('article'),
  pdfBlock: pdfBlockSchema.optional(),
  tableBlock: tableBlockSchema.optional(),
  videoBlock: videoBlockSchema.optional(),
  slidesBlock: slidesBlockSchema.optional(),
  // Lesson audience — only used when the chosen PostType slug === 'lesson'.
  // The form supplies it conditionally; non-lesson posts keep it undefined.
  lessonContext: lessonContextSchema.optional(),
  // Event scheduling — only used when the chosen PostType slug === 'events'.
  // Same pattern as lessonContext: undefined for non-event posts.
  eventContext: eventContextSchema.optional(),
  // Announcement settings — only used when the chosen PostType slug ===
  // 'announcements'. Same conditional pattern as event/lesson contexts.
  announcementContext: announcementContextSchema.optional(),
  contentBlocks: z
    .object({
      en: z.array(contentBlockSchema).optional(),
      mm: z.array(contentBlockSchema).optional(),
    })
    .optional(),
  featuredImage: featuredImageRefSchema.optional(),
  /** Additional images. Empty array allowed — limits in UI. */
  galleryImages: z.array(featuredImageRefSchema).max(50).optional(),
  /** Open Graph image — separate from featured. */
  ogImage: featuredImageRefSchema.optional(),
  /** Canonical URL for republished content. */
  canonicalUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  /** Manually curated related posts. Empty = backend auto-suggests by tag/category overlap. */
  relatedPostIds: z.array(z.string()).max(20).optional(),
  /**
   * Reference to a PostType document (Mongo ObjectId as string). The "Post
   * as" picker stores the id so the post-detail page can look up the
   * type's customAttributes for rendering. Required so each post is
   * properly classified.
   */
  postTypeId: z
    .string()
    .min(1, 'Pick a post type ("Post as")'),
  /**
   * Denormalized slug of the chosen post type — saved alongside the id
   * so listings can filter by slug without a populate. Optional; the
   * form fills it from the picker selection.
   */
  postTypeSlug: z.string().optional(),
  // Multi-select categories.
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  customFields: z.array(customFieldValueSchema).optional(),
  visibility: visibilitySchema.default('Public'),
  password: z.string().optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  allowedGroups: z.array(z.string()).optional(),
  allowComments: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  template: z.string().optional(),
  /** Authored Template id (Template collection). `null` clears it. */
  templateId: z.string().nullable().optional(),
  status: contentStatusSchema.default('Draft'),
  // Org-level pages persist as `departmentId: null` in MongoDB and load
  // back into the form as literal `null`. Without `.nullable()`, zod
  // rejects the default-value with "Expected string, received null"
  // and the lesson-only refinement below never even runs.
  departmentId: z.string().nullable().optional(),
  // ─────────────────────────────────────────────────────────────────
  // PAGE-AS-POST fields — only meaningful when the chosen PostType
  // slug is 'page'. All optional so non-page posts don't have to
  // fill them in. Schema-level defaults so the form UI can render
  // these as required when slug='page'.
  // ─────────────────────────────────────────────────────────────────
  parentId: z.string().nullable().optional(),
  orderInParent: z.number().int().nonnegative().optional(),
  isHomePage: z.boolean().optional(),
  showInNavigation: z.boolean().optional(),
  showBreadcrumbs: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  showFeaturedImage: z.boolean().optional(),
  layoutMode: z.enum(['tiptap', 'sections']).optional(),
  bodyTiptap: z
    .object({
      en: z.record(z.unknown()).optional(),
      mm: z.record(z.unknown()).optional(),
    })
    .optional(),
  sectionRefs: z
    .array(
      z.object({
        sectionId: z.string().nullable().optional(),
        sectionData: z.record(z.unknown()).nullable().optional(),
        order: z.number().int().nonnegative(),
        isVisible: z.boolean().optional(),
      }),
    )
    .optional(),
  // Page-builder tree (containers → rows → columns → sectionRefs).
  // Stored as a permissive object so the admin builder can iterate
  // shape without DTO churn — Mongoose persists as Mixed.
  layout: z.record(z.unknown()).optional(),
});

// Cross-field guard: the chosen contentType must have its block populated.
// Article uses `body` (always required at the field level), gallery /
// pdf / table need their own block populated before submit.
const contentTypeRefinement = (
  val: z.infer<typeof createPostBaseSchema>,
  ctx: z.RefinementCtx,
) => {
  if (val.contentType === 'pdf' && (!val.pdfBlock || val.pdfBlock.files.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pdfBlock', 'files'],
      message: 'Add at least one PDF.',
    });
  }
  if (val.contentType === 'table') {
    if (!val.tableBlock || val.tableBlock.columns.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tableBlock', 'columns'],
        message: 'Define at least one column.',
      });
    }
  }
  if (val.contentType === 'video' && (!val.videoBlock || val.videoBlock.items.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['videoBlock', 'items'],
      message: 'Add at least one video.',
    });
  }
  if (val.contentType === 'gallery' && (!val.galleryImages || val.galleryImages.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['galleryImages'],
      message: 'Add at least one image.',
    });
  }
  if (
    val.contentType === 'slides' &&
    (!val.slidesBlock || !val.slidesBlock.pdfUrl)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['slidesBlock', 'pdfUrl'],
      message: 'Upload a PDF for the slide preview.',
    });
  }
  // Lesson posts must carry a department — they're inherently scoped to
  // a teaching unit, so an org-level lesson is meaningless. Backend
  // mirrors this rule.
  if (val.postTypeSlug === 'lesson' && !val.departmentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['departmentId'],
      message: 'Department is required for lesson posts.',
    });
  }
};

export const createPostSchema = createPostBaseSchema.superRefine(contentTypeRefinement);

export type CreatePostFormData = z.infer<typeof createPostSchema>;

// ============================================
// UPDATE POST
// ============================================

// Update uses the partial of the BASE shape (not the refined one) so callers
// can patch any subset of fields. The same cross-field check is layered on
// top so that switching contentType still requires its block to be valid.
export const updatePostSchema = createPostBaseSchema
  .partial()
  .superRefine((val, ctx) => {
    if (!val.contentType) return;
    contentTypeRefinement(val as z.infer<typeof createPostBaseSchema>, ctx);
  });

export type UpdatePostFormData = z.infer<typeof updatePostSchema>;

// ============================================
// POST QUERY
// ============================================

export const postQuerySchema = z.object({
  search: z.string().optional(),
  postTypeId: z.string().optional(),
  postTypeSlug: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  tagId: z.string().optional(),
  tagSlug: z.string().optional(),
  authorId: z.string().optional(),
  status: contentStatusSchema.optional(),
  visibility: visibilitySchema.optional(),
  isFeatured: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  departmentId: z.string().optional(),
  publishedAfter: z.string().datetime().optional(),
  publishedBefore: z.string().datetime().optional(),
  includeDeleted: z.boolean().optional(),
  includeDrafts: z.boolean().optional(),
  language: z.enum(['en', 'mm']).optional(),
  skip: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PostQueryFormData = z.infer<typeof postQuerySchema>;

// ============================================
// POST SEARCH
// ============================================

export const postSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  postTypeId: z.string().optional(),
  categoryId: z.string().optional(),
  limit: z.number().min(1).max(50).optional(),
  highlight: z.boolean().optional(),
});

export type PostSearchFormData = z.infer<typeof postSearchSchema>;

// ============================================
// SCHEDULE POST
// ============================================

export const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime('Invalid date format'),
});

export type SchedulePostFormData = z.infer<typeof schedulePostSchema>;

// ============================================
// BULK OPERATION
// ============================================

export const bulkPostOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one post is required'),
  operation: z.enum(['publish', 'unpublish', 'archive', 'delete', 'restore']),
});

export type BulkPostOperationFormData = z.infer<typeof bulkPostOperationSchema>;
