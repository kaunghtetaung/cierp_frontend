// Header Builder Strategy - Single Responsibility: HTTP header construction
import { getCookie } from "@repo/security/cookies";
import { COOKIE_NAMES, MIDDLEWARE_HEADERS } from "@repo/utils/common/constants";
// Using direct require to avoid circular dependency in imports
import { getLanguageFromCookie } from "@repo/language/utils";
import { getValidTenantId } from '../utils/tenant-resolver';
import type { HeaderBuilder, HttpClientConfig } from '../types/http-types';
import { HTTP_CONSTANTS } from '../types/http-types';
import type { HttpMethod, ApiRequestConfig } from "@repo/types";

// Direct token retrieval to avoid circular dependency
async function getTokenForRequest(
  tenantId?: string,
  userId?: string,
  tokenStrategy: 'auto' | 'force-refresh' = 'auto'
): Promise<string | null> {
  try {
    // Try to get token from the simplified auth core functions
    const { getTokenForRequest: coreGetToken } = require("../../auth/core/tokens");
    return await coreGetToken(tenantId, userId, tokenStrategy);
  } catch (error) {
    console.warn('Failed to get token from core/tokens, falling back to TokenManager:', error);

    try {
      // Fallback to TokenManager if core functions fail
      const { TokenManager } = require("../../auth/managers/token-manager");
      const tokenManager = TokenManager.getInstance();
      return await tokenManager.getTokenForRequest(tenantId, userId);
    } catch (managerError) {
      console.error('Failed to get token from TokenManager as well:', managerError);
      return null;
    }
  }
}

/**
 * Extract roles (access context) from JWT token
 * Returns the roles array that backend expects in x-access-context header
 */
function extractRolesFromJWT(token: string): any[] {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return [];

    let base64Payload = parts[1];
    base64Payload = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Payload.length % 4) {
      base64Payload += "=";
    }

    const payload = JSON.parse(atob(base64Payload));

    // Extract roles array from JWT - this contains {Organization, Department, Role} objects
    const roles = payload.roles || [];
    return Array.isArray(roles) ? roles : [];
  } catch (error) {
    console.warn('Failed to extract roles from JWT:', error);
    return [];
  }
}

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
      userId,
      withAuth = this.config.enableAuth
    } = config;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };

    // Add user ID header if provided
    if (userId) {
      headers['x-user-id'] = userId;
    }

    // CRITICAL: Always resolve and add tenant ID header for API gateway
    const resolvedTenantId = await getValidTenantId(tenantId);
    if (resolvedTenantId) {
      headers[MIDDLEWARE_HEADERS.TENANT_ID] = resolvedTenantId;
      console.log('✅ [HEADER BUILDER] Added x-tenant-id header:', resolvedTenantId);
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
      const tokenStrategy = config.tokenStrategy || 'auto';
      // Use resolvedTenantId (not tenantId) to ensure token lookup works even when tenantId is not explicitly passed
      const token = await this.getAuthToken(resolvedTenantId || undefined, config.userId, tokenStrategy);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;

        // Extract roles from JWT and set x-access-context header
        // Backend expects JSON array of {Organization, Department, Role} objects
        let roles = extractRolesFromJWT(token);

        // If no roles found in the auth token (e.g., client credentials token),
        // try to get roles from the user's stored JWT token directly
        if (roles.length === 0 && resolvedTenantId && config.userId) {
          console.log('🔍 [HEADER BUILDER] Auth token has no roles, fetching user token for access context...');
          const userRoles = await this.getUserRolesFromCache(resolvedTenantId, config.userId);
          if (userRoles.length > 0) {
            roles = userRoles;
            console.log('✅ [HEADER BUILDER] Got user roles from cached user token');
          }
        }

        if (roles.length > 0) {
          headers['x-access-context'] = JSON.stringify(roles);
          console.log('✅ [HEADER BUILDER] Added x-access-context header with', roles.length, 'role(s)');
        } else {
          console.warn('⚠️ [HEADER BUILDER] No roles found for x-access-context header');
        }
      }
    }

    return headers;
  }

  /**
   * Get authentication token using simplified auth functions (server-side only)
   */
  private async getAuthToken(
    tenantId?: string,
    userId?: string,
    tokenStrategy: 'auto' | 'force-refresh' = 'auto'
  ): Promise<string | null> {
    if (!this.config.enableAuth) {
      return null;
    }

    try {
      // Get appropriate token using simplified function
      // All tokens are managed server-side with Redis caching
      const token = await getTokenForRequest(
        tenantId,
        userId,
        tokenStrategy
      );
      return token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }

  /**
   * Get user roles from cached user token
   * This is used when the auth token (e.g., tenant token) doesn't contain user roles
   */
  private async getUserRolesFromCache(tenantId: string, userId: string): Promise<any[]> {
    try {
      // Try to get user access token data directly from cache
      const { CacheKeys, getCacheInstance } = require("@repo/cache");
      const cache = getCacheInstance();
      const key = CacheKeys.userAccessToken(tenantId, userId);

      const token = await cache.get<string>(key);
      if (token && typeof token === 'string') {
        const roles = extractRolesFromJWT(token);
        return roles;
      }

      return [];
    } catch (error) {
      console.warn('Failed to get user roles from cache:', error);
      return [];
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