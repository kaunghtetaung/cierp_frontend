// Language selector utilities
// Wrapper around the language service for backward compatibility

import {
  languageService,
  DEFAULT_LANGUAGES as SERVICE_DEFAULT_LANGUAGES,
} from "@repo/language";
import type { Language } from "@repo/language";

// Re-export for backward compatibility
export type { Language };

export const DEFAULT_LANGUAGES: Language[] = SERVICE_DEFAULT_LANGUAGES;

/**
 * Get language by code
 */
export function getLanguageByCode(
  code: string,
  languages: Language[] = DEFAULT_LANGUAGES
): Language | undefined {
  return languages.find((lang) => lang.code === code);
}

/**
 * Get default language (first in the list)
 */
export function getDefaultLanguage(
  languages: Language[] = DEFAULT_LANGUAGES
): Language {
  return languages[0] || DEFAULT_LANGUAGES[0];
}

/**
 * Validate language code
 */
export function isValidLanguageCode(
  code: string,
  languages: Language[] = DEFAULT_LANGUAGES
): boolean {
  return languageService.isValidLanguage(code);
}

/**
 * Get browser language preference
 */
export function getBrowserLanguage(
  languages: Language[] = DEFAULT_LANGUAGES
): string {
  return languageService.getBrowserLanguage();
}

/**
 * Get stored language from cookie
 */
export function getStoredLanguage(): string | null {
  return languageService.getStoredLanguage();
}

/**
 * Store language in cookie
 */
export function setStoredLanguage(languageCode: string): void {
  languageService.setStoredLanguage(languageCode);
}

/**
 * Change language via API call
 */
export async function changeLanguageAPI(languageCode: string): Promise<void> {
  const result = await languageService.changeLanguage(languageCode);

  if (!result.success) {
    throw new Error(result.error || "Failed to change language");
  }
}
