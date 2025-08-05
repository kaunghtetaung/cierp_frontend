// Middleware utility functions - reusable across projects
import { MIDDLEWARE_HEADERS, MIDDLEWARE_COOKIES } from "../common/constants";
import { getSafeHeaders, getSafeCookies } from "./headers-compat";
import {
  isValidTenantId,
  hasTenantId,
  hasRequestId,
} from "../common/validation";

// ===================================
// SERVER COMPONENTS HELPERS (React Server Components - uses Next.js headers/cookies)
// ===================================

/**
 * Get tenant ID from request headers (for Server Components)
 */
export async function getTenantIdFromHeaders(): Promise<string | null> {
  try {
    const headerStore = await getSafeHeaders();
    return headerStore.get(MIDDLEWARE_HEADERS.TENANT_ID) || null;
  } catch (error) {
    console.error("Failed to get tenant ID from headers:", error);
    return null;
  }
}

/**
 * Get language from request headers (for Server Components)
 */
export async function getLanguageFromHeaders(): Promise<string> {
  try {
    const headerStore = await getSafeHeaders();
    return headerStore.get(MIDDLEWARE_HEADERS.LANGUAGE) || "en";
  } catch (error) {
    console.error("Failed to get language from headers:", error);
    return "en";
  }
}

/**
 * Get request ID from request headers (for Server Components)
 */
export async function getRequestIdFromHeaders(): Promise<string | null> {
  try {
    const headerStore = await getSafeHeaders();
    return headerStore.get(MIDDLEWARE_HEADERS.REQUEST_ID) || null;
  } catch (error) {
    console.error("Failed to get request ID from headers:", error);
    return null;
  }
}

/**
 * Get hostname from request headers (for Server Components)
 */
export async function getHostnameFromHeaders(): Promise<string | null> {
  try {
    const headerStore = await getSafeHeaders();
    return headerStore.get(MIDDLEWARE_HEADERS.HOSTNAME) || null;
  } catch (error) {
    console.error("Failed to get hostname from headers:", error);
    return null;
  }
}

/**
 * Get protocol from request headers (for Server Components)
 */
export async function getProtocolFromHeaders(): Promise<string> {
  try {
    const headerStore = await getSafeHeaders();
    return headerStore.get(MIDDLEWARE_HEADERS.PROTOCOL) || "https";
  } catch (error) {
    console.error("Failed to get protocol from headers:", error);
    return "https";
  }
}

/**
 * Get app ID from request headers (for Server Components)
 */
export async function getAppIdFromHeaders(): Promise<string | null> {
  try {
    const headerStore = await getSafeHeaders();
    return headerStore.get(MIDDLEWARE_HEADERS.APP_ID) || null;
  } catch (error) {
    console.error("Failed to get app ID from headers:", error);
    return null;
  }
}

/**
 * Get app ID from hostname with fallback to headers (for Server Components)
 */
export async function getAppIdFromHostname(): Promise<string> {
  try {
    // First try to get from hostname
    const hostname = await getHostnameFromHeaders();
    if (hostname) {
      // Use app-config utilities for hostname detection
      const { getAppFromHostname } = await import('@repo/app-config');
      const appId = getAppFromHostname(hostname);
      if (appId) {
        return appId;
      }
    }

    // Fallback to header
    const appIdFromHeader = await getAppIdFromHeaders();
    if (appIdFromHeader) {
      return appIdFromHeader;
    }

    // Final fallback to 'core'
    return 'core';
  } catch (error) {
    console.error("Failed to get app ID from hostname:", error);
    return 'core';
  }
}

/**
 * Get all middleware values from headers (for Server Components)
 */
export async function getMiddlewareDataFromHeaders(): Promise<{
  tenantId: string | null;
  language: string;
  requestId: string | null;
  hostname: string | null;
  protocol: string;
  appId: string;
  appConfig?: any;
}> {
  try {
    const headerStore = await getSafeHeaders();
    
    // Get basic middleware data
    const tenantId = headerStore.get(MIDDLEWARE_HEADERS.TENANT_ID) || null;
    const language = headerStore.get(MIDDLEWARE_HEADERS.LANGUAGE) || "en";
    const requestId = headerStore.get(MIDDLEWARE_HEADERS.REQUEST_ID) || null;
    const hostname = headerStore.get(MIDDLEWARE_HEADERS.HOSTNAME) || null;
    const protocol = headerStore.get(MIDDLEWARE_HEADERS.PROTOCOL) || "https";
    
    // Get app ID from header first, fallback to hostname
    const appIdFromHeader = headerStore.get(MIDDLEWARE_HEADERS.APP_ID);
    const appId = appIdFromHeader || await getAppIdFromHostname();
    
    // Get app configuration
    let appConfig;
    try {
      const { getAppConfig } = await import('@repo/app-config');
      appConfig = getAppConfig(appId);
    } catch (error) {
      console.error("Failed to load app config:", error);
    }

    return {
      tenantId,
      language,
      requestId,
      hostname,
      protocol,
      appId,
      appConfig,
    };
  } catch (error) {
    console.error("Failed to get middleware data from headers:", error);
    return {
      tenantId: null,
      language: "en",
      requestId: null,
      hostname: null,
      protocol: "https",
      appId: "core",
    };
  }
}

/**
 * Get tenant ID from cookies (for Server Components when headers are not available)
 */
export async function getTenantIdFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await getSafeCookies();
    return cookieStore.get(MIDDLEWARE_COOKIES.TENANT_ID)?.value || null;
  } catch (error) {
    console.error("Failed to get tenant ID from cookies:", error);
    return null;
  }
}

