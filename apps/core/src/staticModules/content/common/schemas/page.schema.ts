/**
 * Page Zod Schemas
 * Validation schemas for page forms
 */

import { z } from 'zod';
import {
  multiLanguageTextSchema,
  optionalMultiLanguageTextSchema,
  optionalSlugSchema,
  fullSeoMetaSchema,
  contentStatusSchema,
  visibilitySchema,
  layoutSchema,
  optionalUrlSchema,
} from './common.schema';

// ============================================
// PAGE TEMPLATE
// ============================================

export const pageTemplateSchema = z.enum([
  'default',
  'fullWidth',
  'sidebar',
  'landing',
  'blog',
  'blank',
]);

// ============================================
// CREATE PAGE
// ============================================

export const createPageSchema = z.object({
  title: multiLanguageTextSchema,
  slug: optionalSlugSchema,
  description: optionalMultiLanguageTextSchema.optional(),
  content: optionalMultiLanguageTextSchema.optional(),
  featuredImage: optionalUrlSchema,
  featuredImageAlt: optionalMultiLanguageTextSchema.optional(),
  template: pageTemplateSchema.default('default'),
  layout: layoutSchema.partial().optional(),
  // Layout discriminator — picks `bodyTiptap` vs `sectionRefs` as the
  // active body channel. Defaults to 'tiptap' (most pages). Author flips
  // to 'sections' for homepage / marketing pages.
  layoutMode: z.enum(['tiptap', 'sections']).default('tiptap'),
  bodyTiptap: z
    .object({
      en: z.record(z.unknown()).optional(),
      mm: z.record(z.unknown()).optional(),
    })
    .optional(),
  // Hybrid section model — see PageSectionRef in page.types.ts. Each entry
  // is a reference, an inline section, or a reference + per-page override.
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
  /** @deprecated use sectionRefs */
  sectionIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
  order: z.number().min(0).optional(),
  showInNavigation: z.boolean().default(true),
  showBreadcrumbs: z.boolean().default(true),
  showTitle: z.boolean().default(true),
  showFeaturedImage: z.boolean().default(true),
  visibility: visibilitySchema.default('Public'),
  password: z.string().optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  allowedGroups: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  seo: fullSeoMetaSchema.optional(),
  status: contentStatusSchema.default('Draft'),
  isHomePage: z.boolean().default(false),
  departmentId: z.string().optional(),
});

export type CreatePageFormData = z.infer<typeof createPageSchema>;

// ============================================
// UPDATE PAGE
// ============================================

export const updatePageSchema = createPageSchema.partial();

export type UpdatePageFormData = z.infer<typeof updatePageSchema>;

// ============================================
// MOVE PAGE
// ============================================

export const movePageSchema = z.object({
  targetParentId: z.string().nullable().optional(),
  targetOrder: z.number().min(0),
});

export type MovePageFormData = z.infer<typeof movePageSchema>;

// ============================================
// REORDER PAGES
// ============================================

export const reorderPagesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().min(0),
      parentId: z.string().optional(),
    })
  ),
});

export type ReorderPagesFormData = z.infer<typeof reorderPagesSchema>;

// ============================================
// DUPLICATE PAGE
// ============================================

export const duplicatePageSchema = z.object({
  newTitle: multiLanguageTextSchema.optional(),
  newSlug: optionalSlugSchema,
  includeSections: z.boolean().default(true),
  includeChildren: z.boolean().default(false),
});

export type DuplicatePageFormData = z.infer<typeof duplicatePageSchema>;

// ============================================
// ADD SECTION TO PAGE
// ============================================

export const addSectionToPageSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  order: z.number().min(0).optional(),
});

export type AddSectionToPageFormData = z.infer<typeof addSectionToPageSchema>;

// ============================================
// REORDER PAGE SECTIONS
// ============================================

export const reorderPageSectionsSchema = z.object({
  sectionIds: z.array(z.string()),
});

export type ReorderPageSectionsFormData = z.infer<typeof reorderPageSectionsSchema>;

// ============================================
// PAGE QUERY
// ============================================

export const pageQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.string().optional(),
  template: pageTemplateSchema.optional(),
  status: contentStatusSchema.optional(),
  visibility: visibilitySchema.optional(),
  showInNavigation: z.boolean().optional(),
  isHomePage: z.boolean().optional(),
  departmentId: z.string().optional(),
  level: z.number().optional(),
  includeChildren: z.boolean().optional(),
  includeSections: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
  treeStructure: z.boolean().optional(),
  language: z.enum(['en', 'mm']).optional(),
  skip: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PageQueryFormData = z.infer<typeof pageQuerySchema>;

// ============================================
// BULK OPERATION
// ============================================

export const bulkPageOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one page is required'),
  operation: z.enum(['publish', 'unpublish', 'archive', 'delete', 'restore']),
});

export type BulkPageOperationFormData = z.infer<typeof bulkPageOperationSchema>;
