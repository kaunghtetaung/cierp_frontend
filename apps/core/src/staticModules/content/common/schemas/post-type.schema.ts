/**
 * Post Type Zod Schemas
 * Validation schemas for post type forms
 */

import { z } from 'zod';
import { multiLanguageTextSchema, slugSchema } from './common.schema';

// ============================================
// ATTRIBUTE TYPES
// (Matches backend enum at:
//  /workspace/apps/core/src/content/post-type/schemas/post-type.schema.ts:14)
// ============================================

export const attributeTypeSchema = z.enum([
  'text',
  'textarea',
  'rich-text',
  'number',
  'date',
  'boolean',
  'select',
  'email',
  'url',
]);

// ============================================
// ATTRIBUTE VALIDATION
// (Matches backend `customAttribute.validation` block.)
// ============================================

export const attributeValidationSchema = z.object({
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().nonnegative().optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export type AttributeValidationFormData = z.infer<typeof attributeValidationSchema>;

// ============================================
// ATTRIBUTE OPTION (legacy export — kept so the barrel export still
// resolves. New code uses plain `string[]` for `options`.)
// ============================================

export const attributeOptionSchema = z.object({
  label: z.string(),
  value: z.string().min(1, 'Value is required'),
});

export type AttributeOptionFormData = z.infer<typeof attributeOptionSchema>;

// ============================================
// ATTRIBUTE DEFINITION
// (Matches backend `customAttribute` schema exactly.)
// ============================================

export const attributeDefinitionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Use letters, numbers, and underscores; must start with a letter',
    ),
  label: z.string().min(1, 'Label is required'),
  type: attributeTypeSchema,
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  options: z.array(z.string().min(1)).optional(),
  validation: attributeValidationSchema.optional(),
  order: z.number().int().nonnegative().default(0),
});

export type AttributeDefinitionFormData = z.infer<typeof attributeDefinitionSchema>;

// ============================================
// CREATE POST TYPE
// ============================================

export const createPostTypeSchema = z.object({
  name: multiLanguageTextSchema,
  slug: slugSchema.optional(),
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  customAttributes: z.array(attributeDefinitionSchema).default([]),
  supportsCategories: z.boolean().default(true),
  supportsTags: z.boolean().default(true),
  supportsComments: z.boolean().default(true),
  supportsRevisions: z.boolean().default(true),
  defaultCategoryId: z.string().optional(),
  enableFeaturedImage: z.boolean().default(true),
  enableExcerpt: z.boolean().default(true),
  enableSeo: z.boolean().default(true),
  status: z.enum(['active', 'inactive']).default('active'),
  menuOrder: z.number().int().min(0).default(0),
  departmentId: z.string().optional(),
});

export type CreatePostTypeFormData = z.infer<typeof createPostTypeSchema>;

// ============================================
// UPDATE POST TYPE
// ============================================

export const updatePostTypeSchema = createPostTypeSchema.partial();

export type UpdatePostTypeFormData = z.infer<typeof updatePostTypeSchema>;

// ============================================
// ATTRIBUTE OPERATIONS
// ============================================

export const addAttributeSchema = z.object({
  attribute: attributeDefinitionSchema,
});

export type AddAttributeFormData = z.infer<typeof addAttributeSchema>;

export const updateAttributeSchema = z.object({
  attributeKey: z.string().min(1, 'Attribute key is required'),
  attribute: attributeDefinitionSchema.partial(),
});

export type UpdateAttributeFormData = z.infer<typeof updateAttributeSchema>;

export const removeAttributeSchema = z.object({
  attributeKey: z.string().min(1, 'Attribute key is required'),
});

export type RemoveAttributeFormData = z.infer<typeof removeAttributeSchema>;

export const reorderAttributesSchema = z.object({
  attributeKeys: z.array(z.string()),
});

export type ReorderAttributesFormData = z.infer<typeof reorderAttributesSchema>;

// ============================================
// QUERY PARAMETERS
// ============================================

export const postTypeQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  departmentId: z.string().optional(),
  includePostCount: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  language: z.enum(['en', 'mm']).optional(),
});

export type PostTypeQueryFormData = z.infer<typeof postTypeQuerySchema>;
