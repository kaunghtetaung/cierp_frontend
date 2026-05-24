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
    content: z.string().optional(),
    button: z.string().optional(),
  })
  .optional();

export const contentWithImageButtonSchema = z.object({
  text: z.object({
    en: z.string().min(1, 'Button text (EN) is required'),
    mm: z.string().optional(),
  }),
  url: z.string().min(1, 'Button URL is required'),
  style: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  openInNewTab: z.boolean().default(false),
});

export const contentWithImageSectionSchema = z.object({
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
  content: z.object({
    en: z.string().min(1, 'Content (EN) is required'),
    mm: z.string().optional(),
  }),
  image: z.string().min(1, 'Image is required'),
  imageAlt: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }),
  imagePosition: z.enum(['left', 'right']).default('right'),
  imageRatio: z.enum(['square', 'landscape', 'portrait']).default('landscape'),
  contentAlignment: z.enum(['left', 'center', 'right']).default('left'),
  button: contentWithImageButtonSchema.optional(),
  background: backgroundSchema,
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(72).optional(),
  contentSize: z.number().min(12).max(36).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type ContentWithImageButtonFormData = z.infer<
  typeof contentWithImageButtonSchema
>;
export type ContentWithImageSectionFormData = z.infer<
  typeof contentWithImageSectionSchema
>;
