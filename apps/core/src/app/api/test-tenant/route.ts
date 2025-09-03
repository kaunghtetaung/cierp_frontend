import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { MIDDLEWARE_HEADERS } from '@repo/utils/common/constants'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to verify tenant ID forwarding
 */
export async function GET(request: NextRequest) {
  try {
    const headerStore = await headers()
    const tenantId = headerStore.get(MIDDLEWARE_HEADERS.TENANT_ID)
    
    // Get all relevant headers for debugging
    const debugHeaders: Record<string, string> = {}
    const relevantHeaders = [
      'x-tenant-id',
      'x-app-name', 
      'x-lang',
      'host',
      'user-agent',
      'authorization'
    ]
    
    relevantHeaders.forEach(headerName => {
      const value = headerStore.get(headerName)
      if (value) {
        debugHeaders[headerName] = value
      }
    })

    const result = {
      success: true,
      tenantId,
      timestamp: new Date().toISOString(),
      headers: debugHeaders,
      url: request.url,
      method: request.method,
      validation: {
        hasTenantId: !!tenantId,
        tenantIdValid: tenantId ? /^[a-zA-Z0-9_-]+$/.test(tenantId) : false,
        tenantIdLength: tenantId?.length || 0
      }
    }

    // Return with tenant ID in response headers for verification
    return NextResponse.json(result, {
      status: tenantId ? 200 : 400,
      headers: {
        'X-Tenant-ID': tenantId || 'MISSING',
        'X-Test-Result': tenantId ? 'PASS' : 'FAIL',
        'X-Timestamp': new Date().toISOString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error('Test tenant API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'X-Test-Result': 'ERROR',
        'X-Timestamp': new Date().toISOString(),
      }
    })
  }
}

/**
 * Handle POST requests for testing different scenarios
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headerStore = await headers()
    const tenantId = headerStore.get(MIDDLEWARE_HEADERS.TENANT_ID)

    return NextResponse.json({
      success: true,
      tenantId,
      requestBody: body,
      timestamp: new Date().toISOString(),
      message: 'POST request processed successfully'
    }, {
      headers: {
        'X-Tenant-ID': tenantId || 'MISSING',
        'X-Test-Result': tenantId ? 'PASS' : 'FAIL',
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}