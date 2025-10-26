/**
 * Client-Side Console Logs API Endpoint
 *
 * Receives browser console logs from the client and outputs them to stdout
 * for Promtail → Loki ingestion.
 *
 * This endpoint accepts batched console logs from the browser and formats them
 * as structured JSON for Loki compatibility.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ConsoleLogEntry } from '@repo/utils/client/console-logger';

export const runtime = 'edge'; // Use edge runtime for better performance

interface LogBatch {
  logs: ConsoleLogEntry[];
}

/**
 * POST /api/logs - Receive client-side console logs
 */
export async function POST(request: NextRequest) {
  try {
    const body: LogBatch = await request.json();

    if (!body.logs || !Array.isArray(body.logs)) {
      return NextResponse.json(
        { error: 'Invalid request: logs array required' },
        { status: 400 }
      );
    }

    // Get log format from environment
    const logFormat = (process.env.LOG_FORMAT || 'pretty') as 'json' | 'pretty';

    // Process each log entry
    for (const log of body.logs) {
      // Enrich with server-side context
      const enrichedLog = {
        // Loki standard fields
        level: mapLogLevel(log.level),
        timestamp: log.timestamp,

        // Service identification
        service: 'frontend-browser',
        source: 'client-console',

        // Log content
        message: log.message,
        consoleLevel: log.level,

        // Client context
        url: log.metadata?.url,
        userAgent: log.metadata?.userAgent,
        tenantId: log.metadata?.tenantId,
        userId: log.metadata?.userId,
        sessionId: log.metadata?.sessionId,

        // Additional data
        args: log.args,

        // Request metadata
        requestIp: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        hostname: request.headers.get('host')
      };

      // Output to stdout for Loki
      if (logFormat === 'json') {
        // Single-line JSON for Promtail/Loki
        console.log(JSON.stringify(enrichedLog));
      } else {
        // Pretty format for development
        const emoji = {
          log: 'ℹ️',
          info: 'ℹ️',
          warn: '⚠️',
          error: '❌',
          debug: '🔍'
        }[log.level] || 'ℹ️';

        console.log(
          `${emoji} [BROWSER ${log.level.toUpperCase()}] ${log.message}`,
          log.metadata
        );
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        received: body.logs.length
      },
      { status: 200 }
    );

  } catch (error) {
    // Log the error
    console.error('Failed to process client logs:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to process logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Map console log level to Loki log level
 */
function mapLogLevel(level: ConsoleLogEntry['level']): string {
  switch (level) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warn';
    case 'info':
      return 'info';
    case 'debug':
      return 'debug';
    case 'log':
    default:
      return 'info';
  }
}
