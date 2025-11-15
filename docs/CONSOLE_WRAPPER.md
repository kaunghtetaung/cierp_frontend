# Console Wrapper for Production JSON Logging

## Overview

The Console Wrapper intercepts all `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug` calls and formats them as structured JSON when `LOG_FORMAT=json` is set. This ensures that **all console output** from the application (including third-party libraries and direct console calls) respects the logging format for Loki compatibility.

## Problem Solved

**Before:**
- Direct `console.log()` calls throughout codebase output pretty/human-readable format
- Even with `LOG_FORMAT=json` set, logs appeared as: `✅ [getUserAccessToken] Checking...`
- Loki couldn't parse these unstructured logs properly

**After:**
- ALL console calls are intercepted and formatted as JSON in production
- Structured JSON output: `{"level":"info","timestamp":"2025-10-26T10:23:45.123Z","message":"...","service":"frontend-core"}`
- Loki can parse and query all logs effectively

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│          APPLICATION CODE                               │
│  console.log("User logged in", { userId: "123" })      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│          CONSOLE WRAPPER                                │
│  - Intercepts console methods                           │
│  - Formats as structured JSON                           │
│  - Respects LOG_FORMAT env variable                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│          STDOUT                                         │
│  {"level":"info","timestamp":"...","message":"..."}     │
└─────────────────────────────────────────────────────────┘
                        ↓
         Promtail → Loki → Grafana
```

## Implementation

### 1. Console Wrapper Utility

**Location:** `libs/utils/server/console-wrapper.ts`

**Features:**
- Intercepts all console methods (log, info, warn, error, debug)
- Auto-initializes when `LOG_FORMAT=json` or `NODE_ENV=production`
- Sanitizes objects for JSON serialization
- Handles Errors, functions, symbols, BigInt properly
- Singleton pattern for global consistency

### 2. Instrumentation Hook

**Files:**
- `apps/core/instrumentation.ts`
- `apps/publicWeb/instrumentation.ts`

**Purpose:**
- Loads BEFORE any application code
- Perfect place to initialize console wrapper
- Ensures all subsequent console calls are wrapped

### 3. Next.js Configuration

**Changes to `next.config.js`:**

```javascript
experimental: {
  instrumentationHook: true,  // Enable instrumentation
},
compiler: {
  removeConsole: false,  // CRITICAL: Don't remove console in production
}
```

**Why `removeConsole: false`?**
- Previously, Next.js was removing ALL console calls in production
- Our wrapper needs console calls to remain so it can intercept them
- We control the output format, not whether logs appear

## Usage

### Automatic (Recommended)

The console wrapper automatically initializes when:
- `LOG_FORMAT=json` is set, OR
- `NODE_ENV=production` (and LOG_FORMAT is not set)

No code changes needed - just use console methods normally:

```typescript
console.log('User authenticated', { userId: '123', tenantId: 'abc' });
console.error('Authentication failed', new Error('Invalid token'));
console.warn('Token expiring soon', { expiresIn: 300 });
```

### Manual Control (Advanced)

```typescript
import { consoleWrapper } from '@repo/utils/server/console-wrapper';

// Initialize manually
consoleWrapper.initialize();

// Restore original console
consoleWrapper.restore();

// Get original console methods (bypass wrapper)
const original = consoleWrapper.getOriginal();
original.log('This bypasses the wrapper');
```

## Output Format

### Development (LOG_FORMAT=pretty or not set)

```
✅ [10:23:45] User authenticated { userId: '123', tenantId: 'abc' }
```

### Production (LOG_FORMAT=json)

```json
{
  "level": "info",
  "timestamp": "2025-10-26T10:23:45.123Z",
  "message": "User authenticated",
  "service": "frontend-core",
  "metadata": {
    "userId": "123",
    "tenantId": "abc"
  }
}
```

### Error Handling

```typescript
console.error('Failed to connect', new Error('ECONNREFUSED'));
```

**Output:**
```json
{
  "level": "error",
  "timestamp": "2025-10-26T10:23:45.123Z",
  "message": "ECONNREFUSED",
  "service": "frontend-core",
  "metadata": {
    "errorName": "Error",
    "stack": "Error: ECONNREFUSED\n    at ..."
  }
}
```

## Environment Variables

| Variable | Values | Effect |
|----------|--------|--------|
| `LOG_FORMAT` | `json` \| `pretty` | Forces specific format |
| `NODE_ENV` | `production` \| `development` | Defaults to JSON in production |
| `SERVICE_NAME` | Any string | Added to logs as `service` field |

## Deployment

### Kubernetes/Docker

Ensure environment variables are set:

```yaml
env:
  - name: LOG_FORMAT
    value: "json"
  - name: NODE_ENV
    value: "production"
  - name: SERVICE_NAME
    value: "frontend-core"  # or "frontend-publicweb"
```

### Verification

Check logs in your pods:

```bash
kubectl logs -n ciapp-frontend frontend-core-xxx --tail=10
```

**Expected output (JSON format):**
```json
{"level":"info","timestamp":"2025-10-26T10:23:45.123Z","message":"Instrumentation: Console wrapper loaded for production","service":"frontend-core"}
```

## Loki Query Examples

With structured JSON logs, you can now query effectively:

```promql
# All errors from core service
{service="frontend-core"} |= "error"

# Specific user's logs
{service="frontend-core"} | json | userId="68e0b62131f65aa7c3783438"

# Authentication failures
{service="frontend-core"} | json | message=~".*auth.*failed.*"

# Logs within time range with specific tenant
{service="frontend-core"} | json | tenantId="68d12d98e776d47ad2004f19"
```

## Migration Guide

### No Migration Needed!

The beauty of the console wrapper is that **no code changes are required**. All existing `console.log()` calls automatically output JSON format when deployed with `LOG_FORMAT=json`.

### Best Practices

While not required, consider migrating critical logging to the structured logger for more control:

```typescript
// Before (still works!)
console.log('User logged in', { userId, tenantId });

// After (more structured)
import { logger } from '@repo/utils/common/logger';
logger.info('User logged in', { userId, tenantId });
```

## Troubleshooting

### Issue: Still seeing pretty format in production

**Check:**
1. Verify `LOG_FORMAT=json` is set: `kubectl exec pod-name -- env | grep LOG_FORMAT`
2. Verify `NODE_ENV=production`: `kubectl exec pod-name -- env | grep NODE_ENV`
3. Check instrumentation loaded: Look for "Console wrapper loaded" in logs
4. Verify `removeConsole: false` in `next.config.js`

### Issue: Logs are missing in production

**Cause:** `removeConsole: true` in Next.js config

**Fix:** Set `removeConsole: false` in `next.config.js`

### Issue: JSON serialization errors

**Cause:** Circular references or non-serializable objects

**Fix:** The wrapper handles most cases, but for complex objects:
```typescript
// Avoid circular references
const obj = { name: 'test' };
obj.self = obj;  // ❌ Circular reference

// Instead
console.log('Object data', { name: obj.name });  // ✅
```

## Performance

- **Minimal overhead:** Wrapper only adds JSON.stringify() call
- **No runtime cost in development:** Wrapper is bypassed when `LOG_FORMAT=pretty`
- **Singleton pattern:** No memory leaks from multiple instances

## Related Documentation

- [ERROR_LOGGING_STATUS.md](./ERROR_LOGGING_STATUS.md) - Overall error logging architecture
- [LOKI_SETUP.md](./LOKI_SETUP.md) - Loki/Grafana setup guide
- [libs/utils/LOGGING.md](./libs/utils/LOGGING.md) - Structured logger utility

---

**Last Updated:** 2025-10-26
**Version:** 1.0
