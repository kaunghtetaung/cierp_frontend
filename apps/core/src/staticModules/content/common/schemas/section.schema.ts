/**
 * Section Zod Schemas
 * Validation schemas for section forms (discriminated union pattern)
 */

import { z } from 'zod';
import {
  multiLanguageTextSchema,
  optionalMultiLanguageTextSchema,
  entityStatusSchema,
  sectionButtonSchema,
  spacingSchema,
  optionalUrlSchema,
} from './common.schema';

// ============================================
// SECTION TYPE
// ============================================

export const sectionTypeSchema = z.enum([
  'hero',
  'featureList',
  'contentWithImage',
  'cta',
  'testimonials',
  'gallery',
  'faq',
  'pricing',
  'dataTable',
  'studentEnrollment',
  'rector',
  'organizationStructure',
]);

// ============================================
// BASE SECTION
// ============================================

export const baseSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: multiLanguageTextSchema,
  order: z.number().min(0).default(0),
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: entityStatusSchema.default('Active'),
  customStyles: z.record(z.unknown()).optional(),
  customClasses: z.array(z.string()).optional(),
  spacing: spacingSchema.optional(),
  departmentId: z.string().optional(),
});

// ============================================
// HERO SECTION
// ============================================

export const heroOverlaySchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default('#000000'),
  opacity: z.number().min(0).max(1).default(0.5),
});

export const heroSectionSchema = baseSectionSchema.extend({
  type: z.literal('hero'),
  headline: multiLanguageTextSchema,
  subheadline: optionalMultiLanguageTextSchema.optional(),
  backgroundImage: optionalUrlSchema,
  backgroundVideo: optionalUrlSchema,
  overlay: heroOverlaySchema.optional(),
  buttons: z.array(sectionButtonSchema).max(3).default([]),
  textAlignment: z.enum(['left', 'center', 'right']).default('center'),
  height: z.enum(['small', 'medium', 'large', 'fullscreen']).default('medium'),
});

export type HeroSectionFormData = z.infer<typeof heroSectionSchema>;

// ============================================
// FEATURE LIST SECTION
// ============================================

export const featureLinkSchema = z.object({
  url: z.string().min(1),
  text: multiLanguageTextSchema,
  openInNewTab: z.boolean().default(false),
});

export const featureItemSchema = z.object({
  title: multiLanguageTextSchema,
  description: multiLanguageTextSchema,
  icon: z.string().optional(),
  image: optionalUrlSchema,
  link: featureLinkSchema.optional(),
});

export const featureListSectionSchema = baseSectionSchema.extend({
  type: z.literal('featureList'),
  headline: optionalMultiLanguageTextSchema.optional(),
  description: optionalMultiLanguageTextSchema.optional(),
  features: z.array(featureItemSchema).min(1, 'At least one feature is required'),
  layout: z.enum(['grid', 'list', 'carousel']).default('grid'),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(3),
  showIcons: z.boolean().default(true),
  showImages: z.boolean().default(false),
});

export type FeatureListSectionFormData = z.infer<typeof featureListSectionSchema>;

// ============================================
// CONTENT WITH IMAGE SECTION
// ============================================

export const contentWithImageSectionSchema = baseSectionSchema.extend({
  type: z.literal('contentWithImage'),
  headline: optionalMultiLanguageTextSchema.optional(),
  content: multiLanguageTextSchema,
  image: z.string().url('Image URL is required'),
  imageAlt: multiLanguageTextSchema,
  imagePosition: z.enum(['left', 'right']).default('right'),
  button: sectionButtonSchema.optional(),
  contentAlignment: z.enum(['left', 'center', 'right']).default('left'),
  imageRatio: z.enum(['square', 'landscape', 'portrait']).default('landscape'),
});

export type ContentWithImageSectionFormData = z.infer<typeof contentWithImageSectionSchema>;

// ============================================
// CTA SECTION
// ============================================

export const ctaSectionSchema = baseSectionSchema.extend({
  type: z.literal('cta'),
  headline: multiLanguageTextSchema,
  description: optionalMultiLanguageTextSchema.optional(),
  backgroundImage: optionalUrlSchema,
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  buttons: z.array(sectionButtonSchema).min(1, 'At least one button is required').max(3),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
});

export type CtaSectionFormData = z.infer<typeof ctaSectionSchema>;

// ============================================
// TESTIMONIALS SECTION
// ============================================

