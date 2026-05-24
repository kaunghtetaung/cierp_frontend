/**
 * Settings Module TypeScript Types
 * Organization-wide content settings
 */

import type {
  MultiLanguageText,
  BaseEntity,
  Layout,
} from './common.types';

// ============================================
// HEADER SETTINGS
// ============================================

export interface HeaderSettings {
  enabled: boolean;
  showSearch: boolean;
  showLanguageSelector: boolean;
  showUserMenu: boolean;
  showBreadcrumbs: boolean;
  showLogo: boolean;
  showNavigation: boolean;
  useOrgInfoAsBanner: boolean;
  customBannerTitle?: MultiLanguageText;
  customBannerSubtitle?: MultiLanguageText;
}

// ============================================
// SOCIAL LINK
// ============================================

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  enabled: boolean;
}

// ============================================
// FOOTER COLUMN
// ============================================

export interface FooterColumnLink {
  title: MultiLanguageText;
  url: string;
}

export interface FooterColumn {
  title: MultiLanguageText;
  links: FooterColumnLink[];
}

// ============================================
// CONTACT INFO
// ============================================

export interface ContactInfo {
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  address?: MultiLanguageText;
  phone?: string;
  email?: string;
  showMap?: boolean;
  mapEmbedUrl?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// FOOTER SETTINGS
// ============================================

export interface FooterSettings {
  enabled: boolean;
  showSocialLinks: boolean;
  showCopyright: boolean;
  showBackToTop: boolean;
  showVisitorCount?: boolean;
  copyrightText?: MultiLanguageText;
  openHours?: MultiLanguageText;
  socialLinks: SocialLink[];
  contactInfo: ContactInfo;
  columns: FooterColumn[];
}

// ============================================
// SETTINGS ENTITY
// ============================================

export interface Settings extends BaseEntity {
  // Theme
  homePageId?: string;
  themeName: string;
  /** Optional palette / preset variant within the chosen theme.
   *  See `@repo/types/themes` for the catalogue. */
  themeVariant?: string;
  layout: Layout;
  enableHeaderMenu: boolean;
  enableFooterMenu: boolean;
  headerMenuId?: string;
  footerMenuId?: string;
  // Header & Footer
  header: HeaderSettings;
  footer: FooterSettings;
  // Localization
  defaultLanguage: string;
  availableLanguages: string[];
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  // Other
  allowCustomDepartmentBanner: boolean;
  // Site-wide fallback featured image (MinIO key, e.g.
  // "content/public/uploads/default-hero.jpg"). Rendered when a
  // post lacks `featuredImage` of its own.
  defaultFeatureImage?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export interface UpdateSettingsDto {
  homePageId?: string;
  themeName?: string;
  themeVariant?: string;
  layout?: Partial<Layout>;
  enableHeaderMenu?: boolean;
  enableFooterMenu?: boolean;
  headerMenuId?: string;
  footerMenuId?: string;
  header?: Partial<HeaderSettings>;
  footer?: Partial<FooterSettings>;
  defaultLanguage?: string;
  availableLanguages?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  allowCustomDepartmentBanner?: boolean;
  defaultFeatureImage?: string;
}

// ============================================
// PUBLIC SETTINGS (subset for unauthenticated)
// ============================================

export interface PublicSettings {
  themeName: string;
  layout: Layout;
  header: HeaderSettings;
  footer: FooterSettings;
  defaultLanguage: string;
  availableLanguages: string[];
  metaTitle?: string;
  metaDescription?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SettingsResponse {
  statusCode: number;
  message: string;
  data: Settings;
}

export interface PublicSettingsResponse {
  statusCode: number;
  message: string;
  data: PublicSettings;
}
