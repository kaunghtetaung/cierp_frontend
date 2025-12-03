/**
 * Tag Zod Schemas
 * Validation schemas for tag forms
 */

import { z } from 'zod';
import { multiLanguageTextSchema, slugSchema } from './common.schema';

// ============================================
// CREATE TAG
// ============================================

export const createTagSchema = z.object({
  name: multiLanguageTextSchema,
  slug: slugSchema.optional(),
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  departmentId: z.string().optional(),
});

export type CreateTagFormData = z.infer<typeof createTagSchema>;

// ============================================
// UPDATE TAG
// ============================================

export const updateTagSchema = createTagSchema.partial();

export type UpdateTagFormData = z.infer<typeof updateTagSchema>;

// ============================================
// MERGE TAGS
// ============================================

export const mergeTagsSchema = z.object({
  sourceTagIds: z.array(z.string()).min(1, 'At least one source tag is required'),
  targetTagId: z.string().min(1, 'Target tag is required'),
});

export type MergeTagsFormData = z.infer<typeof mergeTagsSchema>;

// ============================================
// QUERY PARAMETERS
// ============================================

export const tagQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  featured: z.boolean().optional(),
  departmentId: z.string().optional(),
  includeDeleted: z.boolean().optional(),
  includePostCount: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  language: z.enum(['en', 'mm']).optional(),
});

export type TagQueryFormData = z.infer<typeof tagQuerySchema>;
