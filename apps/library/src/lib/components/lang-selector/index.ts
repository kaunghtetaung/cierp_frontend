// CiERP Language Selector Components
// Re-exports the shared language service for convenience

export * from '@repo/language';

// Additional CiERP-specific language utilities can be added here if needed
export const ERP_SUPPORTED_LANGUAGES = ['en', 'mm'] as const;
export type ERPLanguageCode = typeof ERP_SUPPORTED_LANGUAGES[number];

// Default configuration for ERP applications
export const ERP_LANGUAGE_CONFIG = {
  cookieName: 'erp-lang',
  defaultLanguage: 'en' as const,
  supportedLanguages: ERP_SUPPORTED_LANGUAGES,
};