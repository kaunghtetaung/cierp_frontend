// Language service utilities
// Reusable utility functions for language handling

import { Language } from './types';
import { extractBaseDomain } from '../utils/common/url';

/**
 * Get language by code from a list of languages
 */
export function getLanguageByCode(code: string, languages: Language[]): Language | undefined {
  return languages.find(lang => lang.code === code);
}

/**
 * Get default language (first in the list)
 */
export function getDefaultLanguage(languages: Language[]): Language {
  return languages[0];
}

/**
 * Validate language code against supported languages
 */
export function isValidLanguageCode(code: string, languages: Language[]): boolean {
  return languages.some(lang => lang.code === code);
}

/**
 * Get browser language preference
 * Attempts to match browser language with supported languages
 */
export function getBrowserLanguage(languages: Language[]): string {
  if (typeof window === 'undefined') {
    return getDefaultLanguage(languages).code;
  }

  // Try to match browser language
  const browserLang = navigator.language.split('-')[0];
  if (isValidLanguageCode(browserLang, languages)) {
    return browserLang;
  }

  // Try to match browser languages (fallback)
  for (const lang of navigator.languages || []) {
    const langCode = lang.split('-')[0];
    if (isValidLanguageCode(langCode, languages)) {
      return langCode;
    }
  }

  return getDefaultLanguage(languages).code;
}

/**
 * Get language from cookie
 */
export function getLanguageFromCookie(cookieName: string = 'x-lang'): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading language from cookie:', error);
    return null;
  }
}

/**
 * Get base domain for cookie (using shared utility)
 */
function getBaseDomainForCookie(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  
  // For localhost, don't use domain attribute
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return null;
  }

  // Use shared utility for consistent domain extraction
  return extractBaseDomain(hostname);
}

/**
 * Set language in cookie (always at root domain level for sharing across subdomains)
 */
export function setLanguageInCookie(
  languageCode: string, 
  cookieName: string = 'x-lang',
  cookieOptions: {
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    domain?: string;
  } = {}
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const {
      maxAge = 365 * 24 * 60 * 60, // 1 year
      secure = process.env.NODE_ENV === 'production',
      sameSite = 'lax',
      path = '/',
      domain = getBaseDomainForCookie()
    } = cookieOptions;

    let cookieString = `${cookieName}=${encodeURIComponent(languageCode)}`;
    cookieString += `; Max-Age=${maxAge}`;
    cookieString += `; Path=${path}`;
    cookieString += `; SameSite=${sameSite}`;
    
    // Set domain for root-level sharing (but not for localhost)
    if (domain) {
      cookieString += `; Domain=.${domain}`;
    }
    
    if (secure) {
      cookieString += '; Secure';
    }

    document.cookie = cookieString;
  } catch (error) {
    console.error('Error setting language cookie:', error);
  }
}

/**
 * Get language from server headers (for SSR)
 */
export function getLanguageFromHeaders(headers: Headers, headerName: string = 'x-lang'): string | null {
  try {
    return headers.get(headerName);
  } catch (error) {
    console.error('Error reading language from headers:', error);
    return null;
  }
}

/**
 * Format language display name
 */
export function formatLanguageDisplay(
  language: Language,
  options: {
    showFlag?: boolean;
    showNativeName?: boolean;
    showName?: boolean;
  } = {}
): string {
  const {
    showFlag = true,
    showNativeName = true,
    showName = false
  } = options;

  let display = '';
  
  if (showFlag && language.flag) {
    display += language.flag + ' ';
  }
  
  if (showNativeName) {
    display += language.nativeName;
  } else if (showName) {
    display += language.name;
  }
  
  return display.trim();
}