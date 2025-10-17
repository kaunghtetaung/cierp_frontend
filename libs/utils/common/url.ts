// URL utility functions with security validation
import { parse } from "tldts";

/**
 * Create URL with query parameters
 */
export function createUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean>
): string {
  const url = new URL(baseUrl, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (error) {
    console.error("Invalid URL:", error);
  }

  return params;
}

/**
 * Get current URL parameters
 */
export function getCurrentUrlParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return parseQueryParams(window.location.href);
}

/**
 * Remove query parameters from URL
 */
export function removeQueryParams(
  url: string,
  paramsToRemove: string[]
): string {
  try {
    const urlObj = new URL(url);

    paramsToRemove.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch (error) {
    console.error("Invalid URL:", error);
    return url;
  }
}

/**
 * Update query parameters in URL
 */
export function updateQueryParams(
  url: string,
  params: Record<string, string | number | boolean | null | undefined>
): string {
  try {
    const urlObj = new URL(url);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        urlObj.searchParams.delete(key);
      } else {
        urlObj.searchParams.set(key, String(value));
      }
    });

    return urlObj.toString();
  } catch (error) {
    console.error("Invalid URL:", error);
    return url;
  }
}

/**
 * Check if URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL is relative
 */
export function isRelativeUrl(url: string): boolean {
  return !isAbsoluteUrl(url);
}

/**
 * Check if URL is external (different origin)
 */
export function isExternalUrl(url: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Extract base domain from hostname (shared utility for client/server)
 * Examples:
 * - core.um1ygn.edu.mm -> um1ygn.edu.mm
 * - www.crystal-image.net -> crystal-image.net
 * - api.github.io -> github.io
 * - localhost -> localhost
 */
export function extractBaseDomain(hostname: string): string {
  // Remove port if present
  const cleanHost = hostname.split(":")[0];

  // For localhost and local IPs, return as-is
  if (
    cleanHost === "localhost" ||
    cleanHost.includes("127.0.0.") ||
    cleanHost.includes("127.0.0.1")
  ) {
    return cleanHost;
  }

  // Strip www. prefix if present
  const hostWithoutWww = cleanHost.replace(/^www\./, "");

  // Split by dots and take last 2-3 parts depending on TLD
  const parts = hostWithoutWww.split(".");
  if (parts.length <= 2) {
    return hostWithoutWww;
  }

  // Handle common TLDs: .edu.mm, .co.uk, etc.
  if (
    parts.length >= 3 &&
    (parts[parts.length - 2] === "edu" ||
      parts[parts.length - 2] === "co" ||
      parts[parts.length - 2] === "gov")
  ) {
    return parts.slice(-3).join(".");
  }

  // Default: take last 2 parts (domain.com)
  return parts.slice(-2).join(".");
}

/**
 * Get protocol from URL
 */
export function getProtocol(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol;
  } catch {
    return null;
  }
}

/**
 * Get pathname from URL
 */
