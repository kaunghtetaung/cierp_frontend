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

const textColorsSchema = z
  .object({
    headline: z.string().optional(),
    description: z.string().optional(),
    plan: z.string().optional(),
    price: z.string().optional(),
  })
  .optional();

export const pricingPriceSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().min(1).default('USD'),
  period: z.enum(['month', 'year', 'one-time']).default('month'),
});

export const pricingFeatureSchema = z.object({
  text: z.object({
    en: z.string().min(1, 'Feature text (EN) is required'),
    mm: z.string().optional(),
  }),
  included: z.boolean().default(true),
  highlight: z.boolean().optional(),
});

export const pricingButtonSchema = z.object({
  text: z.object({
    en: z.string().min(1, 'Button text (EN) is required'),
    mm: z.string().optional(),
  }),
  url: z.string().min(1, 'Button URL is required'),
  style: z.enum(['primary', 'secondary', 'outline']).default('primary'),
});

export const pricingPlanSchema = z.object({
  name: z.object({
    en: z.string().min(1, 'Plan name (EN) is required'),
    mm: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  price: pricingPriceSchema,
  features: z.array(pricingFeatureSchema).default([]),
  button: pricingButtonSchema,
  popular: z.boolean().default(false),
  badge: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
});

export const pricingSectionSchema = z.object({
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
  plans: z
    .array(pricingPlanSchema)
    .min(1, 'Add at least one plan')
    .max(6, 'Up to 6 plans supported per section'),
  billing: z.enum(['monthly', 'yearly', 'both']).default('both'),
  layout: z.enum(['cards', 'table']).default('cards'),
  showComparison: z.boolean().default(false),
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(72).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type PricingPriceFormData = z.infer<typeof pricingPriceSchema>;
export type PricingFeatureFormData = z.infer<typeof pricingFeatureSchema>;
export type PricingButtonFormData = z.infer<typeof pricingButtonSchema>;
export type PricingPlanFormData = z.infer<typeof pricingPlanSchema>;
export type PricingSectionFormData = z.infer<typeof pricingSectionSchema>;
