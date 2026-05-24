import { z } from 'zod';

/**
 * NavigationMenuSection — sidebar widget that fetches a Navigation
 * tree by `menuType` and renders nested links. Same Navigation
 * collection the header / footer menus use; pick which one to render
 * via the `menuType` dropdown (predefined values: 'header', 'footer',
 * 'sidebar', 'mobile' plus any custom value authors created in the
 * Navigation editor).
 */

const mlt = z
  .object({
    en: z.string().optional(),
    mm: z.string().optional(),
  })
  .optional();

export const navigationMenuSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: mlt,
  headline: mlt,
  menuType: z.string().min(1, 'Pick a navigation menu'),
  displayMode: z.enum(['tree', 'flat']).default('tree'),
  showIcons: z.boolean().default(false),
  expandActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type NavigationMenuSectionFormData = z.infer<
  typeof navigationMenuSectionSchema
>;
