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
    quote: z.string().optional(),
    author: z.string().optional(),
  })
  .optional();

// Author block — `name` and `title` are MultiLanguageText so authors
// can fill EN + MM (matches updated backend TestimonialAuthor schema).
// `company` and `avatar` stay plain strings.
export const testimonialAuthorSchema = z.object({
  name: z.object({
    en: z.string().min(1, 'Author name (EN) is required'),
    mm: z.string().optional(),
  }),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
});

// Single testimonial — quote is multilang, author is single-lang.
export const testimonialItemSchema = z.object({
  quote: z.object({
    en: z.string().min(1, 'Quote (EN) is required'),
    mm: z.string().optional(),
  }),
  author: testimonialAuthorSchema,
  rating: z.number().int().min(1).max(5).optional(),
});

export const testimonialsSectionSchema = z.object({
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
  testimonials: z
    .array(testimonialItemSchema)
    .min(1, 'Add at least one testimonial'),
  layout: z.enum(['grid', 'carousel', 'single']).default('grid'),
  showRatings: z.boolean().default(true),
  showAvatars: z.boolean().default(true),
  autoplay: z.boolean().optional(),
  autoplaySpeed: z.number().min(1000).optional(),
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

export type TestimonialAuthorFormData = z.infer<typeof testimonialAuthorSchema>;
export type TestimonialItemFormData = z.infer<typeof testimonialItemSchema>;
export type TestimonialsSectionFormData = z.infer<
  typeof testimonialsSectionSchema
>;
