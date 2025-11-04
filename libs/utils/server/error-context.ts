// Error Context Utilities - Extract request context for error reporting
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

export interface RequestContext {
  hostname?: string;
  appName?: string;
  service?: string;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
}

/**
 * Determine app name from environment or detection
 * Safe for Edge Runtime (doesn't use process.cwd)
 */
function getAppName(): string {
  // Try environment variable first
  if (typeof process !== 'undefined' && process.env.APP_NAME) {
    return process.env.APP_NAME;
  }

  // Try to detect from package.json if available (not in Edge Runtime)
  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    try {
      const cwd = process.cwd();
      if (cwd.includes('/apps/publicWeb')) return 'publicWeb';
      if (cwd.includes('/apps/core')) return 'core';
    } catch {
      // process.cwd() not available in Edge Runtime
    }
  }

  // Fallback: try to detect from hostname pattern
  return 'unknown';
}

/**
 * Build service field based on app name and hostname
 * - publicWeb: "publicWeb-{hostname}"
 * - core: "{hostname}"
 */
function buildServiceField(appName: string, hostname?: string): string {
  if (!hostname) return appName;

  if (appName === 'publicWeb') {
    return `publicWeb-${hostname}`;
  }

  // For core app, just use hostname
  return hostname;
}

/**
 * Extract request context from Next.js headers (server-side only)
 * This should be called from server components, API routes, or server actions
 */
export async function getRequestContext(
  headerStore?: ReadonlyHeaders | null
): Promise<RequestContext> {
  let headers: ReadonlyHeaders | null = headerStore || null;

  // If headers not provided, try to import dynamically (server-side only)
  if (!headers && typeof window === 'undefined') {
    try {
      const { headers: getHeaders } = await import('next/headers');
      headers = await getHeaders();
    } catch (error) {
      // Headers not available (could be in middleware or build time)
      console.warn('[ERROR_CONTEXT] Could not access Next.js headers:', error);
    }
  }

  if (!headers) {
    // Return minimal context with app name
    const appName = getAppName();
    return {
      appName,
      service: appName
    };
  }

  // Extract context from headers
  const hostname = headers.get('host') || headers.get('x-forwarded-host') || undefined;
  const tenantId = headers.get('x-tenant-id') || undefined;
  const userId = headers.get('x-user-id') || undefined;
  const sessionId = headers.get('x-session-id') || undefined;
  const requestId = headers.get('x-request-id') || headers.get('x-correlation-id') || undefined;
  const path = headers.get('x-pathname') || headers.get('x-invoke-path') || undefined;
  const method = headers.get('x-invoke-method') || undefined;
  const userAgent = headers.get('user-agent') || undefined;

  // Determine app name
  const appName = getAppName();

  // Build service field
  const service = buildServiceField(appName, hostname);

  return {
    hostname,
    appName,
    service,
    tenantId,
    userId,
    sessionId,
    requestId,
    path,
    method,
    userAgent
  };
}

/**
 * Extract context from middleware request (uses different API)
 */
export function getMiddlewareRequestContext(request: {
  headers: Headers;
  nextUrl: { pathname: string };
  method: string;
}): RequestContext {
  const hostname = request.headers.get('host') || undefined;
  const tenantId = request.headers.get('x-tenant-id') || undefined;
  const userId = request.headers.get('x-user-id') || undefined;
  const sessionId = request.headers.get('x-session-id') || undefined;
  const requestId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || undefined;
  const path = request.nextUrl.pathname;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || undefined;

  const appName = getAppName();
  const service = buildServiceField(appName, hostname);

  return {
    hostname,
    appName,
    service,
    tenantId,
    userId,
    sessionId,
    requestId,
    path,
    method,
    userAgent
  };
}

/**
 * Extract context from API route request
 */
export function getApiRouteRequestContext(request: {
  headers: Headers;
  url: string;
  method: string;
}): RequestContext {
  const hostname = request.headers.get('host') || undefined;
  const tenantId = request.headers.get('x-tenant-id') || undefined;
  const userId = request.headers.get('x-user-id') || undefined;
  const sessionId = request.headers.get('x-session-id') || undefined;
  const requestId = request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Parse path from URL
  let path: string | undefined;
  try {
    const url = new URL(request.url);
    path = url.pathname;
  } catch {
    path = undefined;
  }

  const appName = getAppName();
  const service = buildServiceField(appName, hostname);

  return {
    hostname,
    appName,
    service,
    tenantId,
    userId,
    sessionId,
    requestId,
    path,
    method: request.method,
    userAgent
  };
}

/**
 * Merge request context with error metadata
 */
export function mergeErrorContext(
  requestContext: RequestContext,
  errorMetadata?: Record<string, any>
): Record<string, any> {
  return {
    ...errorMetadata,
    ...requestContext
  };
}
