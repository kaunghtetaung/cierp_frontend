// Language service implementation
// Core service for language management across projects

import { 
  LanguageServiceInterface, 
  LanguageServiceConfig, 
  LanguageChangeRequest, 
  LanguageChangeResponse, 
  LanguageGetResponse,
  Language 
} from './types';
import { 
  getLanguageFromCookie, 
  setLanguageInCookie, 
  getBrowserLanguage, 
  isValidLanguageCode,
  getDefaultLanguage 
} from './utils';
import { createLanguageConfig } from './config';

export class LanguageService implements LanguageServiceInterface {
  private config: LanguageServiceConfig;

  constructor(config: Partial<LanguageServiceConfig> = {}) {
    this.config = createLanguageConfig(config);
  }

  /**
   * Change language via API call
   */
  async changeLanguage(languageCode: string): Promise<LanguageChangeResponse> {
    // Validate language code
    if (!this.isValidLanguage(languageCode)) {
      return {
        success: false,
        language: languageCode,
        error: `Invalid language code: ${languageCode}. Supported languages: ${this.getSupportedLanguages().map(l => l.code).join(', ')}`
      };
    }

    try {
      const request: LanguageChangeRequest = { language: languageCode };
      
      const response = await fetch(this.config.apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'same-origin' // Include cookies
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: LanguageChangeResponse = await response.json();
      
      if (data.success) {
        // Update local cookie as backup
        this.setStoredLanguage(languageCode);
        
        // Update document language
        if (typeof document !== 'undefined') {
          document.documentElement.lang = languageCode;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Language change API error:', error);
      return {
        success: false,
        language: languageCode,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get current language from API
   */
  async getCurrentLanguage(): Promise<LanguageGetResponse> {
    try {
      const response = await fetch(this.config.apiEndpoint!, {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: LanguageGetResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get language API error:', error);
      
      // Fallback to stored or default language
      const fallbackLanguage = this.getStoredLanguage() || this.config.defaultLanguage!;
      
      return {
        success: false,
        language: fallbackLanguage,
        supportedLanguages: this.getSupportedLanguages().map(l => l.code),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get stored language from cookie
   */
  getStoredLanguage(): string | null {
    return getLanguageFromCookie(this.config.cookieName);
  }

  /**
   * Store language in cookie
   */
  setStoredLanguage(languageCode: string): void {
    if (!this.isValidLanguage(languageCode)) {
      console.warn(`Attempting to store invalid language code: ${languageCode}`);
      return;
    }

    setLanguageInCookie(
      languageCode, 
      this.config.cookieName,
      this.config.cookieOptions
    );
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): Language[] {
    return this.config.supportedLanguages || [];
  }

  /**
   * Check if language code is valid/supported
   */
  isValidLanguage(languageCode: string): boolean {
    return isValidLanguageCode(languageCode, this.getSupportedLanguages());
  }

  /**
   * Get browser preferred language
   */
  getBrowserLanguage(): string {
    return getBrowserLanguage(this.getSupportedLanguages());
  }

  /**
   * Get best language choice based on priority
   * Priority: stored -> browser -> default
   */
  getBestLanguage(): string {
    // Try stored language first
    const stored = this.getStoredLanguage();
    if (stored && this.isValidLanguage(stored)) {
      return stored;
    }

    // Try browser language
    const browser = this.getBrowserLanguage();
    if (this.isValidLanguage(browser)) {
      return browser;
    }

    // Fall back to default
    return this.config.defaultLanguage!;
  }

  /**
   * Initialize language (useful for app startup)
   */
  async initializeLanguage(preferredLanguage?: string): Promise<string> {
    let targetLanguage = preferredLanguage;

    // If no preferred language provided, determine best choice
    if (!targetLanguage) {
      targetLanguage = this.getBestLanguage();
    }

    // Validate the target language
    if (!this.isValidLanguage(targetLanguage)) {
      console.warn(`Invalid target language: ${targetLanguage}, falling back to default`);
      targetLanguage = this.config.defaultLanguage!;
    }

    // Set language if not already set
    const currentStored = this.getStoredLanguage();
    if (currentStored !== targetLanguage) {
      this.setStoredLanguage(targetLanguage);
    }

    // Update document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = targetLanguage;
    }

    return targetLanguage;
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<LanguageServiceConfig>): void {
    this.config = createLanguageConfig({ ...this.config, ...newConfig });
  }

  /**
   * Get current service configuration
   */
  getConfig(): LanguageServiceConfig {
    return { ...this.config };
  }
}

// Export singleton instance for convenience
export const languageService = new LanguageService();