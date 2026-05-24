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
  type: z.enum(['none', 'image', 'video', 'solid', 'gradient']),
  image: z.string().optional(),
  video: z.string().optional(),
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
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  buttons: z.string().optional(),
}).optional();

export const heroSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  headline: z.object({
    en: z.string().min(1, 'Headline (EN) is required'),
    mm: z.string().optional(),
  }),
  subheadline: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  background: backgroundSchema,
  overlay: z.object({
    enabled: z.boolean(),
    color: z.string(),
    opacity: z.number().min(0).max(1),
  }),
  textAlignment: z.enum(['left', 'center', 'right']),
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(96).optional(),
  subheadlineSize: z.number().min(12).max(72).optional(),
  height: z.enum(['small', 'medium', 'large', 'fullscreen']),
  buttons: z.array(
    z.object({
      text: z.object({
        en: z.string().min(1, 'Button text required'),
        mm: z.string().optional(),
      }),
      url: z.string().min(1, 'Button URL required'),
      style: z.enum(['primary', 'secondary', 'outline']),
      openInNewTab: z.boolean().optional().default(false),
    })
  ),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

export type HeroSectionFormData = z.infer<typeof heroSectionSchema>;
