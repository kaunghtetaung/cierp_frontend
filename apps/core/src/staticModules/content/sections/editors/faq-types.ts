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
  type: z.enum(['none', 'image', 'solid', 'gradient']),
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
  headline: z.string().optional(),
  description: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
}).optional();

export const faqItemSchema = z.object({
  question: z.object({
    en: z.string().min(1, 'Question (EN) is required'),
    mm: z.string().optional(),
  }),
  // `answer` (plain text) and `answerHtml` (raw HTML) are BOTH
  // optional individually — at least one must be set. The public
  // renderer prefers `answerHtml` when present (lists / tables /
  // images survive); plain `answer` is the legacy back-compat path.
  answer: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  answerHtml: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  category: z.string().optional(),
}).refine(
  item => {
    const a = item.answer?.en?.trim();
    const h = item.answerHtml?.en?.trim();
    return Boolean(a || h);
  },
  {
    message: 'Provide either an Answer (plain) or an Answer HTML (rich).',
    path: ['answer', 'en'],
  },
);

export const faqSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  headline: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  description: z.object({
    en: z.string().optional(),
    mm: z.string().optional(),
  }).optional(),
  // Renamed `items` → `faqs` to match the backend persistence shape
  // (`FaqSectionSchema.faqs[]`). Public-web renderer also reads `faqs`.
  faqs: z.array(faqItemSchema).min(1, 'At least one FAQ item is required'),
  layout: z.enum(['accordion', 'list', 'tabs', 'grid']),
  allowMultipleOpen: z.boolean(),
  // Header-visibility toggles — authors can hide the section's
  // headline / description on render without losing the values.
  showHeadline: z.boolean().optional(),
  showDescription: z.boolean().optional(),
  showCategories: z.boolean().optional(),
  searchable: z.boolean().optional(),
  background: backgroundSchema,
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(72).optional(),
  descriptionSize: z.number().min(12).max(48).optional(),
  questionSize: z.number().min(14).max(48).optional(),
  answerSize: z.number().min(12).max(36).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean(),
  isReusable: z.boolean(),
  status: z.enum(['Active', 'Inactive']),
  order: z.number().min(0).optional(),
});

export type FaqItemFormData = z.infer<typeof faqItemSchema>;
export type FaqSectionFormData = z.infer<typeof faqSectionSchema>;
