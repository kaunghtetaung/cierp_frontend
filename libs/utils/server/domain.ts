// Server-side domain helper utilities
import { cache } from "react";
import { configClient } from "@repo/config";
import {
  buildSubdomainUrl,
  buildPublicUrl,
  extractBaseDomain,
  getAppropriateProtocol,
  isDevelopmentEnvironment
} from '../common/url';
import { getSafeHeaders } from './headers-compat';

/**
 * Get API subdomain from config service
 * Production: api
 * Development: api-dev (or custom from config service/API_SUBDOMAIN env var)
 */
async function getApiSubdomain(): Promise<string> {
  const subdomain = await configClient.get('api.subdomain', process.env.API_SUBDOMAIN);
  if (subdomain) {
    return subdomain;
  }

  // Default: use 'api' for production, 'api-dev' for development
  const isDev = isDevelopmentEnvironment();
  return isDev ? "api-dev" : "api";
}

/**
 * Get Auth subdomain from config service
 * Production: auth
 * Development: auth-dev (or custom from config service/AUTH_SUBDOMAIN env var)
 */
async function getAuthSubdomain(): Promise<string> {
  const subdomain = await configClient.get('api.authSubdomain', process.env.AUTH_SUBDOMAIN);
  if (subdomain) {
    return subdomain;
  }

  // Default: use 'auth' for production, 'auth-dev' for development
  const isDev = isDevelopmentEnvironment();
  return isDev ? "auth-dev" : "auth";
}

/**
 * Get domain URL with subdomain - simplified for standard port 80
 */
async function getDomainUrl(subdomain: string): Promise<string> {
  const headersList = await getSafeHeaders();
  const clientHost = headersList.get("host") || "localhost";
  const protocol = getAppropriateProtocol(headersList.get("x-forwarded-proto") || undefined);

  return buildSubdomainUrl(clientHost, protocol, subdomain);
}

/**
 * Get API domain URL (api-dev.tenant.com or api.tenant.com) - standard port 80
 * Uses config service for subdomain with fallback to environment
 * Cached with React.cache for request-level deduplication
 */
export const getApiDomain = cache(async function (): Promise<string> {
  const apiSubdomain = await getApiSubdomain();
  const url = await getDomainUrl(apiSubdomain);
  console.log("🔗 === GET API DOMAIN ===");
  console.log("🔗 API Subdomain:", apiSubdomain);
  console.log("🔗 API Domain URL:", url);
  console.log("🔗 === END GET API DOMAIN ===\n");
  return url;
});

/**
 * Get Auth domain URL (auth-dev.tenant.com or auth.tenant.com) - standard port 80
 * Uses config service for subdomain with fallback to environment
 * Cached with React.cache for request-level deduplication
 */
export const getAuthDomain = cache(async function (): Promise<string> {
  const authSubdomain = await getAuthSubdomain();
  return await getDomainUrl(authSubdomain);
});

/**
 * Get current hostname from headers
 */
export async function getCurrentHostname(): Promise<string> {
  const headersList = await getSafeHeaders();
  return headersList.get("host") || "localhost";
}

/**
 * Get tenant ID from headers (direct header access)
 */
export async function getTenantIdFromRequestHeaders(): Promise<string | null> {
  const headersList = await getSafeHeaders();
  return headersList.get("x-tenant-id");
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return isDevelopmentEnvironment();
}

/**
 * Get protocol from headers or environment
 */
export async function getProtocol(): Promise<string> {
  const headersList = await getSafeHeaders();
  return getAppropriateProtocol(headersList.get("x-forwarded-proto") || undefined);
}

/**
 * Get public URL with www prefix (without path)
 * Examples:
 * - crystal-image.net -> https://www.crystal-image.net
 * - www.crystal-image.net -> https://www.crystal-image.net
 * - localhost -> http://www.localhost
 */
export async function getPublicUrl(): Promise<string> {
  const hostname = await getCurrentHostname();
  const protocol = await getProtocol();

  return buildPublicUrl(hostname, protocol);
}

/**
 * Get the base domain from request headers (server-side)
 * Examples:
 * - www.crystal-image.net -> crystal-image.net
 * - sub.example.com -> example.com
 */
export async function getBaseDomainFromHeaders(): Promise<string | null> {
  try {
    const hostname = await getCurrentHostname();
    return extractBaseDomain(hostname);
  } catch (error) {
    console.error("Failed to get base domain from headers:", error);
    return null;
  }
}


/**
 * Check if current request is from a subdomain
 */
export async function isSubdomain(): Promise<boolean> {
  try {
    const hostname = await getCurrentHostname();
    const host = hostname.split(":")[0];
    const parts = host.split(".");

    // More than 2 parts means subdomain (unless it's www)
    return parts.length > 2 && parts[0] !== "www";
  } catch (error) {
    console.error("Failed to check subdomain status:", error);
    return false;
  }
}

/**
 * Get root domain for cookie setting in API routes
 * Returns the domain string to use for root-level cookies
 */
export async function getRootDomainForCookie(): Promise<string | undefined> {
  try {
    const hostname = await getCurrentHostname();
    const host = hostname.split(":")[0];
    
    // For localhost and local IPs, don't use domain attribute
    if (host === "localhost" || host.includes("127.0.0.") || host.includes("127.0.0.1")) {
      return undefined;
    }
    
    // Use shared utility for consistent domain extraction
    const baseDomain = extractBaseDomain(host);
    return `.${baseDomain}`;
  } catch (error) {
    console.error("Failed to get root domain for cookie:", error);
    return undefined;
  }
}
