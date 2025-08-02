// Page module exports - Server-side only (simplified for slug-based page fetching)
export * from './page-wrapper';
export * from './page-service';

// Re-export types from page-service
export type {
  PageData,
  PageSEO,
  LayoutSettings
} from './page-service';

// Re-export common types from centralized location
export type {
  MultiLanguageText,
  SectionData
} from '@repo/types';

// Legacy aliases for backward compatibility  
export { clearPageCache as clearCache } from './page-service';

// Simplified constants for the page module
export const PAGE_MODULE_VERSION = '1.0.0';

/**
 * Default configuration for the page module
 */
export const DEFAULT_PAGE_CONFIG = {
  language: 'en',
  fallbackLanguage: 'en',
  cacheEnabled: true,
  cacheTtl: 60 * 60 * 24, // 24 hours
  enablePermissionCheck: false // Disabled for public pages
} as const;