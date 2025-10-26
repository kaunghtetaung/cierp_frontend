// Error Context Utilities - Client-side context extraction
import type { RequestContext } from '../server/error-context';

/**
 * Determine app name from client-side detection
 */
function getClientAppName(): string {
  if (typeof window === 'undefined') return 'unknown';

  // Check current URL path patterns
  const pathname = window.location.pathname;

  // Core app typically has /appId/module pattern
  if (pathname.match(/^\/[a-z]+\/[a-z-]+/)) {
    return 'core';
  }

  // PublicWeb for other patterns
  return 'publicWeb';
}

/**
 * Build service field based on app name and hostname (client-side)
 */
function buildClientServiceField(appName: string, hostname: string): string {
  if (appName === 'publicWeb') {
    return `publicWeb-${hostname}`;
  }
  return hostname;
}

/**
 * Extract request context from browser environment
 * This is used in client components (global-error, error.tsx)
 */
export function getClientRequestContext(): RequestContext {
  if (typeof window === 'undefined') {
    return {
      appName: 'unknown',
      service: 'unknown'
    };
  }

  const hostname = window.location.hostname;
  const appName = getClientAppName();
  const service = buildClientServiceField(appName, hostname);
  const path = window.location.pathname;
  const userAgent = navigator?.userAgent;

  // Try to extract tenantId from meta tags or session storage
  let tenantId: string | undefined;
  try {
    const metaTenant = document.querySelector('meta[name="x-tenant-id"]');
    tenantId = metaTenant?.getAttribute('content') || undefined;
  } catch {
    // Ignore
  }

  // Try to extract userId from session storage or cookies
  let userId: string | undefined;
  try {
    userId = sessionStorage.getItem('userId') || undefined;
  } catch {
    // Ignore
  }

  return {
    hostname,
    appName,
    service,
    tenantId,
    userId,
    path,
    userAgent
  };
}

/**
 * Get request context safely (works in both client and server)
 */
export function getSafeRequestContext(): RequestContext {
  try {
    return getClientRequestContext();
  } catch (error) {
    console.warn('[ERROR_CONTEXT] Failed to get client context:', error);
    return {
      appName: 'unknown',
      service: 'unknown'
    };
  }
}
