/**
 * Post Zod Schemas
 * Validation schemas for post forms
 */

import { z } from 'zod';
import {
  multiLanguageTextSchema,
  optionalMultiLanguageTextSchema,
  optionalSlugSchema,
  fullSeoMetaSchema,
  contentStatusSchema,
  contentFormatSchema,
  visibilitySchema,
  contentBlockSchema,
  optionalUrlSchema,
} from './common.schema';

// ============================================
// CREATE POST
// ============================================

export const createPostSchema = z.object({
  title: multiLanguageTextSchema,
  slug: optionalSlugSchema,
  excerpt: optionalMultiLanguageTextSchema.optional(),
  content: multiLanguageTextSchema,
  contentFormat: contentFormatSchema.default('html'),
  contentBlocks: z
    .object({
      en: z.array(contentBlockSchema).optional(),
      mm: z.array(contentBlockSchema).optional(),
    })
    .optional(),
  featuredImage: optionalUrlSchema,
  featuredImageAlt: optionalMultiLanguageTextSchema.optional(),
  gallery: z.array(z.string().url()).optional(),
  postTypeId: z.string().min(1, 'Post type is required'),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  visibility: visibilitySchema.default('Public'),
  password: z.string().optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  allowedGroups: z.array(z.string()).optional(),
  allowComments: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
  customAttributes: z.record(z.unknown()).optional(),
  seo: fullSeoMetaSchema.optional(),
  status: contentStatusSchema.default('Draft'),
  departmentId: z.string().optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

// ============================================
// UPDATE POST
// ============================================

export const updatePostSchema = createPostSchema.partial();

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
