// Middleware error handling wrapper
// Catches errors in middleware and logs them to stdout → Loki

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationError, reportError } from '@repo/utils/common';
import { getMiddlewareRequestContext } from './error-context';

/**
 * Wrap middleware function with error handling
 * Automatically catches errors, logs to Loki, and returns appropriate response
 *
 * @example
 * ```typescript
 * export async function middleware(request: NextRequest) {
 *   return wrapMiddleware(request, 'publicWeb-middleware', async (req) => {
 *     // Your middleware logic here
 *     const response = await createTenantMiddleware(req, config);
 *     return response;
 *   });
 * }
 * ```
 */
export async function wrapMiddleware(
  request: NextRequest,
  component: string,
  handler: (request: NextRequest) => Promise<NextResponse | null | undefined>
): Promise<NextResponse> {
  try {
    const response = await handler(request);
    return response || NextResponse.next();
  } catch (error) {
    const requestContext = getMiddlewareRequestContext(request);

    const appError = new ApplicationError({
      type: 'MIDDLEWARE_ERROR',
      message: error instanceof Error ? error.message : 'Middleware processing failed',
      severity: 'high',
      category: 'middleware',
      operation: 'middleware-execution',
      component,
      cause: error instanceof Error ? error : undefined,
      hostname: requestContext.hostname,
      appName: requestContext.appName,
      service: requestContext.service,
      tenantId: requestContext.tenantId,
      userId: requestContext.userId,
      sessionId: requestContext.sessionId,
      requestId: requestContext.requestId,
      path: requestContext.path,
      method: requestContext.method,
      userAgent: requestContext.userAgent,
      metadata: {
        url: request.url,
        nextUrl: request.nextUrl.toString(),
        errorName: error instanceof Error ? error.name : 'UnknownError'
      }
    });

    await reportError(appError);

    // For middleware errors, allow the request to continue
    // Next.js will handle it with error boundaries
    return NextResponse.next();
  }
}

/**
 * Log middleware error without interrupting the middleware chain
 * Use this for non-critical errors that should be logged but not stop processing
 */
export async function logMiddlewareError(
  error: unknown,
  request: NextRequest,
  component: string,
  operation: string,
  metadata?: Record<string, any>
): Promise<void> {
  const requestContext = getMiddlewareRequestContext(request);

  const appError = new ApplicationError({
    type: 'MIDDLEWARE_WARNING',
    message: error instanceof Error ? error.message : 'Middleware warning',
    severity: 'medium',
    category: 'middleware',
    operation,
    component,
    cause: error instanceof Error ? error : undefined,
    hostname: requestContext.hostname,
    appName: requestContext.appName,
    service: requestContext.service,
    tenantId: requestContext.tenantId,
    userId: requestContext.userId,
    sessionId: requestContext.sessionId,
    requestId: requestContext.requestId,
    path: requestContext.path,
    method: requestContext.method,
    userAgent: requestContext.userAgent,
    metadata: {
      ...metadata,
      url: request.url
    }
  });

  await reportError(appError);
}
