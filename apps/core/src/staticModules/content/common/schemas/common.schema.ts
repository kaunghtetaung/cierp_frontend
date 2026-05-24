/**
 * Common Zod Schemas
 * Shared validation schemas used across CMS modules
 */

import { z } from 'zod';

// ============================================
// MULTI-LANGUAGE TEXT
// ============================================

export const multiLanguageTextSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  mm: z.string().min(1, 'Myanmar text is required'),
});

// At least English is required, Myanmar is optional
export const multiLanguageTextEnRequiredSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  mm: z.string().optional().default(''),
});

export const optionalMultiLanguageTextSchema = z.object({
  en: z.string().optional().default(''),
  mm: z.string().optional().default(''),
});

// ============================================
// CONTENT FORMATS
// ============================================

export const contentFormatSchema = z.enum(['plain', 'markdown', 'html', 'json']);

export const contentBlockTypeSchema = z.enum([
  'paragraph',
  'heading',
  'image',
  'code',
  'quote',
  'list',
  'divider',
  'embed',
  'table',
]);

export const contentBlockSchema = z.object({
  id: z.string(),
  type: contentBlockTypeSchema,
  data: z.record(z.unknown()),
  order: z.number(),
});

// ============================================
// VISIBILITY & STATUS
// ============================================

export const visibilitySchema = z.enum(['Public', 'Private', 'Protected', 'Password', 'Restricted']);
export const contentStatusSchema = z.enum(['Draft', 'Published', 'Archived', 'Scheduled']);
export const entityStatusSchema = z.enum(['Active', 'Inactive']);
export const categoryStatusSchema = z.enum(['Active', 'Inactive', 'Draft']);

// ============================================
// SLUG VALIDATION
// ============================================

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .min(1, 'Slug is required')
  .max(200, 'Slug is too long');

export const optionalSlugSchema = z
  .string()
  .regex(/^[a-z0-9-]*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .max(200, 'Slug is too long')
  .optional();

// ============================================
// SEO
// ============================================

export const seoMetaSchema = z.object({
  metaTitle: z.string().max(60, 'Meta title should be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description should be 160 characters or less').optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export const openGraphMetaSchema = z.object({
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
});

export const fullSeoMetaSchema = seoMetaSchema.merge(openGraphMetaSchema).extend({
  canonicalUrl: z.string().url().optional().or(z.literal('')),
});

// ============================================
// LAYOUT
// ============================================

export const layoutTypeSchema = z.enum(['boxed', 'fluid', 'blank']);
export const backgroundTypeSchema = z.enum(['color', 'image', 'gradient']);

export const layoutBackgroundSchema = z.object({
  type: backgroundTypeSchema,
  value: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const layoutSchema = z.object({
  type: layoutTypeSchema,
  background: layoutBackgroundSchema.optional(),
  className: z.string().optional(),
});

// ============================================
// BUTTON / CTA
// ============================================

export const buttonStyleSchema = z.enum(['primary', 'secondary', 'outline']);

export const sectionButtonSchema = z.object({
  text: multiLanguageTextSchema,
  url: z.string().min(1, 'URL is required'),
  style: buttonStyleSchema,
  openInNewTab: z.boolean().default(false),
});

// ============================================
// PAGINATION
// ============================================

export const paginationQuerySchema = z.object({
  skip: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================
// VISIBILITY SETTINGS
// ============================================

export const visibilitySettingsSchema = z.object({
  visibility: visibilitySchema,
  password: z.string().optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
  allowedGroups: z.array(z.string()).optional(),
});

// ============================================
// SPACING
// ============================================

export const spacingSchema = z.object({
  paddingTop: z.string().optional(),
  paddingBottom: z.string().optional(),
  marginTop: z.string().optional(),
  marginBottom: z.string().optional(),
});

// ============================================
// COLOR VALIDATION
// ============================================

export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
  .optional();

// ============================================
// URL VALIDATION
// ============================================

export const urlSchema = z.string().url('Invalid URL').or(z.literal(''));
export const optionalUrlSchema = z.string().url('Invalid URL').optional().or(z.literal(''));

// ============================================
// EMAIL VALIDATION
// ============================================

export const emailSchema = z.string().email('Invalid email address');
export const optionalEmailSchema = z.string().email('Invalid email address').optional().or(z.literal(''));
