/**
 * Post Type Zod Schemas
 * Validation schemas for post type forms
 */

import { z } from 'zod';
import { multiLanguageTextSchema, slugSchema } from './common.schema';

// ============================================
// ATTRIBUTE TYPES
// ============================================

export const attributeTypeSchema = z.enum([
  'text',
  'textarea',
  'richText',
  'number',
  'date',
  'datetime',
  'boolean',
  'select',
  'multiSelect',
  'image',
  'file',
  'gallery',
  'url',
  'email',
  'color',
  'relation',
]);

// ============================================
// ATTRIBUTE VALIDATION
// ============================================

export const attributeValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  allowedExtensions: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
});

export type AttributeValidationFormData = z.infer<typeof attributeValidationSchema>;

// ============================================
// ATTRIBUTE OPTION
// ============================================

export const attributeOptionSchema = z.object({
  label: multiLanguageTextSchema,
  value: z.string().min(1, 'Value is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

export type AttributeOptionFormData = z.infer<typeof attributeOptionSchema>;

// ============================================
// ATTRIBUTE DEFINITION
// ============================================

export const attributeDefinitionSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Key must start with a letter and contain only alphanumeric characters and underscores'),
  label: multiLanguageTextSchema,
  type: attributeTypeSchema,
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  placeholder: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  defaultValue: z.unknown().optional(),
  options: z.array(attributeOptionSchema).optional(),
  validation: attributeValidationSchema.optional(),
  isLocalizable: z.boolean().default(false),
  showInList: z.boolean().default(false),
  showInPreview: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  group: z.string().optional(),
  dependsOn: z.object({
    attributeKey: z.string(),
    value: z.unknown(),
  }).optional(),
  relationConfig: z.object({
    targetType: z.string(),
    displayField: z.string(),
    multiple: z.boolean(),
  }).optional(),
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
  attributes: z.array(attributeDefinitionSchema).default([]),
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
