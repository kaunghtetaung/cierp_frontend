import { NextRequest, NextResponse } from 'next/server'
import { getModuleList } from '@repo/app-modules'
import { headers } from 'next/headers'
import { reportError } from '@repo/utils/common/error-reporter'
import { ApplicationError } from '@repo/utils/common/error-types'
import { getApiRouteRequestContext } from '@repo/utils/server/error-context'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const resolvedParams = await params
    const moduleSlug = resolvedParams.module
    
    if (!moduleSlug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      )
    }

    // Ensure tenant ID is available (critical for API gateway)
    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id')
    
    if (!tenantId) {
      console.error(`CRITICAL: No tenant ID in API route for module ${moduleSlug}`)
      return NextResponse.json(
        { error: 'Tenant ID is required for API gateway requests' },
        { status: 400 }
      )
    }

    // Get search params from URL
    const searchParams: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      searchParams[key] = value
    })

    // Set a timeout for the API request
    const timeoutMs = parseInt(
      request.headers.get('X-Request-Timeout') || '20000'
    )

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })

    // Race between the actual request and timeout
    const dataPromise = getModuleList(moduleSlug, searchParams)
    
    const data = await Promise.race([dataPromise, timeoutPromise])

    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Module': moduleSlug,
        'X-Tenant-ID': tenantId,
        'X-Fetch-Time': new Date().toISOString(),
      }
    })

  } catch (error) {
    const moduleSlug = (await params).module

    // Extract full request context
    const requestContext = getApiRouteRequestContext(request);

    // Report error with full context
    const appError = new ApplicationError({
      type: 'API_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      severity: error instanceof Error && error.message === 'Request timeout' ? 'medium' : 'high',
      category: 'api',
      operation: 'fetch-module-list',
      component: 'api-route',
      cause: error instanceof Error ? error : undefined,
      // Include request context
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
        module: moduleSlug,
        endpoint: `/api/modules/${moduleSlug}`,
        isTimeout: error instanceof Error && error.message === 'Request timeout'
      }
    })

    reportError(appError).catch(err => {
      console.error('Failed to report API error:', err)
    })

    // Fallback console logging
    console.error(`API Error for module ${moduleSlug}:`, error)

    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        {
          error: 'Request to microservice timed out',
          isTimeout: true,
          retryAfter: 3000
        },
        { status: 408 } // Request Timeout
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}