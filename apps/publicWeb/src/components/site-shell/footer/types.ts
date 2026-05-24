// Footer types for theme components
// Based on managementpanel architecture

import { MultiLanguageText } from '../navigation/types';

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon?: string;
  title: MultiLanguageText;
}

export interface FooterColumn {
  id: string;
  title: MultiLanguageText;
  links: Array<{
    id: string;
    title: MultiLanguageText;
    url: string;
    openInNewTab?: boolean;
  }>;
  order: number;
}

export interface FooterSettings {
  enabled?: boolean;
  showSocialLinks?: boolean;
  showCopyright?: boolean;
  showLinks?: boolean;
  customCopyrightText?: MultiLanguageText;
  customFooterText?: MultiLanguageText;
}

export interface FooterContainerProps {
  className?: string;
  currentLanguage?: 'en' | 'mm';
  tenantId: string;
  showSocialLinks?: boolean;
  showCopyright?: boolean;
  showLinks?: boolean;
}

export interface FooterData {
  footerSettings: FooterSettings;
  socialLinks: SocialLink[];
  footerColumns: FooterColumn[];
  copyrightText?: string;
  customFooterText?: string;
  tenantInfo: {
    id: string;
    fullName: string;
    shortName: string;
  };
}