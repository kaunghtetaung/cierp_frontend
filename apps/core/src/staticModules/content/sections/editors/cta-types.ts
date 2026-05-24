import { z } from 'zod';

// Re-uses the same shared shape conventions (spacing/container/responsive/
// background/textColors) as the FAQ / Hero forms so the SectionEditorPage
// chrome (preview frame, language toggle, etc.) treats every section the
// same way. Section-specific fields go on top of these shared blocks.

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
    button: z.string().optional(),
  })
  .optional();

// CTA-specific item schema — single button entry. The form renders an
// array of these so authors can add multiple call-to-action buttons
// (e.g. "Get Started" + "Contact Sales").
export const ctaButtonSchema = z.object({
  text: z.object({
    en: z.string().min(1, 'Button text (EN) is required'),
    mm: z.string().optional(),
  }),
  url: z.string().min(1, 'Button URL is required'),
  style: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  openInNewTab: z.boolean().default(false),
  icon: z.string().optional(),
});

export const ctaSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  headline: z.object({
    en: z.string().min(1, 'Headline (EN) is required'),
    mm: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  buttons: z
    .array(ctaButtonSchema)
    .min(1, 'Add at least one call-to-action button')
    .max(4, 'Up to 4 buttons supported on a single CTA section'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  backgroundImage: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  background: backgroundSchema,
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(96).optional(),
  descriptionSize: z.number().min(12).max(48).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type CtaButtonFormData = z.infer<typeof ctaButtonSchema>;
export type CtaSectionFormData = z.infer<typeof ctaSectionSchema>;
