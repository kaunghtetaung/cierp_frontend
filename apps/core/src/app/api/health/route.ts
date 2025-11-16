import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Kubernetes probes
 * Returns basic health status and optional metadata
 */
export async function GET() {
  try {
    // You can add additional health checks here
    // For example: database connectivity, redis connectivity, etc.

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'core',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    // If health check fails, return 503 Service Unavailable
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Also support HEAD requests for lighter health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}