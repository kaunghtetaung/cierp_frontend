/**
 * Utility functions for handling multilingual text
 */

export interface MultilingualText {
  readonly en?: string;
  readonly mm?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Get localized text from multilingual object
 * @param multilingualText - Object containing text in multiple languages
 * @param preferredLanguage - Preferred language code (defaults to 'en')
 * @param fallback - Fallback text if no localization found
 * @returns Localized string
 */
export function getLocalizedText(
  multilingualText: MultilingualText | undefined,
  preferredLanguage: string = 'en',
  fallback: string = ''
): string {
  if (!multilingualText) return fallback;
  
  // Try the preferred language
  if (multilingualText[preferredLanguage]) {
    return multilingualText[preferredLanguage] || fallback;
  }
  
  // Try English as fallback
  if (preferredLanguage !== 'en' && multilingualText.en) {
    return multilingualText.en;
  }
  
  // Try Myanmar as fallback
  if (preferredLanguage !== 'mm' && multilingualText.mm) {
    return multilingualText.mm;
  }
  
  return fallback;
}

/**
 * Check if multilingual text has content in any language
 * @param multilingualText - Object containing text in multiple languages
 * @returns True if any language has content
 */
export function hasLocalizedContent(multilingualText: MultilingualText | undefined): boolean {
  if (!multilingualText) return false;
  return Object.values(multilingualText).some(value => Boolean(value?.trim()));
}

/**
 * Get all available languages for a multilingual text object
 * @param multilingualText - Object containing text in multiple languages
 * @returns Array of language codes that have content
 */
export function getAvailableLanguages(multilingualText: MultilingualText | undefined): string[] {
  if (!multilingualText) return [];
  return Object.keys(multilingualText).filter(key => Boolean(multilingualText[key]?.trim()));
}