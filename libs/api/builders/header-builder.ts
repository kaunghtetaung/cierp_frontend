// Header Builder Strategy - Single Responsibility: HTTP header construction
import { getCookie } from "@repo/security/cookies";
import { COOKIE_NAMES, MIDDLEWARE_HEADERS } from "@repo/utils/common/constants";
import { getTokenForRequest } from "@repo/auth/core";
import { getLanguageFromCookie } from "@repo/language/utils";
import { getValidTenantId } from '../utils/tenant-resolver';
import type { HeaderBuilder, HttpClientConfig } from '../types/http-types';
import { HTTP_CONSTANTS } from '../types/http-types';
import type { HttpMethod, ApiRequestConfig } from "@repo/types";

export class StandardHeaderBuilder implements HeaderBuilder {
  private csrfToken: string | null = null;

  constructor(private config: HttpClientConfig) {
    this.initializeCSRFToken();
  }

  private initializeCSRFToken(): void {
    // Only initialize CSRF token from cookies (server-side rendering safe)
    if (typeof window !== "undefined") {
      this.csrfToken = getCookie(COOKIE_NAMES.CSRF_TOKEN) || null;
    }
  }

  async buildHeaders(
    method: HttpMethod,
    customHeaders: Record<string, string>,
    config: ApiRequestConfig
  ): Promise<Record<string, string>> {
    const {
      tenantId,
      userSessionId,
      withAuth = this.config.enableAuth
    } = config;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };

    // CRITICAL: Always resolve and add tenant ID header for API gateway
    const resolvedTenantId = await getValidTenantId(tenantId);
    if (resolvedTenantId) {
      headers[MIDDLEWARE_HEADERS.TENANT_ID] = resolvedTenantId;
    } else {
      console.error('CRITICAL: No valid tenant ID resolved for API request - request may fail');
      // Still proceed but log the issue for debugging
    }

    // Add language header (x-lang) - required by API gateway
    const languageCode = await this.getLanguageCode(config);
    if (languageCode) {
      headers[MIDDLEWARE_HEADERS.LANGUAGE] = languageCode;
    }

    // Add CSRF token for unsafe methods
    if (
      this.config.enableCSRF &&
      (HTTP_CONSTANTS.UNSAFE_HTTP_METHODS as readonly string[]).includes(method)
    ) {
      await this.ensureCSRFToken();
      if (this.csrfToken) {
        headers["X-CSRF-Token"] = this.csrfToken;
      }
    }

    // Add auth token using TokenManager (server-side only)
    if (withAuth) {
      const token = await this.getAuthToken(tenantId, config.userId);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Get authentication token using simplified auth functions (server-side only)
   */
  private async getAuthToken(tenantId?: string, userId?: string): Promise<string | null> {
    if (!this.config.enableAuth) {
      return null;
    }

    try {
      // Get appropriate token using simplified function
      // All tokens are managed server-side with Redis caching
      const token = await getTokenForRequest(
        tenantId,
        userId
      );
      return token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }

  /**
   * Ensure CSRF token is available
   */
  private async ensureCSRFToken(): Promise<void> {
    if (this.csrfToken) return;

    try {
      // Get CSRF token from API
      const response = await fetch(`${this.config.baseURL}/csrf-token`, {
        credentials: this.config.withCredentials ? "include" : "omit",
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.token;
      }
    } catch (error) {
      console.warn("Failed to get CSRF token:", error);
    }
  }

  /**
   * Update CSRF token
   */
  setCSRFToken(token: string | null): void {
    this.csrfToken = token;
  }

  /**
   * Clear CSRF token
   */
  clearCSRFToken(): void {
    this.csrfToken = null;
  }

  /**
   * Get language code from multiple sources with server-side priority
   * Priority: config.language > Next.js server headers > cookie > URL > browser language > default 'en'
   */
  private async getLanguageCode(config: ApiRequestConfig): Promise<string> {
    // First check if language is explicitly provided in config
    if (config.language) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 HeaderBuilder: Using explicit language from config: ${config.language}`);
      }
      return config.language;
    }

    // Server-side language detection from Next.js headers (most reliable)
    if (typeof window === "undefined") {
      try {
        // Dynamic import to avoid issues in client-side code
        const { headers } = await import('next/headers');
        const headerStore = await headers();
        
        if (!headerStore) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🖥️ HeaderBuilder: Header store is null/undefined, might not be in server component context`);
          }
        } else {
          const serverLang = headerStore.get('x-lang');
          
          if (serverLang && (serverLang === 'en' || serverLang === 'mm')) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`🖥️ HeaderBuilder: Using server-side x-lang header: ${serverLang}`);
            }
            return serverLang;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🖥️ HeaderBuilder: Server-side x-lang header not found or invalid: ${serverLang}`);
          }
        }
      } catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
          if (process.env.NODE_ENV === 'development') {
            if (error.message.includes('only be called in Server Components')) {
              console.log(`🖥️ HeaderBuilder: Not in Server Component context, using client-side fallbacks`);
            } else if (error.message.includes('Cannot find module')) {
              console.log(`🖥️ HeaderBuilder: next/headers module not available, using client-side fallbacks`);
            } else {
              console.log(`🖥️ HeaderBuilder: Server header access failed: ${error.message}`);
            }
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🖥️ HeaderBuilder: Unknown error accessing server headers:`, error);
          }
        }
        // Continue to client-side fallbacks
      }
    }

    // Client-side language detection
    if (typeof window !== "undefined") {
      // Try cookie first
      const cookieLanguage = getLanguageFromCookie(COOKIE_NAMES.LANGUAGE);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🍪 HeaderBuilder: Language from cookie: ${cookieLanguage}`);
        console.log(`🍪 HeaderBuilder: All cookies:`, document.cookie);
      }
      if (cookieLanguage) {
        return cookieLanguage;
      }

      // Try to get from URL path (e.g., /mm/page or /en/page)
      const pathLang = window.location.pathname.split('/')[1];
      if (pathLang && (pathLang === 'en' || pathLang === 'mm')) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔗 HeaderBuilder: Language from URL path: ${pathLang}`);
        }
        return pathLang;
      }

      // Try browser language as fallback
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('my') || browserLang.includes('mm')) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🌍 HeaderBuilder: Detected Myanmar from browser: ${browserLang}`);
        }
        return 'mm';
      }
    }

    // Default to English
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 HeaderBuilder: Falling back to default language: 'en'`);
    }
    return 'en';
  }
}