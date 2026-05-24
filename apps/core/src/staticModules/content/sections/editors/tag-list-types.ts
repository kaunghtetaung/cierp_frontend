import { z } from 'zod';

/**
 * TagListSection — sidebar widget for tags. Three display modes:
 *   - `cloud`  classic tag cloud (size scales with usageCount)
 *   - `list`   plain vertical list with optional counts
 *   - `badge`  flat chips, all the same size
 *
 * `sort` controls the underlying query — popular (by usageCount
 * desc) or alphabetical.
 */

const mlt = z
  .object({
    en: z.string().optional(),
    mm: z.string().optional(),
  })
  .optional();

export const tagListSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: mlt,
  headline: mlt,
  displayMode: z.enum(['cloud', 'list', 'badge']).default('cloud'),
  tagIds: z.array(z.string()).default([]),
  showCount: z.boolean().default(true),
  limit: z.number().int().min(0).max(200).default(30),
  sort: z.enum(['popular', 'alphabetical']).default('popular'),
  viewAllUrl: z.string().optional(),
  viewAllLabel: mlt,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type TagListSectionFormData = z.infer<typeof tagListSectionSchema>;
