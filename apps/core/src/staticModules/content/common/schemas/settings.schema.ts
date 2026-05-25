/**
 * Settings Zod Schemas
 * Validation schemas for settings forms
 */

import { z } from 'zod';
import {
  multiLanguageTextSchema,
  optionalMultiLanguageTextSchema,
  layoutSchema,
  optionalEmailSchema,
} from './common.schema';

// ============================================
// HEADER SETTINGS
// ============================================

export const headerSettingsSchema = z.object({
  variant: z.string().optional(),
  menuType: z.string().optional(),
  secondaryMenuType: z.string().optional(),
  enabled: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  showLanguageSelector: z.boolean().default(true),
  showUserMenu: z.boolean().default(true),
  showBreadcrumbs: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  showNavigation: z.boolean().default(true),
  useOrgInfoAsBanner: z.boolean().default(true),
  customBannerTitle: optionalMultiLanguageTextSchema.optional(),
  customBannerSubtitle: optionalMultiLanguageTextSchema.optional(),
});

export type HeaderSettingsFormData = z.infer<typeof headerSettingsSchema>;

// ============================================
// SOCIAL LINK
// ============================================

export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Invalid URL'),
  icon: z.string().min(1, 'Icon is required'),
  enabled: z.boolean().default(true),
});

export type SocialLinkFormData = z.infer<typeof socialLinkSchema>;

// ============================================
// FOOTER COLUMN
// ============================================

export const footerColumnLinkSchema = z.object({
  title: multiLanguageTextSchema,
  url: z.string().min(1, 'URL is required'),
});

export const footerColumnSchema = z.object({
  title: multiLanguageTextSchema,
  links: z.array(footerColumnLinkSchema),
});

export type FooterColumnFormData = z.infer<typeof footerColumnSchema>;

// ============================================
// CONTACT INFO
// ============================================

export const contactInfoSchema = z.object({
  showAddress: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showEmail: z.boolean().default(false),
  address: optionalMultiLanguageTextSchema.optional(),
  phone: z.string().optional(),
  email: optionalEmailSchema,
});

export type ContactInfoFormData = z.infer<typeof contactInfoSchema>;

// ============================================
// FOOTER SETTINGS
// ============================================

export const footerSettingsSchema = z.object({
  variant: z.string().optional(),
  menuType: z.string().optional(),
  enabled: z.boolean().default(true),
  showSocialLinks: z.boolean().default(true),
  showCopyright: z.boolean().default(true),
  showBackToTop: z.boolean().default(true),
  copyrightText: optionalMultiLanguageTextSchema.optional(),
  socialLinks: z.array(socialLinkSchema).default([]),
  contactInfo: contactInfoSchema.default({
    showAddress: false,
    showPhone: false,
    showEmail: false,
  }),
  columns: z.array(footerColumnSchema).default([]),
});

export type FooterSettingsFormData = z.infer<typeof footerSettingsSchema>;

// ============================================
// UPDATE SETTINGS
// ============================================

export const updateSettingsSchema = z.object({
  homePageId: z.string().optional(),
  themeName: z.string().optional(),
  layout: layoutSchema.partial().optional(),
  enableHeaderMenu: z.boolean().optional(),
  enableFooterMenu: z.boolean().optional(),
  headerMenuId: z.string().optional(),
  footerMenuId: z.string().optional(),
  header: headerSettingsSchema.partial().optional(),
  footer: footerSettingsSchema.partial().optional(),
  defaultLanguage: z.enum(['en', 'mm']).optional(),
  availableLanguages: z.array(z.string()).optional(),
  metaTitle: z.string().max(60, 'Meta title should be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description should be 160 characters or less').optional(),
  metaKeywords: z.array(z.string()).optional(),
  allowCustomDepartmentBanner: z.boolean().optional(),
});

export type UpdateSettingsFormData = z.infer<typeof updateSettingsSchema>;

// ============================================
// GENERAL SETTINGS
// ============================================

export const generalSettingsSchema = z.object({
  homePageId: z.string().optional(),
  themeName: z.string().min(1, 'Theme is required'),
  defaultLanguage: z.enum(['en', 'mm']),
  availableLanguages: z.array(z.string()).min(1, 'At least one language is required'),
  enableHeaderMenu: z.boolean(),
  enableFooterMenu: z.boolean(),
  headerMenuId: z.string().optional(),
  footerMenuId: z.string().optional(),
  allowCustomDepartmentBanner: z.boolean(),
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

// ============================================
// SEO SETTINGS
// ============================================

export const seoSettingsSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export type SeoSettingsFormData = z.infer<typeof seoSettingsSchema>;
