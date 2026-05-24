import { z } from 'zod';

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

const backgroundSchema = z
  .object({
    type: z.enum(['none', 'image', 'solid', 'gradient']),
    image: z.string().optional(),
    solid: z.string().optional(),
    gradient: z
      .object({
        type: z.enum(['linear', 'radial']),
        angle: z.number().min(0).max(360).optional(),
        stops: z.array(
          z.object({
            color: z.string(),
            position: z.number().min(0).max(100),
          }),
        ),
      })
      .optional(),
  })
  .optional();

const textColorsSchema = z
  .object({
    headline: z.string().optional(),
    description: z.string().optional(),
    caption: z.string().optional(),
  })
  .optional();

// Single image entry — `alt` is multilang for accessibility per language;
// `caption` is also multilang for visible text under the thumbnail.
export const galleryImageSchema = z.object({
  url: z.string().min(1, 'Image URL is required'),
  mediaId: z.string().optional(),
  alt: z.object({
    en: z.string().min(1, 'Alt text (EN) is required'),
    mm: z.string().optional(),
  }),
  caption: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  link: z.string().optional(),
});

export const gallerySectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  headline: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  description: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  images: z.array(galleryImageSchema).min(1, 'Add at least one image'),
  layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
  columns: z.number().int().min(1).max(5).default(3),
  showCaptions: z.boolean().default(true),
  lightbox: z.boolean().default(true),
  aspectRatio: z
    .enum(['square', 'landscape', 'portrait', 'auto'])
    .default('auto'),
  background: backgroundSchema,
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(72).optional(),
  descriptionSize: z.number().min(12).max(48).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type GalleryImageFormData = z.infer<typeof galleryImageSchema>;
export type GallerySectionFormData = z.infer<typeof gallerySectionSchema>;
