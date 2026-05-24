import { z } from 'zod';

/**
 * `postBody` section — a template placeholder for the surrounding
 * post / page's Tiptap content. Has no body-data of its own; the
 * public renderer reads the post out of `PostContentContext` at
 * render time. Authors only configure the basics (name, status,
 * visibility, order).
 */
export const postBodySectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(true),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type PostBodySectionFormData = z.infer<typeof postBodySectionSchema>;
