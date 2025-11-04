/**
 * Tenant Resolver
 * Extracts tenant information from request headers and validates JWT access
 */

import { NextRequest } from 'next/server';

export interface TenantInfo {
  tenantId: string;           // MongoDB ID from x-tenant-id header
  tenantSlug: string;         // Tenant slug for bucket naming (validated from JWT)
  tenantRootDomain: string;   // Extracted from host header (e.g., "um1ygn.edu.mm")
}

export interface JWTRole {
  Organization: string;
  OrgSlug: string;
  Department: string;
  DeptSlug: string;
  Role: string;
}

export interface JWTPayload {
  sub: string;
  roles: JWTRole[];
  [key: string]: any;
}

/**
 * Parse JWT token string
 */
function parseJWTString(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    // Decode JWT payload (base64url)
    let base64Payload = parts[1];
    base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }

    const payload = JSON.parse(atob(base64Payload));
    return payload as JWTPayload;
  } catch (error) {
    console.error('[TenantResolver] Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Get user's JWT token from session
 * Server-side only: Gets token from cache using session cookie
 */
async function getUserJWTFromSession(request: NextRequest, tenantId: string): Promise<string | null> {
  try {
    // Get session ID from cookie
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session-id');

    if (!sessionCookie) {
      console.error('[TenantResolver] No session cookie found');
      return null;
    }

    // Get session from cache to find userId
    const { getSession } = await import('@repo/auth/core/sessions');
    const session = await getSession(sessionCookie.value);

    if (!session) {
      console.error('[TenantResolver] Session not found');
      return null;
    }

    // Get user's access token (ID token/JWT) from cache
    const { getUserAccessToken } = await import('@repo/auth/core/tokens');
    const token = await getUserAccessToken(tenantId, session.userId);

    return token;
  } catch (error) {
    console.error('[TenantResolver] Failed to get JWT from session:', error);
    return null;
  }
}

/**
 * Get tenant slug from tenant settings cache
 * This should be fetched from Redis cache where tenant settings are stored
 */
async function getTenantSlugFromCache(tenantId: string): Promise<string | null> {
  try {
    // Import cache utilities
    const { getCacheInstance, CacheKeys } = await import('@repo/cache');
    const cache = getCacheInstance();

    // Get tenant settings from cache
    const tenantSettings = await cache.get(CacheKeys.tenantSettings(tenantId));

    if (tenantSettings && typeof tenantSettings === 'object' && 'slug' in tenantSettings) {
      return (tenantSettings as any).slug;
    }

    return null;
  } catch (error) {
    console.error('[TenantResolver] Failed to get tenant slug from cache:', error);
    return null;
  }
}

/**
 * Extract tenant information from request headers and validate JWT access
 *
 * @param request - Next.js request object
 * @returns TenantInfo object
 * @throws Error if tenant headers are missing or user doesn't have access
 */
export async function resolveTenantFromHeaders(request: NextRequest): Promise<TenantInfo> {
  // Get tenant ID from header (MongoDB ID)
  const tenantId = request.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new Error('Missing x-tenant-id header');
  }

  // Validate MongoDB ObjectID format (24 hex characters)
  if (!/^[a-f\d]{24}$/i.test(tenantId)) {
    throw new Error('Invalid tenant ID format (expected MongoDB ObjectID)');
  }

  // Get root domain from host header
  const host = request.headers.get('host');

  if (!host) {
    throw new Error('Missing host header');
  }

  // Extract root domain
  const tenantRootDomain = extractRootDomain(host);

  // Get tenant slug from cache (this is the current tenant's slug)
  const currentTenantSlug = await getTenantSlugFromCache(tenantId);

  if (!currentTenantSlug) {
    throw new Error('Failed to resolve tenant slug from tenant settings');
  }

  // Get JWT token from session
  const jwtToken = await getUserJWTFromSession(request, tenantId);

  if (!jwtToken) {
    throw new Error('Failed to retrieve user JWT from session');
  }

  // Parse JWT to validate user access
  const jwt = parseJWTString(jwtToken);

  if (!jwt || !jwt.roles || jwt.roles.length === 0) {
    throw new Error('Missing or invalid JWT token');
  }

  // Check if user has access to current tenant
  const hasAccess = jwt.roles.some(role =>
    role.OrgSlug === 'all' ||                    // SystemAdmin with all orgs
    role.OrgSlug === currentTenantSlug           // Has access to this specific org
  );

  if (!hasAccess) {
    throw new Error(`User does not have access to tenant: ${currentTenantSlug}`);
  }

  // Bucket name is always the current tenant slug (validated above)
  return {
    tenantId,
    tenantSlug: currentTenantSlug,  // Use validated tenant slug
    tenantRootDomain,
  };
}

/**
 * Extract root domain from host
 * Removes app/subdomain prefix
 */
function extractRootDomain(host: string): string {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Split by dots
  const parts = hostname.split('.');

  // If only 2 parts (e.g., example.com), return as is
  if (parts.length <= 2) {
    return hostname;
  }

  // If 3+ parts (e.g., app.um1ygn.edu.mm), remove first part
  // Return: um1ygn.edu.mm
  return parts.slice(1).join('.');
}

/**
 * Extract tenant slug from root domain
 * Gets the first part of the domain
 * Examples:
 *   um1ygn.edu.mm -> um1ygn
 *   crystal-image.net -> crystal-image
 *   localhost -> localhost
 */
function extractTenantSlug(rootDomain: string): string {
  const parts = rootDomain.split('.');
  return parts[0];
}

/**
 * Validate tenant ID matches MongoDB ObjectID format
 */
export function isValidMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Get tenant bucket name based on strategy
 * @param tenantSlug - Tenant slug (e.g., "um1ygn")
 * @param strategy - Bucket strategy
 */
export function getTenantBucketName(
  tenantSlug: string,
  strategy: 'per-tenant' | 'shared' = 'per-tenant'
): string {
  if (strategy === 'per-tenant') {
    return tenantSlug; // Use slug directly as bucket name
  }
  return 'tenants'; // Single shared bucket
}
