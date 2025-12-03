/**
 * Category Zod Schemas
 * Validation schemas for category forms
 */

import { z } from 'zod';
import {
  multiLanguageTextEnRequiredSchema,
  optionalMultiLanguageTextSchema,
  optionalSlugSchema,
  fullSeoMetaSchema,
  categoryStatusSchema,
  hexColorSchema,
  optionalUrlSchema,
} from './common.schema';

// ============================================
// CREATE CATEGORY
// ============================================

export const createCategorySchema = z.object({
  name: multiLanguageTextEnRequiredSchema,
  slug: optionalSlugSchema,
  description: optionalMultiLanguageTextSchema.optional(),
  icon: z.string().optional(),
  image: optionalUrlSchema,
  color: hexColorSchema,
  parentId: z.string().optional(),
  order: z.number().min(0).optional(),
  isVisible: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  seo: fullSeoMetaSchema.optional(),
  status: categoryStatusSchema.default('Active'),
  departmentId: z.string().optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

// ============================================
// UPDATE CATEGORY
// ============================================

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

// ============================================
// MOVE CATEGORY
// ============================================

export const moveCategorySchema = z.object({
  targetParentId: z.string().nullable().optional(),
  targetOrder: z.number().min(0),
});

export type MoveCategoryFormData = z.infer<typeof moveCategorySchema>;

// ============================================
// REORDER CATEGORIES
// ============================================

export const reorderCategoriesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().min(0),
      parentId: z.string().optional(),
    })
  ),
});

export type ReorderCategoriesFormData = z.infer<typeof reorderCategoriesSchema>;

// ============================================
// CATEGORY QUERY
// ============================================

export const categoryQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.string().optional(),
  level: z.number().optional(),
  status: categoryStatusSchema.optional(),
  isVisible: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  departmentId: z.string().optional(),
  includeChildren: z.boolean().optional(),
  includePostCount: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
  treeStructure: z.boolean().optional(),
  language: z.enum(['en', 'mm']).optional(),
  skip: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CategoryQueryFormData = z.infer<typeof categoryQuerySchema>;