export function getPathname(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return null;
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(url: string): string {
  // Remove javascript: and data: protocols
  if (
    url.toLowerCase().startsWith("javascript:") ||
    url.toLowerCase().startsWith("data:")
  ) {
    return "#";
  }

  // Only allow http, https, and relative URLs
  if (isAbsoluteUrl(url)) {
    const protocol = getProtocol(url);
    if (protocol && !["http:", "https:"].includes(protocol)) {
      return "#";
    }
  }

  return url;
}

/**
 * Create safe redirect URL
 */
export function createSafeRedirectUrl(
  url: string,
  fallback: string = "/"
): string {
  // Don't allow external redirects
  if (isExternalUrl(url)) {
    return fallback;
  }

  // Sanitize the URL
  const sanitized = sanitizeUrl(url);

  // Return fallback if sanitization failed
  if (sanitized === "#") {
    return fallback;
  }

  return sanitized;
}

/**
 * Join URL paths
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .map((path) => path.replace(/^\/+|\/+$/g, ""))
    .filter((path) => path.length > 0)
    .join("/");
}

/**
 * Build generic API URL with base configuration
 */
export function buildGenericApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
  const url = joinPaths(baseUrl, endpoint);

  if (params) {
    return createUrl(url, params);
  }

  return url;
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string | null {
  try {
    const pathname = getPathname(url);
    if (!pathname) return null;

    const lastDot = pathname.lastIndexOf(".");
    const lastSlash = pathname.lastIndexOf("/");

    if (lastDot > lastSlash && lastDot !== -1) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL points to an image
 */
export function isImageUrl(url: string): boolean {
  const extension = getFileExtension(url);
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "ico",
  ];
  return extension ? imageExtensions.includes(extension) : false;
}

/**
 * Check if URL points to a video
 */
export function isVideoUrl(url: string): boolean {
  const extension = getFileExtension(url);
  const videoExtensions = [
    "mp4",
    "webm",
    "ogg",
    "avi",
    "mov",
    "wmv",
    "flv",
    "mkv",
  ];
  return extension ? videoExtensions.includes(extension) : false;
}

/**
 * Check if URL points to an audio file
 */
export function isAudioUrl(url: string): boolean {
  const extension = getFileExtension(url);
  const audioExtensions = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "wma"];
  return extension ? audioExtensions.includes(extension) : false;
}

/**
 * Normalize URL (remove trailing slash, lowercase domain)
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Lowercase hostname
    urlObj.hostname = urlObj.hostname.toLowerCase();

    // Remove trailing slash from pathname (except for root)
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Get URL hash without the # symbol
 */
export function getUrlHash(url?: string): string {
  if (typeof window === "undefined") return "";

  const targetUrl = url || window.location.href;

  try {
    const urlObj = new URL(targetUrl);
    return urlObj.hash.substring(1);
  } catch {
    return "";
  }
}

/**
 * Configuration interface for API endpoint generation
 * Simplified for IP-based setup - ports no longer needed
 */
export interface ApiConfig {
  baseUrl?: string;
}

/**
 * Get API subdomain based on environment
 * Production: api
 * Development: api-dev (or custom from API_SUBDOMAIN env var)
 */
function getApiSubdomain(): string {
  // Check for environment variable
  const envSubdomain = process.env.API_SUBDOMAIN || process.env.NEXT_PUBLIC_API_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }

  // Default: use 'api' for production, 'api-dev' for development
  const isDev = isDevelopmentEnvironment();
  return isDev ? "api-dev" : "api";
}

/**
 * Get Auth subdomain based on environment
 * Production: auth
 * Development: auth-dev (or custom from AUTH_SUBDOMAIN env var)
 */
function getAuthSubdomain(): string {
  // Check for environment variable
  const envSubdomain = process.env.AUTH_SUBDOMAIN || process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }

  // Default: use 'auth' for production, 'auth-dev' for development
  const isDev = isDevelopmentEnvironment();
  return isDev ? "auth-dev" : "auth";
}

/**
 * Get WWW subdomain based on environment
 * Production: www
 * Development: www-dev (or custom from WWW_SUBDOMAIN env var)
 */
function getWwwSubdomain(): string {
  // Check for environment variable
  const envSubdomain = process.env.WWW_SUBDOMAIN || process.env.NEXT_PUBLIC_WWW_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }

  // Default: use 'www' for production, 'www-dev' for development
  const isDev = isDevelopmentEnvironment();
  return isDev ? "www-dev" : "www";
}

/**
 * Get API endpoint - simplified for IP-based setup
 * Used by middleware and other parts of the application
 */
