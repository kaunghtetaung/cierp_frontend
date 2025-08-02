// CMS Content Settings Package - Server-side only
// This package handles CMS configuration (header, footer, navigation, theme settings)
// NOT for content items like pages/posts/news - those are handled by separate modules

export * from './wrapper';
export * from './content-service';

// Primary exports for CMS settings
export {
  getContentSettings,
  getHeaderSettings,
  getFooterSettings,
  getHeaderMenu,
  getFooterMenu,
  getLayoutSettings,
  getMetaInfo,
  getThemeName,
  getLanguageSettings,
  validateContentSettings,
  clearContentSettingsCache,
  getLocalizedText,
  shouldShowMenuItem,
  getContentForRequest,
  ContentService,
  ContentWrapper,
  contentWrapper,
  getEffective
} from './wrapper';

// Service-level exports  
export {
  getContentSettings as getContentSettingsService,
  getHeaderSettings as getHeaderSettingsService,
  getFooterSettings as getFooterSettingsService,
  getHeaderMenu as getHeaderMenuService,
  getFooterMenu as getFooterMenuService,
  getLayoutSettings as getLayoutSettingsService,
  getMetaInfo as getMetaInfoService,
  getThemeName as getThemeNameService,
  getLanguageSettings as getLanguageSettingsService,
  validateContentSettings as validateContentSettingsService,
  clearContentSettingsCache as clearContentSettingsCacheService,
  getLocalizedText as getLocalizedTextService,
  shouldShowMenuItem as shouldShowMenuItemService
} from './content-service';

// CMS Settings Types (from @repo/types/content)
export type {
  ContentSettingsData,
  HeaderSettings,
  FooterSettings,
  MenuItemSettings,
  LayoutSettings,
  MultiLanguageText,
  FooterColumn,
  SocialLink,
  HomePageInfo
} from '@repo/types/content';

// Legacy aliases for backward compatibility
export { getContentSettings as getContent } from './content-service';
export { getContentSettings as getContentList } from './content-service';
export { clearContentSettingsCache as clearContentCache } from './content-service';

// Constants
export const CONTENT_MODULE_VERSION = '1.0.0';
export const CONTENT_PURPOSE = 'CMS Settings (header, footer, navigation, theme) - NOT content items';

// Re-export all types from @repo/types/content for convenience
export * from '@repo/types/content';