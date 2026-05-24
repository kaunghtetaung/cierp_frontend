// CMS Content Settings Types - for header, footer, navigation, theme configuration
// NOT for content items like pages/posts/news

import type { MultiLanguageText } from './common';

// Re-export for backward compatibility
export type { MultiLanguageText };

export interface HeaderSettings {
  enabled?: boolean;
  showSearch?: boolean;
  showLanguageSelector?: boolean;
  showUserMenu?: boolean;
  showBreadcrumbs?: boolean;
  showLogo?: boolean;
  showNavigation?: boolean;
  useOrgInfoAsBanner?: boolean;
  customBannerTitle?: MultiLanguageText;
  customBannerSubtitle?: MultiLanguageText;
}

export interface FooterColumn {
  title: MultiLanguageText;
  links?: Array<{
    title: MultiLanguageText;
    url: string;
  }>;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  enabled?: boolean;
}

export interface FooterSettings {
  enabled?: boolean;
  showSocialLinks?: boolean;
  showCopyright?: boolean;
  showBackToTop?: boolean;
  showVisitorCount?: boolean;
  copyrightText?: MultiLanguageText;
  openHours?: MultiLanguageText;
  socialLinks?: SocialLink[];
  contactInfo?: {
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
  };
  columns?: FooterColumn[];
}

export interface MenuItemSettings {
  id: string;
  title: MultiLanguageText;
  url: string;
  icon?: string;
  cssClass?: string;
  openInNewTab?: boolean;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  children?: MenuItemSettings[];
}

export interface LayoutSettings {
  type: "blank" | "fluid" | "boxed";
  background?: {
    type: "solid" | "gradient" | "image";
    value: string;
  };
  className?: string;
}

export interface HomePageInfo {
  id: string;
  title: MultiLanguageText;
  slug: string;
}

export interface ContentSettingsData {
  id: string;
  organizationId: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  themeName: string;
  layout: LayoutSettings;
  header: HeaderSettings;
  enableHeaderMenu: boolean;
  headerMenu: MenuItemSettings[];
  homePageId?: HomePageInfo;
  footer: FooterSettings;
  enableFooterMenu: boolean;
  footerMenu: MenuItemSettings[];
  defaultLanguage: string;
  availableLanguages: string[];
  allowCustomDepartmentBanner: boolean;
  version?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}