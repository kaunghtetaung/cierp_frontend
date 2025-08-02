// libs/tenant/middleware/cookies.ts
import { NextRequest } from "next/server";
import { parse } from "tldts";
import { MiddlewareConfig } from "./types";

/**
 * Get tenant ID from NextRequest cookies (Edge Runtime)
 */
export function getTenantIdFromRequest(
  request: NextRequest,
  config: MiddlewareConfig
): string | null {
  const cookieName = config.headers.tenantHeader || "x-tenant-id";
  return request.cookies.get(cookieName)?.value || null;
}

/**
 * Get language from NextRequest cookies (Edge Runtime)
 * Returns the language from cookie if it exists, otherwise returns null
 * to indicate no valid language cookie was found
 */
export function getLanguageFromRequest(
  request: NextRequest,
  config: MiddlewareConfig
): string | null {
  const cookieName = config.headers.langHeader || "x-lang";
  return request.cookies.get(cookieName)?.value || null;
}

/**
 * Get root domain for cookie sharing across subdomains
 */
function getRootDomain(hostname: string): string {
  const cleanHostname = hostname.split(":")[0]; // Remove port
  
  // Handle crystal-image.net domains specifically
  if (cleanHostname.includes('.crystal-image.net')) {
    return '.crystal-image.net';
  }
  
  // Use tldts for other domains
  const parsed = parse(cleanHostname);
  if (parsed.domain) {
    return `.${parsed.domain}`;
  }
  
  // Fallback for localhost and other development domains
  if (cleanHostname.includes('localhost') || cleanHostname.includes('127.0.0.1')) {
    return cleanHostname; // Don't use dot prefix for localhost
  }
  
  return cleanHostname;
}

/**
 * Create tenant cookie
 */
export function createTenantCookie(
  tenantId: string,
  hostname: string,
  config: MiddlewareConfig
): string {
  const rootDomain = getRootDomain(hostname);

  const cookieName = config.headers.tenantHeader || "x-tenant-id";
  const maxAge = config.cookies.maxAge || 24 * 60 * 60;
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const secure = config.cookies.secure ? "Secure; " : "";
  const sameSite = config.cookies.sameSite || "lax";

  // Only set Domain if it's not localhost
  const domainPart = hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? '' 
    : `Domain=${rootDomain}; `;

  return `${cookieName}=${tenantId}; ${domainPart}Path=/; Expires=${expires}; HttpOnly; ${secure}SameSite=${sameSite}`;
}

/**
 * Create language cookie (shared across root domain)
 */
export function createLanguageCookie(
  language: string,
  hostname: string,
  config: MiddlewareConfig
): string {
  const rootDomain = getRootDomain(hostname);

  const cookieName = config.headers.langHeader || "x-lang";
  const maxAge = config.cookies.maxAge || 24 * 60 * 60;
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const secure = config.cookies.secure ? "Secure; " : "";
  const sameSite = config.cookies.sameSite || "lax";

  // x-lang should be shared across all subdomains at root domain level
  // Only set Domain if it's not localhost
  const domainPart = hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? '' 
    : `Domain=${rootDomain}; `;

  return `${cookieName}=${language}; ${domainPart}Path=/; Expires=${expires}; ${secure}SameSite=${sameSite}`;
}

/**
 * Create app ID cookie (subdomain-specific, not shared across root domain)
 */
export function createAppCookie(
  appId: string,
  hostname: string,
  config: MiddlewareConfig
): string {
  const cookieName = "x-app-id";
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const secure = config.cookies.secure ? "Secure; " : "";
  const sameSite = config.cookies.sameSite || "lax";

  // x-app-id should NOT be shared across subdomains - no Domain attribute
  // This keeps it specific to the current subdomain (e.g., core.crystal-image.net)
  return `${cookieName}=${appId}; Path=/; Expires=${expires}; ${secure}SameSite=${sameSite}`;
}
