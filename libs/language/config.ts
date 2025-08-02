// Language service configuration
// Default configuration that can be overridden per project

import { Language, LanguageServiceConfig } from "./types";

export const DEFAULT_LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    direction: "ltr",
  },
  {
    code: "mm",
    name: "Myanmar",
    nativeName: "မြန်မာ",
    flag: "🇲🇲",
    direction: "ltr",
  },
];

export const DEFAULT_CONFIG: LanguageServiceConfig = {
  apiEndpoint: "/api/lang",
  cookieName: "x-lang",
  cookieOptions: {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: false, // Allow client-side access
    path: "/",
  },
  supportedLanguages: DEFAULT_LANGUAGES,
  defaultLanguage: "en",
};

/**
 * Create language service configuration with defaults
 */
export function createLanguageConfig(
  overrides: Partial<LanguageServiceConfig> = {}
): LanguageServiceConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    cookieOptions: {
      ...DEFAULT_CONFIG.cookieOptions,
      ...overrides.cookieOptions,
    },
    supportedLanguages:
      overrides.supportedLanguages || DEFAULT_CONFIG.supportedLanguages,
  };
}