export const testimonialAuthorSchema = z.object({
  name: z.string().min(1, 'Author name is required'),
  title: z.string().optional(),
  company: z.string().optional(),
  avatar: optionalUrlSchema,
});

export const testimonialSchema = z.object({
  quote: multiLanguageTextSchema,
  author: testimonialAuthorSchema,
  rating: z.number().min(1).max(5).optional(),
});

export const testimonialsSectionSchema = baseSectionSchema.extend({
  type: z.literal('testimonials'),
  headline: optionalMultiLanguageTextSchema.optional(),
  description: optionalMultiLanguageTextSchema.optional(),
  testimonials: z.array(testimonialSchema).min(1, 'At least one testimonial is required'),
  layout: z.enum(['grid', 'carousel', 'single']).default('carousel'),
  showRatings: z.boolean().default(true),
  showAvatars: z.boolean().default(true),
  autoplay: z.boolean().optional(),
  autoplaySpeed: z.number().min(1000).max(10000).optional(),
});

export type TestimonialsSectionFormData = z.infer<typeof testimonialsSectionSchema>;

// ============================================
// GALLERY SECTION
// ============================================

export const galleryImageSchema = z.object({
  url: z.string().url('Image URL is required'),
  alt: multiLanguageTextSchema,
  caption: optionalMultiLanguageTextSchema.optional(),
  link: optionalUrlSchema,
});

export const gallerySectionSchema = baseSectionSchema.extend({
  type: z.literal('gallery'),
  headline: optionalMultiLanguageTextSchema.optional(),
  description: optionalMultiLanguageTextSchema.optional(),
  images: z.array(galleryImageSchema).min(1, 'At least one image is required'),
  layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(3),
  showCaptions: z.boolean().default(true),
  lightbox: z.boolean().default(true),
  aspectRatio: z.enum(['square', 'landscape', 'portrait', 'auto']).default('auto'),
});

export type GallerySectionFormData = z.infer<typeof gallerySectionSchema>;

// ============================================
// FAQ SECTION
// ============================================

export const faqItemSchema = z.object({
  question: multiLanguageTextSchema,
  answer: multiLanguageTextSchema,
});

export const faqSectionSchema = baseSectionSchema.extend({
  type: z.literal('faq'),
  headline: optionalMultiLanguageTextSchema.optional(),
  description: optionalMultiLanguageTextSchema.optional(),
  items: z.array(faqItemSchema).min(1, 'At least one FAQ item is required'),
  layout: z.enum(['accordion', 'list']).default('accordion'),
  allowMultipleOpen: z.boolean().default(false),
});

export type FaqSectionFormData = z.infer<typeof faqSectionSchema>;

// ============================================
// PRICING SECTION
// ============================================

export const pricingPlanSchema = z.object({
  name: multiLanguageTextSchema,
  price: z.string().min(1, 'Price is required'),
  period: optionalMultiLanguageTextSchema.optional(),
  features: z.array(multiLanguageTextSchema).min(1, 'At least one feature is required'),
  ctaButton: sectionButtonSchema,
  isPopular: z.boolean().default(false),
});

export const pricingSectionSchema = baseSectionSchema.extend({
  type: z.literal('pricing'),
  headline: optionalMultiLanguageTextSchema.optional(),
  description: optionalMultiLanguageTextSchema.optional(),
  plans: z.array(pricingPlanSchema).min(1, 'At least one pricing plan is required'),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export type PricingSectionFormData = z.infer<typeof pricingSectionSchema>;

// ============================================
// SECTION UNION
// ============================================

export const sectionSchema = z.discriminatedUnion('type', [
  heroSectionSchema,
  featureListSectionSchema,
  contentWithImageSectionSchema,
  ctaSectionSchema,
  testimonialsSectionSchema,
  gallerySectionSchema,
  faqSectionSchema,
  pricingSectionSchema,
]);

export type SectionFormData = z.infer<typeof sectionSchema>;

// ============================================
// SECTION QUERY
// ============================================

export const sectionQuerySchema = z.object({
  search: z.string().optional(),
  type: sectionTypeSchema.optional(),
  status: entityStatusSchema.optional(),
  isReusable: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  departmentId: z.string().optional(),
  includeDeleted: z.boolean().optional(),
  language: z.enum(['en', 'mm']).optional(),
  skip: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SectionQueryFormData = z.infer<typeof sectionQuerySchema>;
