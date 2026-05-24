import { z } from 'zod';

// Stats Counter section — generic stat-counter cards. Mirrors the
// backend `StatsSection` shape (counters[] with multi-lang title +
// description, lucide icon name, count string, and per-card colour
// overrides).

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
  })
  .optional();

export const statCounterSchema = z.object({
  title: z.object({
    en: z.string().min(1, 'Counter title (EN) is required'),
    mm: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  // Lucide-react icon name (e.g. "Users", "GraduationCap", "BookOpen").
  // Free-text so authors can type any icon shipped by lucide.
  icon: z.string().min(1, 'Icon is required'),
  iconColor: z.string().optional(),
  // Free-form display string — supports formatted values like "2,500",
  // "500+", "98%". Stored as string so backend renderers don't have to
  // worry about locale-specific number formatting.
  count: z.string().min(1, 'Count value is required'),
  bgColor: z.string().min(1, 'Background color is required'),
  textColor: z.string().min(1, 'Text color is required'),
});

export const statsSectionSchema = z.object({
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
  counters: z
    .array(statCounterSchema)
    .min(1, 'Add at least one counter')
    .max(8, 'Up to 8 counters supported per section'),
  layout: z.enum(['grid', 'row']).default('grid'),
  columns: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .default(4),
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

export type StatCounterFormData = z.infer<typeof statCounterSchema>;
export type StatsSectionFormData = z.infer<typeof statsSectionSchema>;