/**
 * Get language from cookies (for Server Components when headers are not available)
 */
export async function getLanguageFromCookies(): Promise<string> {
  try {
    const cookieStore = await getSafeCookies();
    return cookieStore.get(MIDDLEWARE_COOKIES.LANGUAGE)?.value || "en";
  } catch (error) {
    console.error("Failed to get language from cookies:", error);
    return "en";
  }
}

/**
 * Get request ID from cookies (for Server Components when headers are not available)
 */
export async function getRequestIdFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await getSafeCookies();
    return cookieStore.get(MIDDLEWARE_COOKIES.REQUEST_ID)?.value || null;
  } catch (error) {
    console.error("Failed to get request ID from cookies:", error);
    return null;
  }
}

/**
 * Get all middleware values from cookies (for Server Components when headers are not available)
 */
export async function getMiddlewareDataFromCookies(): Promise<{
  tenantId: string | null;
  language: string;
  requestId: string | null;
}> {
  try {
    const cookieStore = await getSafeCookies();

    return {
      tenantId: cookieStore.get(MIDDLEWARE_COOKIES.TENANT_ID)?.value || null,
      language: cookieStore.get(MIDDLEWARE_COOKIES.LANGUAGE)?.value || "en",
      requestId: cookieStore.get(MIDDLEWARE_COOKIES.REQUEST_ID)?.value || null,
    };
  } catch (error) {
    console.error("Failed to get middleware data from cookies:", error);
    return {
      tenantId: null,
      language: "en",
      requestId: null,
    };
  }
}

// ===================================
// CLIENT COMPONENTS HELPERS (Browser environment)
// ===================================

/**
 * Client-side helpers (for use in Client Components)
 */
export const clientHelpers = {
  /**
   * Get tenant ID from document cookies (Client Components only)
   */
  getTenantIdFromBrowser(): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    const tenantCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${MIDDLEWARE_COOKIES.TENANT_ID}=`)
    );

    return tenantCookie ? decodeURIComponent(tenantCookie.split("=")[1]) : null;
  },

  /**
   * Get language from document cookies (Client Components only)
   */
  getLanguageFromBrowser(): string {
    if (typeof document === "undefined") return "en";

    const cookies = document.cookie.split(";");
    const langCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${MIDDLEWARE_COOKIES.LANGUAGE}=`)
    );

    return langCookie ? decodeURIComponent(langCookie.split("=")[1]) : "en";
  },

  /**
   * Get request ID from document cookies (Client Components only)
   */
  getRequestIdFromBrowser(): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    const requestIdCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${MIDDLEWARE_COOKIES.REQUEST_ID}=`)
    );

    return requestIdCookie
      ? decodeURIComponent(requestIdCookie.split("=")[1])
      : null;
  },

  /**
   * Get app ID from document cookies (Client Components only)
   */
  getAppIdFromBrowser(): string {
    if (typeof document === "undefined") return "core";

    const cookies = document.cookie.split(";");
    const appCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${MIDDLEWARE_COOKIES.APP_ID}=`)
    );

    return appCookie ? decodeURIComponent(appCookie.split("=")[1]) : "core";
  },

  /**
   * Get app ID from hostname (Client Components only)
   */
  getAppIdFromHostname(): string {
    if (typeof window === "undefined") return "core";
    
    try {
      // Note: This would require the app-config to be available client-side
      // For now, return from cookie or try basic hostname parsing
      const hostname = window.location.hostname;
      
      // Basic subdomain extraction for crystal-image.net domains
      if (hostname.includes('.crystal-image.net')) {
        const subdomain = hostname.split('.crystal-image.net')[0];
        // Validate against known apps
        const knownApps = ['core', 'library', 'school', 'content'];
        if (knownApps.includes(subdomain)) {
          return subdomain;
        }
      }
      
      // Fallback to cookie
      return this.getAppIdFromBrowser();
    } catch (error) {
      console.error("Failed to get app ID from hostname:", error);
      return this.getAppIdFromBrowser();
    }
  },

  /**
   * Get all middleware data from browser cookies (Client Components only)
   */
  getMiddlewareDataFromBrowser(): {
    tenantId: string | null;
    language: string;
    requestId: string | null;
    appId: string;
  } {
    return {
      tenantId: this.getTenantIdFromBrowser(),
      language: this.getLanguageFromBrowser(),
      requestId: this.getRequestIdFromBrowser(),
      appId: this.getAppIdFromHostname(),
    };
  },
};

// ===================================
// VALIDATION AND REQUIREMENT HELPERS (Shared)
// ===================================

/**
 * Require tenant ID - throws error if not found
 */
export async function requireTenantId(): Promise<string> {
  const tenantId = await getTenantIdFromHeaders();

  if (!tenantId) {
    throw new Error("Tenant ID is required but not found in request headers");
  }

  if (!isValidTenantId(tenantId)) {
    throw new Error("Invalid tenant ID format");
  }

  return tenantId;
}

/**
 * Require request ID - throws error if not found
 */
export async function requireRequestId(): Promise<string> {
  const requestId = await getRequestIdFromHeaders();

  if (!requestId) {
    throw new Error("Request ID is required but not found in request headers");
  }

  return requestId;
}

// Re-export validation functions for convenience
export {
  isValidTenantId,
  isValidLanguageCode,
  hasTenantId,
  hasRequestId,
} from "../common/validation";

// Re-export constants for convenience
export {
  MIDDLEWARE_HEADERS,
  MIDDLEWARE_COOKIES,
  COOKIE_NAMES,
} from "../common/constants";
