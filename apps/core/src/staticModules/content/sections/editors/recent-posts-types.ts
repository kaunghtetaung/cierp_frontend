import { z } from 'zod';

// Recent Posts is the first "dynamic" section type — it stores a query
// spec + display config, not the posts themselves. The publicWeb
// renderer fetches matching posts at render time.

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

const multiLangText = z
  .object({
    en: z.string().optional(),
    mm: z.string().optional(),
  })
  .optional();

export const recentPostsQuerySchema = z.object({
  postTypeSlug: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  featuredOnly: z.boolean().default(false),
  limit: z.number().min(1).max(24).default(6),
  sort: z.enum(['latest', 'popular', 'pinned']).default('latest'),
});

export const recentPostsSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  // Heading rendered above the grid (optional — leave blank for headless).
  headline: multiLangText,
  // Optional Lucide icon name shown beside the headline.
  headlineIcon: z.string().optional(),
  subheadline: multiLangText,
  // Optional "View all" CTA.
  viewAllLabel: multiLangText,
  viewAllUrl: z.string().optional(),
  query: recentPostsQuerySchema,
  // - `overlay`: featured-image card with title baked on a gradient
  // - `mosaic`: editorial Stanford-style asymmetric grid —
  //   big-left + 2-stacked-right + full-width-below (4 posts total)
  // - `duo`: 2-hero diagonal mosaic — hero (top-left) + pair
  //   (top-right) + pair (bottom-left) + hero (bottom-right).
  //   Uses 6 posts.
  layout: z
    .enum(['grid', 'list', 'overlay', 'mosaic', 'duo', 'compact'])
    .default('grid'),
  columns: z.number().min(1).max(6).default(3),
  showImage: z.boolean().default(true),
  showExcerpt: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showAuthor: z.boolean().default(false),
  showCategory: z.boolean().default(true),
  // Pagination — when on, the publicWeb renderer shows page controls
  // and treats `query.limit` as the per-page size.
  enablePaging: z.boolean().default(false),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

export type RecentPostsSectionFormData = z.infer<
  typeof recentPostsSectionSchema
>;
export type RecentPostsQueryFormData = z.infer<typeof recentPostsQuerySchema>;
