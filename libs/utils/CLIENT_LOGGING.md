# Client-Side Console Logging to Server

## Overview

This guide explains how to capture browser console logs and send them to your server for Loki ingestion.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER                                   │
│                                                              │
│  console.log("User clicked button")                         │
│            ↓                                                 │
│  ┌──────────────────────────────────────┐                  │
│  │  Console Logger (Interceptor)        │                  │
│  │  - Captures console.log/warn/error   │                  │
│  │  - Batches logs (10 logs or 5s)      │                  │
│  │  - Adds metadata (url, tenantId)     │                  │
│  └─────────────────┬────────────────────┘                  │
│                    │                                         │
│                    ▼                                         │
│         navigator.sendBeacon()                              │
│         POST /api/logs                                      │
│         { logs: [...] }                                     │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVER                                     │
│                                                              │
│  /api/logs endpoint receives batch                          │
│            ↓                                                 │
│  ┌──────────────────────────────────────┐                  │
│  │  Enrich with server context          │                  │
│  │  - Add requestIp, hostname           │                  │
│  │  - Format for Loki                   │                  │
│  └─────────────────┬────────────────────┘                  │
│                    │                                         │
│                    ▼                                         │
│         console.log(JSON.stringify())                       │
│         (Stdout)                                            │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
              Promtail → Loki
```

## Setup

### Step 1: Initialize in Your App

Add the console logger to your app's root layout or `_app.tsx`:

```typescript
// apps/publicWeb/src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializeConsoleLogger } from '@repo/utils/client/console-logger';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize console logger
    initializeConsoleLogger({
      endpoint: '/api/logs',           // Server endpoint
      batchSize: 10,                   // Send after 10 logs
      batchInterval: 5000,             // Or after 5 seconds
      includeMetadata: true,           // Include browser metadata
      enableInDevelopment: false,      // Disable in dev (optional)
    });

    // Cleanup on unmount
    return () => {
      destroyConsoleLogger();
    };
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Step 2: Use Console Normally

Now all console logs will be captured and sent to the server:

```typescript
// Any component
console.log('User logged in', { userId: '123' });
console.warn('Token expiring soon');
console.error('Failed to save', new Error('Network timeout'));
```

### Step 3: Verify Logs in Server

Your server logs will now include browser console output:

**Development (LOG_FORMAT=pretty):**
```
ℹ️ [BROWSER LOG] User logged in { url: 'http://localhost:3002/profile', tenantId: '...' }
⚠️ [BROWSER WARN] Token expiring soon
❌ [BROWSER ERROR] Failed to save
```

**Production (LOG_FORMAT=json):**
```json
{"level":"info","timestamp":"2025-01-26T14:23:45.123Z","service":"frontend-browser","source":"client-console","message":"User logged in","consoleLevel":"log","url":"http://www.um1ygn.edu.mm/profile","tenantId":"68d12d98e776d47ad2004f19","userAgent":"Mozilla/5.0...","requestIp":"192.168.1.1"}
```

## Configuration Options

### ConsoleLoggerConfig

```typescript
interface ConsoleLoggerConfig {
  endpoint: string;                    // Required: Server endpoint
  batchSize?: number;                  // Default: 10
  batchInterval?: number;              // Default: 5000ms
  includeMetadata?: boolean;           // Default: true
  enableInDevelopment?: boolean;       // Default: false
  maxBatchSize?: number;               // Default: 100 (memory limit)
  onError?: (error: Error) => void;    // Error callback
}
```

### Example Configurations

**Production (Capture Everything):**
```typescript
initializeConsoleLogger({
  endpoint: '/api/logs',
  batchSize: 20,              // Batch more logs
  batchInterval: 10000,       // Send every 10s
  includeMetadata: true,
  enableInDevelopment: false
});
```

**Development (Debugging):**
```typescript
initializeConsoleLogger({
  endpoint: '/api/logs',
  batchSize: 5,               // Send quickly
  batchInterval: 2000,        // Send every 2s
  includeMetadata: true,
  enableInDevelopment: true,  // Enable in dev
  onError: (error) => {
    console.error('Log send failed:', error);
  }
});
```

## Metadata Captured

Each log entry includes:

