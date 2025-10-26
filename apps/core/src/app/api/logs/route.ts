/**
 * Client-Side Console Logs API Endpoint (SECURED) - Core App
 *
 * Receives browser console logs from the client and outputs them to stdout
 * for Promtail → Loki ingestion.
 *
 * Security Features:
 * - Feature flag validation (must be enabled)
 * - Rate limiting (per IP)
 * - Origin validation (same-origin only)
 * - Payload size limits
 * - Input sanitization
 * - Request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ConsoleLogEntry } from '@repo/utils/client/console-logger';

export const runtime = 'edge'; // Use edge runtime for better performance

/**
 * Check if console logger is enabled
 */
function isConsoleLoggerEnabled(): boolean {
  // Only enabled when explicitly set to 'true'
  return process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER === 'true';
}

interface LogBatch {
  logs: ConsoleLogEntry[];
}

// Rate limiting configuration (in-memory for edge runtime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP
const RATE_LIMIT_MAX_LOGS = 100; // Max 100 logs per batch

// Payload size limits
const MAX_MESSAGE_LENGTH = 1000;
const MAX_ARGS_SIZE = 2000;
const MAX_BATCH_SIZE = 50;

/**
 * Rate limiting check
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

/**
 * Validate request origin (same-origin only)
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow requests from same host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  // Fallback to referer check
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  // No origin or referer - likely not from browser
  return false;
}

/**
 * Sanitize log message
 */
function sanitizeMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Truncate if too long
  let sanitized = message.substring(0, MAX_MESSAGE_LENGTH);

  // Remove potentially dangerous patterns
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '[script removed]')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '[iframe removed]')
    .replace(/javascript:/gi, '[javascript removed]')
    .replace(/on\w+\s*=/gi, '[event handler removed]');

  return sanitized;
}

/**
 * Sanitize log arguments
 */
function sanitizeArgs(args: any[]): any[] {
  if (!args || !Array.isArray(args)) {
    return [];
  }

  // Limit number of arguments
  const limited = args.slice(0, 10);

  return limited.map(arg => {
    // Convert to string to check size
    const str = JSON.stringify(arg);
    if (str && str.length > MAX_ARGS_SIZE) {
      return '[arg too large]';
    }
    return arg;
  });
}

/**
 * POST /api/logs - Receive client-side console logs
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Feature flag check - reject if disabled
    if (!isConsoleLoggerEnabled()) {
      return NextResponse.json(
        {
          error: 'Service disabled',
          message: 'Console logging is not enabled'
        },
        { status: 503 } // 503 Service Unavailable
      );
    }

    // 2. Get client IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown';

    // 3. Rate limiting check
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      );
    }

    // 4. Origin validation (same-origin only)
    if (!isValidOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid origin' },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    let body: LogBatch;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    if (!body.logs || !Array.isArray(body.logs)) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'logs array required' },
        { status: 400 }
      );
    }

    // 6. Validate batch size
    if (body.logs.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: 'Batch too large',
          message: `Maximum ${MAX_BATCH_SIZE} logs per request`,
        },
        { status: 413 }
      );
    }

    // 7. Get log format from environment
    const logFormat = (process.env.LOG_FORMAT || 'pretty') as 'json' | 'pretty';

    // 8. Process each log entry with sanitization
    let processedCount = 0;
    for (const log of body.logs) {
      // Validate log entry structure
      if (!log.level || !log.timestamp || !log.message) {
        continue; // Skip invalid entries
      }

      // Sanitize inputs
      const sanitizedMessage = sanitizeMessage(log.message);
      const sanitizedArgs = log.args ? sanitizeArgs(log.args) : undefined;

      // Enrich with server-side context
      const enrichedLog = {
        // Loki standard fields
        level: mapLogLevel(log.level),
        timestamp: log.timestamp,

        // Service identification (core app)
        service: 'core-browser',
        source: 'client-console',

        // Log content (sanitized)
        message: sanitizedMessage,
        consoleLevel: log.level,

        // Client context (from metadata)
        url: log.metadata?.url,
        userAgent: log.metadata?.userAgent,
        tenantId: log.metadata?.tenantId,
        userId: log.metadata?.userId,
        sessionId: log.metadata?.sessionId,

        // Additional data (sanitized)
        args: sanitizedArgs,

        // Request metadata
        requestIp: clientIp,
        hostname: request.headers.get('host'),
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
          debug: '🔍',
        }[log.level] || 'ℹ️';

        console.log(
          `${emoji} [CORE BROWSER ${log.level.toUpperCase()}] ${sanitizedMessage}`,
          log.metadata
        );
      }

      processedCount++;
    }

    // 9. Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        received: body.logs.length,
        processed: processedCount,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    // Log the error
    console.error('Failed to process client logs:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to process logs',
        message: error instanceof Error ? error.message : 'Unknown error',
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
