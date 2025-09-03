/**
 * Tenant ID Debugging Utilities
 * Tools to verify tenant ID is properly included in API requests
 */

import { MIDDLEWARE_HEADERS } from '@repo/utils/common/constants';

/**
 * Debug function to log tenant ID presence in request
 */
export function debugTenantId(
  context: string,
  headers: Record<string, string>,
  url?: string
): void {
  const tenantId = headers[MIDDLEWARE_HEADERS.TENANT_ID];
  
  if (tenantId) {
    console.debug(`✅ [${context}] Tenant ID present: ${tenantId}`, {
      url,
      tenantId,
      context
    });
  } else {
    console.error(`❌ [${context}] MISSING TENANT ID in request`, {
      url,
      headers: Object.keys(headers),
      context
    });
  }
}

/**
 * Middleware to log all outgoing requests with tenant ID status
 */
export function createTenantDebugLogger() {
  return {
    beforeRequest: (url: string, options: RequestInit) => {
      const headers = options.headers as Record<string, string> || {};
      debugTenantId('HTTP_REQUEST', headers, url);
    },
    
    afterResponse: (url: string, response: Response) => {
      const tenantId = response.headers.get('X-Tenant-ID');
      console.debug(`📡 [HTTP_RESPONSE] ${url}`, {
        status: response.status,
        tenantId,
        serverTenantId: tenantId
      });
    }
  };
}

/**
 * Check if tenant ID is present in various contexts
 */
export async function checkTenantIdAvailability(): Promise<{
  cookie: string | null;
  header: string | null;
  domain: string | null;
  localStorage: string | null;
}> {
  const result = {
    cookie: null as string | null,
    header: null as string | null, 
    domain: null as string | null,
    localStorage: null as string | null,
  };

  // Check cookie
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tenantCookie = cookies.find(c => c.trim().startsWith('tenant-id='));
    result.cookie = tenantCookie ? tenantCookie.split('=')[1] : null;
  }

  // Check localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    result.localStorage = localStorage.getItem('tenant-id');
  }

  // Check server headers (if available)
  if (typeof window === 'undefined') {
    try {
      const { headers } = await import('next/headers');
      const headerStore = await headers();
      result.header = headerStore.get(MIDDLEWARE_HEADERS.TENANT_ID);
    } catch (e) {
      // Headers not available
    }
  }

  // Check domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3 && !['www', 'api', 'cdn'].includes(parts[0])) {
      result.domain = parts[0];
    }
  }

  console.debug('🔍 Tenant ID Availability Check:', result);
  return result;
}

/**
 * Validate tenant ID format
 */
export function validateTenantIdFormat(tenantId: string | null): {
  valid: boolean;
  reason?: string;
} {
  if (!tenantId) {
    return { valid: false, reason: 'Tenant ID is null or empty' };
  }

  if (typeof tenantId !== 'string') {
    return { valid: false, reason: 'Tenant ID is not a string' };
  }

  if (tenantId.length === 0) {
    return { valid: false, reason: 'Tenant ID is empty string' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
    return { valid: false, reason: 'Tenant ID contains invalid characters (only alphanumeric, hyphens, underscores allowed)' };
  }

  if (tenantId.length > 50) {
    return { valid: false, reason: 'Tenant ID is too long (max 50 characters)' };
  }

  return { valid: true };
}