### Client Metadata
- `url`: Current page URL
- `userAgent`: Browser user agent
- `tenantId`: From cookie (if available)
- `userId`: From localStorage (if available)
- `sessionId`: From sessionStorage (if available)

### Server Metadata (added by /api/logs)
- `requestIp`: Client IP address
- `hostname`: Request hostname
- `timestamp`: Log timestamp

## Loki Queries

Query browser logs in Loki:

```logql
# All browser console logs
{service="frontend-browser"} | json

# Browser errors only
{service="frontend-browser"} | json | consoleLevel="error"

# Logs from specific page
{service="frontend-browser"} | json | url=~".*profile.*"

# Logs for specific tenant
{service="frontend-browser"} | json | tenantId="68d12d98e776d47ad2004f19"

# Count errors by page (last hour)
sum by (url) (count_over_time({service="frontend-browser",consoleLevel="error"}[1h]))
```

## Advanced Usage

### Manual Flush Before Navigation

```typescript
import { flushConsoleLogs } from '@repo/utils/client/console-logger';

// Before navigation
router.beforePopState(() => {
  flushConsoleLogs();
  return true;
});
```

### Conditional Initialization

```typescript
useEffect(() => {
  // Only capture in production
  if (process.env.NODE_ENV === 'production') {
    initializeConsoleLogger({
      endpoint: '/api/logs',
      batchSize: 10
    });
  }
}, []);
```

### Custom Error Handler

```typescript
initializeConsoleLogger({
  endpoint: '/api/logs',
  onError: (error) => {
    // Send to error tracking service
    Sentry.captureException(error);
  }
});
```

## Performance Considerations

### Batching
- Logs are batched (default: 10 logs or 5s) to reduce HTTP requests
- Uses `navigator.sendBeacon()` for reliable transmission (even during page unload)
- Fallback to `fetch()` with `keepalive: true` for older browsers

### Memory Management
- Maximum batch size: 100 logs (prevents memory issues)
- Older logs are discarded if limit reached
- Messages truncated to 1000 characters

### Network
- Endpoint should be on same domain (no CORS)
- Uses `sendBeacon()` - doesn't block page unload
- Automatic retry on failure (logs re-queued)

## Security Considerations

### Don't Log Sensitive Data

```typescript
// ❌ BAD - Logs sensitive data
console.log('User password:', password);

// ✅ GOOD - Logs safe data
console.log('User login attempt', { userId });
```

### Filter Sensitive Logs Server-Side

```typescript
// /api/logs/route.ts
if (log.message.includes('password') || log.message.includes('token')) {
  continue; // Skip sensitive logs
}
```

### Rate Limiting

Add rate limiting to `/api/logs` endpoint:

```typescript
// Check request frequency per IP
const requestCount = await redis.incr(`log-rate:${requestIp}`);
await redis.expire(`log-rate:${requestIp}`, 60);

if (requestCount > 100) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

## Troubleshooting

### Logs Not Appearing in Server

1. Check endpoint is correct: `/api/logs`
2. Check browser console for errors
3. Verify API route exists and is deployed
4. Check `enableInDevelopment` setting

### Too Many Logs

Adjust batch settings:
```typescript
initializeConsoleLogger({
  batchSize: 50,        // Increase batch size
  batchInterval: 30000  // Increase interval to 30s
});
```

### Memory Issues

Reduce max batch size:
```typescript
initializeConsoleLogger({
  maxBatchSize: 50  // Reduce from default 100
});
```

## Alternative: Selective Logging

If you don't want to capture ALL console logs, use the structured logger instead:

```typescript
import { logger } from '@repo/utils/common/logger';

// This respects LOG_FORMAT and outputs to stdout automatically
logger.info('User action', { action: 'click', userId: '123' });
```

This approach:
- ✅ Doesn't intercept all console.log
- ✅ Only logs what you explicitly call
- ✅ Works on both client and server
- ❌ Requires code changes (can't capture existing console.log)

## Recommendation

**For Production:**
- Use console logger for **errors only** (less noise)
- Use structured logger for **important events**
- Add rate limiting to `/api/logs`

**For Development:**
- Disable console logger (noise)
- Use browser DevTools console
- Use structured logger for debugging

---

**Last Updated**: January 2025