export function getApiEndpoint(
  hostname: string,
  protocol: string,
  config: ApiConfig = {}
): {
  fullUrl: string;
  rootDomain: string;
} {
  const cleanHostname = hostname.split(":")[0];

  // Parse domain to get root domain
  const parsed = parse(cleanHostname);
  const rootDomain = parsed.domain || cleanHostname;

  // For localhost development, use environment API URL if available
  if (cleanHostname === 'localhost' || cleanHostname.includes('127.0.0.')) {
    if (config.baseUrl) {
      return { fullUrl: config.baseUrl, rootDomain };
    }

    if (process.env.API_BASE_URL) {
      return { fullUrl: process.env.API_BASE_URL, rootDomain };
    }
  }

  // For multi-tenant domains, build API URL matching client protocol
  // Use environment-based subdomain (api-dev for dev, api for prod)
  const cleanProtocol = protocol.endsWith(':') ? protocol.slice(0, -1) : protocol;
  const apiSubdomain = getApiSubdomain();
  const fullUrl = `${cleanProtocol}://${apiSubdomain}.${rootDomain}`;

  return { fullUrl, rootDomain };
}

/**
 * Build tenant API URL for domain resolution
 */
export function buildTenantApiUrl(
  hostname: string,
  protocol: string,
  config: ApiConfig = {}
): string {
  const { fullUrl } = getApiEndpoint(hostname, protocol, config);
  const cleanHostname = hostname.split(":")[0];
  return `${fullUrl}/tenant/initialize?host=${encodeURIComponent(
    cleanHostname
  )}`;
}

/**
 * Build auth API URL - simplified for IP-based setup
 * Uses environment-based subdomain (auth-dev for dev, auth for prod)
 */
export function buildAuthApiUrl(
  hostname: string,
  protocol: string,
  endpoint: string,
  config: ApiConfig = {}
): string {
  const cleanHostname = hostname.split(":")[0];
  const parsed = parse(cleanHostname);
  const rootDomain = parsed.domain || cleanHostname;

  // Get environment-based auth subdomain
  const authSubdomain = getAuthSubdomain();

  // With IP-based setup, auth runs on standard port 80
  return `${protocol}://${authSubdomain}.${rootDomain}${
    endpoint.startsWith("/") ? endpoint : "/" + endpoint
  }`;
}

/**
 * Consolidated domain utilities to eliminate duplications
 */

/**
 * Environment detection utility
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Get appropriate protocol based on headers or environment
 */
export function getAppropriateProtocol(forwardedProto?: string): string {
  if (forwardedProto) {
    return forwardedProto;
  }
  return isDevelopmentEnvironment() ? "http" : "https";
}

/**
 * Port handling utility - simplified for IP-based setup
 * With dedicated IPs (127.0.0.2, 127.0.0.3) on port 80, no port suffix needed
 */
export function getPortSuffix(
  port?: string,
  isProduction: boolean = !isDevelopmentEnvironment()
): string {
  // With IP-based setup on port 80, no port suffix needed
  return "";
}

/**
 * Consolidated public URL construction - simplified for IP-based setup
 * Uses environment-based WWW subdomain (www for prod, www-dev for dev)
 * Works for both client and server contexts
 */
export function buildPublicUrl(
  hostname: string,
  protocol: string,
  targetPort?: string
): string {
  const cleanHost = hostname.split(":")[0];
  const cleanProtocol = protocol.endsWith(":")
    ? protocol.slice(0, -1)
    : protocol;
  const baseDomain = extractBaseDomain(cleanHost);

  // Get environment-based WWW subdomain
  const wwwSubdomain = getWwwSubdomain();

  // Check if already has www or www-dev prefix
  const hasWwwPrefix = baseDomain.startsWith("www.") || baseDomain.startsWith("www-dev.");
  const publicHost = hasWwwPrefix ? baseDomain : `${wwwSubdomain}.${baseDomain}`;

  // With IP-based setup, no port handling needed
  return `${cleanProtocol}://${publicHost}`;
}

/**
 * Consolidated subdomain URL construction - simplified for IP-based setup
 */
export function buildSubdomainUrl(
  hostname: string,
  protocol: string,
  subdomain: string,
  port?: string
): string {
  const cleanHost = hostname.split(":")[0];
  const cleanProtocol = protocol.endsWith(":")
    ? protocol.slice(0, -1)
    : protocol;
  const baseDomain = extractBaseDomain(cleanHost);

  // With IP-based setup, no port handling needed
  return `${protocol}://${subdomain}.${baseDomain}`;
}
