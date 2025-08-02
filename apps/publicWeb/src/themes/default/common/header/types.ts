// Header types for theme components
// Based on managementpanel architecture

import { NavigationItem, MultiLanguageText } from '../navigation/types';
import { MultilingualText } from '@repo/types';

export interface HeaderBannerProps {
  className?: string;
  logoUrl?: string;
  title?: MultilingualText | string;
  subtitle?: MultilingualText | string;
  currentLanguage?: 'en' | 'mm';
  showLogo?: boolean;
}

export interface HeaderActionsProps {
  className?: string;
  showSearch?: boolean;
  showLanguageSelector?: boolean;
  showUserMenu?: boolean;
  currentLanguage?: string;
  langSelectorVariant?: 'dropdown' | 'select';
  // Mobile view props
  isMobileView?: boolean;
  title?: string;
  navigationItems?: NavigationItem[];
}

export interface HeaderContainerProps {
  className?: string;
  currentLanguage?: 'en' | 'mm';
  tenantId: string;
  // Optional overrides for customization
  showLogo?: boolean;
  showNavigation?: boolean;
  showSearch?: boolean;
  showLanguageSelector?: boolean;
  showUserMenu?: boolean;
}

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

export interface TenantBrandInfo {
  logoUrl?: string;
  corverPhotoURL?: string;
}

// Server-side data interface
export interface HeaderData {
  headerSettings: HeaderSettings;
  logoUrl?: string;
  title?: MultilingualText | string;
  subtitle?: MultilingualText | string;
  navigationItems: NavigationItem[];
  tenantInfo: {
    id: string;
    displayName: MultilingualText;
    displayShortName: MultilingualText;
    localizedDescription: MultilingualText;
    brandInfo: TenantBrandInfo;
  };
}