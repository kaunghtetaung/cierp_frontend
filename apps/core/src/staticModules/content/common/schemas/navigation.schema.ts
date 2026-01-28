/**
 * Navigation Zod Schemas
 * Validation schemas for navigation forms
 */

import { z } from 'zod';
import {
  multiLanguageTextEnRequiredSchema,
  optionalSlugSchema,
  entityStatusSchema,
  visibilitySchema,
} from './common.schema';

// ============================================
// NAVIGATION TYPES
// ============================================

export const navigationTypeSchema = z.enum([
  'internal',
  'external',
  'page',
  'post',
  'category',
  'custom',
]);

export const menuTypeSchema = z.string().min(1, 'Menu type is required');

// ============================================
// CREATE NAVIGATION (Base schema without refinement for partial)
// ============================================

const baseNavigationSchema = z.object({
  title: multiLanguageTextEnRequiredSchema,
  slug: optionalSlugSchema,
  url: z.string().optional(),
  type: navigationTypeSchema,
  pageId: z.string().optional(),
  postId: z.string().optional(),
  categoryId: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().min(0).optional(),
  icon: z.string().optional(),
  cssClass: z.string().optional(),
  isVisible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
  visibility: visibilitySchema.default('Public'),
  allowedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  allowedGroups: z.array(z.string()).optional(),
  menuType: menuTypeSchema,
  departmentId: z.string().optional(),
  status: entityStatusSchema.default('Active'),
});

// Navigation type refinement function
const navigationTypeRefinement = (data: z.infer<typeof baseNavigationSchema>) => {
  // Validate based on type
  if (data.type === 'external') {
    return !!data.url;
  }
  if (data.type === 'page') {
    return !!data.pageId;
  }
  if (data.type === 'post') {
    return !!data.postId;
  }
  if (data.type === 'category') {
    return !!data.categoryId;
  }
  return true;
};

export const createNavigationSchema = baseNavigationSchema.refine(
  navigationTypeRefinement,
  {
    message: 'Missing required field for the selected type',
    path: ['type'],
  }
);

export type CreateNavigationFormData = z.infer<typeof createNavigationSchema>;

// ============================================
// UPDATE NAVIGATION
// ============================================

export const updateNavigationSchema = baseNavigationSchema.partial();

export type UpdateNavigationFormData = z.infer<typeof updateNavigationSchema>;

// ============================================
// REORDER NAVIGATION
// ============================================

export const reorderNavigationSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().min(0),
      parentId: z.string().optional(),
    })
  ),
});

export type ReorderNavigationFormData = z.infer<typeof reorderNavigationSchema>;

// ============================================
// MOVE NAVIGATION
// ============================================

export const moveNavigationSchema = z.object({
  targetParentId: z.string().nullable().optional(),
  targetOrder: z.number().min(0),
});

export type MoveNavigationFormData = z.infer<typeof moveNavigationSchema>;

// ============================================
// NAVIGATION QUERY
// ============================================

export const navigationQuerySchema = z.object({
  search: z.string().optional(),
  menuType: menuTypeSchema.optional(),
  type: navigationTypeSchema.optional(),
  parentId: z.string().optional(),
  level: z.number().optional(),
  status: entityStatusSchema.optional(),
  visibility: visibilitySchema.optional(),
  isVisible: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  departmentId: z.string().optional(),
  language: z.enum(['en', 'mm']).optional(),
  includeChildren: z.boolean().optional(),
  flatStructure: z.boolean().optional(),
  filterByUserAccess: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
  skip: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type NavigationQueryFormData = z.infer<typeof navigationQuerySchema>;

// ============================================
// BULK OPERATION
// ============================================

export const bulkNavigationOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one item is required'),
  operation: z.enum(['activate', 'deactivate', 'delete', 'restore', 'show', 'hide']),
});

export type BulkNavigationOperationFormData = z.infer<typeof bulkNavigationOperationSchema>;
