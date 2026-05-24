import { z } from 'zod';

const spacingSchema = z.object({
  paddingTop: z.string().optional(),
  paddingBottom: z.string().optional(),
  paddingLeft: z.string().optional(),
  paddingRight: z.string().optional(),
  marginTop: z.string().optional(),
  marginBottom: z.string().optional(),
}).optional();

const containerSettingsSchema = z.object({
  width: z.enum(['fullWidth', 'contained', 'custom']),
  maxWidth: z.string().optional(),
  padding: z.object({
    left: z.string().optional(),
    right: z.string().optional(),
  }).optional(),
}).optional();

const responsiveSettingsSchema = z.object({
  hideOnMobile: z.boolean().optional(),
  hideOnTablet: z.boolean().optional(),
  hideOnDesktop: z.boolean().optional(),
}).optional();

const backgroundSchema = z.object({
  // `type` is the discriminator for which sub-field the renderer
  // reads (none / image / solid / gradient). Optional + defaults to
  // 'none' so a partial `{ solid: '#xxx' }` from the per-card colour
  // picker validates without forcing the form to expose a separate
  // background-type select. Renderer treats undefined as 'none'.
  type: z.enum(['none', 'image', 'solid', 'gradient']).optional().default('none'),
  image: z.string().optional(),
  solid: z.string().optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial']),
    angle: z.number().min(0).max(360).optional(),
    stops: z.array(z.object({
      color: z.string(),
      position: z.number().min(0).max(100),
    })),
  }).optional(),
}).optional();

const textColorsSchema = z.object({
  title: z.string().optional(),
  headline: z.string().optional(),
  description: z.string().optional(),
  features: z.string().optional(),
}).optional();

const featureLinkSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  text: z.object({
    en: z.string().min(1, 'Link text (EN) is required'),
    mm: z.string().optional(),
  }),
  openInNewTab: z.boolean().optional().default(false),
}).optional();

export const featureItemSchema = z.object({
  title: z.object({
    en: z.string().min(1, 'Title (EN) is required'),
    mm: z.string().optional(),
  }),
  description: z.object({
    en: z.string().min(1, 'Description (EN) is required'),
    mm: z.string().optional(),
  }),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  iconSize: z.number().min(12).max(96).optional(),
  iconAlign: z.enum(['left', 'center', 'right']).optional(),
  image: z.string().optional(),
  link: featureLinkSchema,
  background: backgroundSchema,
  textColor: z.string().optional(),
  titleSize: z.number().min(12).max(72).optional(),
  titleAlign: z.enum(['left', 'center', 'right']).optional(),
  descriptionSize: z.number().min(10).max(48).optional(),
  descriptionAlign: z.enum(['left', 'center', 'right']).optional(),
});

export const featureListSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  headline: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  // Section-header presentation. Optional Lucide icon name shown
  // beside the headline (resolved by IconComponent), plus per-axis
  // alignment + icon sizing/colour. Mirrors the RecentPosts pattern
  // so authors get the same set of header knobs across section types.
  headlineIcon: z.string().optional(),
  headlineIconColor: z.string().optional(),
  headlineIconSize: z.number().min(12).max(96).optional(),
  headlineAlign: z.enum(['left', 'center', 'right']).optional(),
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  features: z.array(featureItemSchema).min(1, 'At least one feature is required'),
  layout: z.enum(['grid', 'list', 'carousel']),
  columns: z.enum(['1', '2', '3', '4']),
  showIcons: z.boolean(),
  showImages: z.boolean(),
  // Section-wide alignment for ALL per-feature content (icon, title,
  // description, button, image). Acts as the DEFAULT for each feature;
  // explicit per-feature `titleAlign`/`descriptionAlign`/`iconAlign`
  // override it. When `headlineAlign` is unset, it also falls back to
  // this value so a single "center" toggle aligns the whole section.
  contentAlign: z.enum(['left', 'center', 'right']).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  // Section-level visuals — already supported on the backend base
  // Section schema. Exposed here so the form can author them.
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(72).optional(),
  descriptionSize: z.number().min(12).max(48).optional(),
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

export type FeatureItemFormData = z.infer<typeof featureItemSchema>;
export type FeatureListSectionFormData = z.infer<typeof featureListSectionSchema>;