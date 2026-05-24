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

const multiLangText = z
  .object({
    en: z.string().optional(),
    mm: z.string().optional(),
  })
  .optional();

const carouselButtonSchema = z.object({
  text: z.object({
    en: z.string().min(1, 'Button text required'),
    mm: z.string().optional(),
  }),
  url: z.string().min(1, 'Button URL required'),
  style: z.enum(['primary', 'secondary', 'outline']),
  openInNewTab: z.boolean().optional().default(false),
});

const carouselSlideSchema = z.object({
  id: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  overlay: z
    .object({
      enabled: z.boolean(),
      color: z.string(),
      opacity: z.number().min(0).max(1),
    })
    .optional(),
  image: z.string().optional(),
  title: multiLangText,
  subtitle: multiLangText,
  description: multiLangText,
  buttons: z.array(carouselButtonSchema).optional(),
  layout: z.enum(['centered', 'split-left', 'split-right', 'flat']).optional(),
  contentStyle: z.enum(['boxed', 'flat']).optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
});

export const carouselSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  slides: z.array(carouselSlideSchema).min(1, 'At least one slide is required'),
  autoplay: z.boolean().optional(),
  autoplaySpeed: z.number().min(1000).max(30000).optional(),
  showDots: z.boolean().optional(),
  showArrows: z.boolean().optional(),
  transitionEffect: z.enum(['fade', 'slide', 'zoom', 'none']).optional(),
  transitionDuration: z.number().min(100).max(3000).optional(),
  height: z.enum(['small', 'medium', 'large', 'fullscreen']).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

export type CarouselSectionFormData = z.infer<typeof carouselSectionSchema>;
export type CarouselSlideFormData = z.infer<typeof carouselSlideSchema>;
