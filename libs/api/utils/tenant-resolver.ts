/**
 * Tenant ID Resolution Utilities
 * Ensures every request has the proper x-tenant-id header
 */

import { getCookie } from "@repo/security/cookies";
import { COOKIE_NAMES, MIDDLEWARE_HEADERS } from "@repo/utils/common/constants";

/**
 * Get tenant ID from various sources with fallback priority:
 * 1. Explicitly passed tenantId
 * 2. Server-side headers (from middleware)
 * 3. Client-side cookies
 * 4. URL-based domain resolution (fallback)
 */
export async function resolveTenantId(explicitTenantId?: string): Promise<string | null> {
  // Priority 1: Explicit tenant ID
  if (explicitTenantId) {
    return explicitTenantId;
  }

  // Priority 2: Server-side headers (during SSR/API routes)
  if (typeof window === 'undefined') {
    try {
      // Try to get from Next.js headers (server-side)
      const { headers } = await import('next/headers');
      const headerStore = await headers();
      const tenantFromHeader = headerStore.get(MIDDLEWARE_HEADERS.TENANT_ID);
      if (tenantFromHeader) {
        return tenantFromHeader;
      }
    } catch (error) {
      // Headers not available (non-Next.js context or error)
      console.warn('Failed to get tenant from headers:', error);
    }
  }

  // Priority 3: Client-side cookies
  if (typeof window !== 'undefined') {
    const tenantFromCookie = getCookie(COOKIE_NAMES.TENANT_ID);
    if (tenantFromCookie) {
      return tenantFromCookie;
    }
  }

  // Priority 4: Domain-based resolution (fallback)
  const tenantFromDomain = await resolveTenantFromDomain();
  if (tenantFromDomain) {
    return tenantFromDomain;
  }

  console.warn('No tenant ID could be resolved - requests may fail');
  return null;
}

/**
 * Resolve tenant from current domain/hostname
 * This is a fallback method when other sources are unavailable
 */
async function resolveTenantFromDomain(): Promise<string | null> {
  try {
    // Client-side domain resolution
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return extractTenantFromHostname(hostname);
    }

    // Server-side domain resolution
    try {
      const { headers } = await import('next/headers');
      const headerStore = await headers();
      const host = headerStore.get('host');
      if (host) {
        return extractTenantFromHostname(host);
      }
    } catch (error) {
      // Headers not available
    }

    return null;
  } catch (error) {
    console.error('Failed to resolve tenant from domain:', error);
    return null;
  }
}

/**
 * Extract tenant ID from hostname
 * Examples:
 * - tenant1.example.com -> tenant1
 * - localhost:3000 -> 'local'
 * - 127.0.0.1:3000 -> 'local'
 */
function extractTenantFromHostname(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Local development
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('127.0.0.')) {
    return 'local';
  }

  // Subdomain extraction (tenant.domain.com -> tenant)
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Skip common subdomains
    if (!['www', 'api', 'cdn', 'static'].includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Validate tenant ID format
 */
export function isValidTenantId(tenantId: string | null): boolean {
  if (!tenantId || typeof tenantId !== 'string') {
    return false;
  }

  // Basic validation: alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]+$/.test(tenantId) && tenantId.length > 0;
}

/**
 * Get tenant ID with validation
 * Returns null if no valid tenant ID can be resolved
 */
export async function getValidTenantId(explicitTenantId?: string): Promise<string | null> {
  const tenantId = await resolveTenantId(explicitTenantId);
  return isValidTenantId(tenantId) ? tenantId : null;
}