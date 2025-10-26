// Common server-side error handler for middleware, API routes, and server actions
// Outputs structured errors to stdout → Promtail → Loki → Grafana

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import { ApplicationError, reportError } from '@repo/utils/common';
import {
  getRequestContext,
  getMiddlewareRequestContext,
  getApiRouteRequestContext,
  type RequestContext
} from './error-context';

/**
 * Error handler configuration
 */
export interface ServerErrorHandlerConfig {
  operation: string;
  component: string;
  category?: 'middleware' | 'api' | 'server-action' | 'application';
  metadata?: Record<string, any>;
}

/**
 * Handle middleware errors with full context
 * Use this in middleware.ts files
 */
export async function handleMiddlewareError(
  error: unknown,
  request: NextRequest,
  config: ServerErrorHandlerConfig
): Promise<NextResponse> {
  const requestContext = getMiddlewareRequestContext(request);

  const appError = new ApplicationError({
    type: 'MIDDLEWARE_ERROR',
    message: error instanceof Error ? error.message : 'Middleware error occurred',
    severity: 'high',
    category: config.category || 'middleware',
    operation: config.operation,
    component: config.component,
    cause: error instanceof Error ? error : undefined,
    // Request context
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
      ...config.metadata,
      url: request.url,
      nextUrl: request.nextUrl.toString()
    }
  });

  await reportError(appError);

  // Return error response
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      code: 'MIDDLEWARE_ERROR',
      requestId: requestContext.requestId
    },
    { status: 500 }
  );
}

/**
 * Handle API route errors with full context
 * Use this in app/api/*\/route.ts files
 */
export async function handleApiError(
  error: unknown,
  request: NextRequest,
  config: ServerErrorHandlerConfig
): Promise<NextResponse> {
  const requestContext = getApiRouteRequestContext(request);

  // Determine severity based on error type
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'high';
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
      severity = 'medium';
    } else if (error.message.includes('not found') || error.message.includes('Not found')) {
      severity = 'low';
    }
  }

  const appError = new ApplicationError({
    type: 'API_ERROR',
    message: error instanceof Error ? error.message : 'API error occurred',
    severity,
    category: config.category || 'api',
    operation: config.operation,
    component: config.component,
    cause: error instanceof Error ? error : undefined,
    // Request context
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
      ...config.metadata,
      endpoint: requestContext.path
    }
  });

  await reportError(appError);

  // Return error response
  const statusCode = severity === 'low' ? 404 : 500;
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'API_ERROR',
      requestId: requestContext.requestId
    },
    { status: statusCode }
  );
}

/**
 * Handle server action errors with full context
 * Use this in server actions (files with "use server")
 */
export async function handleServerActionError(
  error: unknown,
  config: ServerErrorHandlerConfig,
  headerStore?: ReadonlyHeaders
): Promise<{ success: false; error: string }> {
  const requestContext = await getRequestContext(headerStore);

  const appError = new ApplicationError({
    type: 'SERVER_ACTION_ERROR',
    message: error instanceof Error ? error.message : 'Server action error occurred',
    severity: 'high',
    category: config.category || 'server-action',
    operation: config.operation,
    component: config.component,
    cause: error instanceof Error ? error : undefined,
    // Request context
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
      ...config.metadata,
      action: config.operation
    }
  });

  await reportError(appError);

  // Return error response for server actions
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An error occurred'
  };
}

/**
 * Wrapper for middleware to catch and handle errors automatically
 *
 * @example
 * ```typescript
 * export async function middleware(request: NextRequest) {
 *   return withMiddlewareErrorHandler(request, async (req) => {
 *     // Your middleware logic here
 *     return NextResponse.next();
 *   }, {
 *     operation: 'tenant-resolution',
 *     component: 'publicWeb-middleware'
 *   });
 * }
 * ```
 */
export async function withMiddlewareErrorHandler(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: ServerErrorHandlerConfig
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    return await handleMiddlewareError(error, request, config);
  }
}

/**
 * Wrapper for API routes to catch and handle errors automatically
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withApiErrorHandler(request, async (req) => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 *   }, {
 *     operation: 'get-modules',
 *     component: 'api-route'
 *   });
 * }
 * ```
 */
export async function withApiErrorHandler(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: ServerErrorHandlerConfig
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    return await handleApiError(error, request, config);
  }
}

/**
 * Wrapper for server actions to catch and handle errors automatically
 *
 * @example
 * ```typescript
 * "use server"
 *
 * export async function submitForm(formData: FormData) {
 *   return withServerActionErrorHandler(async () => {
 *     // Your action logic here
 *     return { success: true, data: {...} };
 *   }, {
 *     operation: 'submit-form',
 *     component: 'form-actions'
 *   });
 * }
 * ```
 */
export async function withServerActionErrorHandler<T>(
  handler: () => Promise<T>,
  config: ServerErrorHandlerConfig
): Promise<T | { success: false; error: string }> {
  try {
    return await handler();
  } catch (error) {
    return await handleServerActionError(error, config);
  }
}

/**
 * Log an error without throwing or returning error response
 * Useful for fire-and-forget error logging
 */
export async function logServerError(
  error: unknown,
  context: RequestContext,
  config: ServerErrorHandlerConfig
): Promise<void> {
  const appError = new ApplicationError({
    type: 'SERVER_ERROR',
    message: error instanceof Error ? error.message : 'Server error occurred',
    severity: 'medium',
    category: config.category || 'application',
    operation: config.operation,
    component: config.component,
    cause: error instanceof Error ? error : undefined,
    // Request context
    hostname: context.hostname,
    appName: context.appName,
    service: context.service,
    tenantId: context.tenantId,
    userId: context.userId,
    sessionId: context.sessionId,
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    userAgent: context.userAgent,
    metadata: config.metadata
  });

  await reportError(appError);
}
