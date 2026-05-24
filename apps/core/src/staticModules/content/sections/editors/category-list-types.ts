import { z } from 'zod';

/**
 * CategoryListSection — sidebar widget that surfaces the tenant's
 * Category collection in one of three visual variants:
 *   - `list`   plain vertical list with optional post counts
 *   - `tree`   hierarchical (uses Category.parentId)
 *   - `badge`  pill-style chips
 *
 * Source IDs are stored as ObjectId references on the backend so
 * renames don't break the link; on the form side we serialize as
 * strings.
 */

const mlt = z
  .object({
    en: z.string().optional(),
    mm: z.string().optional(),
  })
  .optional();

export const categoryListSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: mlt,
  headline: mlt,
  displayMode: z.enum(['list', 'tree', 'badge']).default('list'),
  // Empty array = render every category. Non-empty = filter to
  // these specific ids in the order they appear here.
  categoryIds: z.array(z.string()).default([]),
  showCount: z.boolean().default(true),
  limit: z.number().int().min(0).max(200).default(0),
  viewAllUrl: z.string().optional(),
  viewAllLabel: mlt,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type CategoryListSectionFormData = z.infer<
  typeof categoryListSectionSchema
>;
