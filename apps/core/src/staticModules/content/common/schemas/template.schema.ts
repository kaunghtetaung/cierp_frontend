/**
 * Template Zod Schemas
 *
 * Authorable Templates store a layout tree (containers > rows > columns
 * > [sectionRefs | rows]) — same shape as a Page's `layout`. Validation
 * here is permissive on the layout itself (`z.record(z.unknown())`)
 * because PageLayoutBuilder is the source of truth for shape; we just
 * need it round-tripped intact.
 */

import { z } from 'zod';
import {
  optionalMultiLanguageTextSchema,
  entityStatusSchema,
} from './common.schema';

// ============================================
// BASE
// ============================================

export const templateBaseSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  slug: z.string().optional(),
  title: optionalMultiLanguageTextSchema.optional(),
  description: optionalMultiLanguageTextSchema.optional(),
  previewImage: z.string().optional(),
  category: z.string().optional(),
  /**
   * Layout tree — recursive shape enforced by PageLayoutBuilder.
   * Permissive here so adding/removing nested layout fields doesn't
   * require a Zod schema migration.
   */
  layout: z.record(z.unknown()).optional(),
  status: entityStatusSchema.default('Active'),
  departmentId: z.string().optional(),
});

// ============================================
// CREATE / UPDATE
// ============================================

export const createTemplateSchema = templateBaseSchema;

export const updateTemplateSchema = templateBaseSchema.partial().extend({
  /** Optimistic concurrency token from the server. */
  version: z.number().optional(),
});

export type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateFormData = z.infer<typeof updateTemplateSchema>;

// ============================================
// QUERY
// ============================================

export const templateQuerySchema = z.object({
  search: z.string().optional(),
  status: entityStatusSchema.optional(),
  category: z.string().optional(),
  departmentId: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type TemplateQueryFormData = z.infer<typeof templateQuerySchema>;
