import { z } from 'zod';

/**
 * TabsSection — dedicated tabbed-content widget. Same per-item shape
 * as FAQ items (label + plain `content` and/or rich `contentHtml`),
 * but renders as a tab strip + single panel instead of accordion.
 * `orientation` flips between horizontal (top labels) and vertical
 * (left rail). At least one of `content` / `contentHtml` must be
 * populated per item — enforced via the refine below so the form
 * surfaces a clear validation error rather than saving an empty tab.
 */

const mlt = z
  .object({
    en: z.string().optional(),
    mm: z.string().optional(),
  })
  .optional();

// Author-configurable spacing — 6 axes, all optional. The publicWeb
// `getSectionSpacingStyles` helper translates the token values
// (none/sm/md/lg/xl) into inline CSS. Shape mirrors `faq-types.ts`
// `spacingSchema` so the same FormField markup can be copied without
// path changes.
const spacingSchema = z
  .object({
    paddingTop: z.string().optional(),
    paddingBottom: z.string().optional(),
    paddingLeft: z.string().optional(),
    paddingRight: z.string().optional(),
    marginTop: z.string().optional(),
    marginBottom: z.string().optional(),
  })
  .optional();

const containerSettingsSchema = z
  .object({
    width: z.enum(['fullWidth', 'contained', 'custom']),
    maxWidth: z.string().optional(),
    padding: z
      .object({
        left: z.string().optional(),
        right: z.string().optional(),
      })
      .optional(),
  })
  .optional();

const responsiveSettingsSchema = z
  .object({
    hideOnMobile: z.boolean().optional(),
    hideOnTablet: z.boolean().optional(),
    hideOnDesktop: z.boolean().optional(),
  })
  .optional();

const requiredMlt = z.object({
  en: z.string().min(1, 'Required'),
  mm: z.string().optional(),
});

export const tabsItemSchema = z
  .object({
    label: requiredMlt,
    content: z
      .object({
        en: z.string().optional(),
        mm: z.string().optional(),
      })
      .optional(),
    contentHtml: z
      .object({
        en: z.string().optional(),
        mm: z.string().optional(),
      })
      .optional(),
    icon: z.string().optional(),
  })
  .refine(
    (item) => {
      const c = item.content?.en?.trim();
      const h = item.contentHtml?.en?.trim();
      return Boolean(c || h);
    },
    {
      message: 'Provide either Content (plain) or Content (rich).',
      path: ['contentHtml', 'en'],
    },
  );

export const tabsSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: mlt,
  headline: mlt,
  description: mlt,
  showHeadline: z.boolean().optional(),
  showDescription: z.boolean().optional(),
  items: z.array(tabsItemSchema).min(1, 'At least one tab is required'),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  defaultIndex: z.number().int().min(0).optional(),
  // Author-controlled section chrome — admin form renders 6 axes of
  // spacing dropdowns; `getSectionSpacingStyles` on the public side
  // turns the values into inline padding / margin.
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(true),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type TabsSectionFormData = z.infer<typeof tabsSectionSchema>;
