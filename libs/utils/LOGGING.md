# Structured Logging Guide

## Overview

This project uses structured logging for Loki/Grafana compatibility. All new code should use the `logger` utility instead of direct `console.log` calls.

## Quick Start

```typescript
import { logger } from '@repo/utils/common/logger';

// Info log
logger.info('User logged in', {
  userId: user.id,
  tenantId: tenant.id
});

// Warning log
logger.warn('Token expiring soon', {
  expiresIn: 300,
  userId: user.id
});

// Error log
logger.error('Authentication failed', {
  error: err.message,
  userId: user.id
});

// Debug log (only in development)
logger.debug('Processing request', {
  requestId: req.id,
  method: req.method
});
```

## Log Levels

- **debug**: Detailed debugging information (suppressed in production)
- **info**: General informational messages
- **warn**: Warning messages for potential issues
- **error**: Error messages for failures

## Output Formats

The logger automatically adapts based on `LOG_FORMAT` environment variable:

### Development (`LOG_FORMAT=pretty`)
```
🔍 [14:23:45] User logged in { userId: '123', tenantId: 'abc' }
⚠️ [14:23:46] Token expiring soon { expiresIn: 300 }
❌ [14:23:47] Authentication failed { error: 'Invalid credentials' }
```

### Production (`LOG_FORMAT=json`)
```json
{"level":"info","timestamp":"2025-01-26T14:23:45.123Z","message":"User logged in","context":{"userId":"123","tenantId":"abc"}}
{"level":"warn","timestamp":"2025-01-26T14:23:46.456Z","message":"Token expiring soon","context":{"expiresIn":300}}
{"level":"error","timestamp":"2025-01-26T14:23:47.789Z","message":"Authentication failed","context":{"error":"Invalid credentials"}}
```

## Context Fields

Use consistent context field names for better Loki queries:

### Identity
- `tenantId`: Tenant identifier
- `userId`: User identifier
- `sessionId`: Session identifier

### Request
- `requestId`: Unique request ID
- `hostname`: Request hostname
- `path`: Request path
- `method`: HTTP method

### Application
- `service`: Service name (e.g., "publicWeb", "core")
- `component`: Component name (e.g., "auth", "middleware")
- `operation`: Operation name (e.g., "login", "tokenRefresh")

### Additional
- Any other relevant metadata

## Loki Queries

With structured logging, you can query logs efficiently:

```logql
# All errors for a specific user
{level="error"} | json | userId="123"

# All token operations
{component="auth"} | json | operation=~"token.*"

# All requests for a specific tenant
{tenantId="abc"} | json

# Slow operations (custom metadata)
{level="warn"} | json | duration > 1000
```

## Migration from console.log

### Before (Non-Loki compatible)
```typescript
console.log(`✅ [getUserAccessToken] Valid token found (expires in ${expiresIn}s)`);
console.warn("⚠️ TenantToken: No cached tenant settings found");
console.error("❌ Authentication failed:", error);
```

### After (Loki compatible)
```typescript
import { logger } from '@repo/utils/common/logger';

logger.info('Valid token found', {
  component: 'auth',
  operation: 'getUserAccessToken',
  expiresIn
});

logger.warn('No cached tenant settings found', {
  component: 'auth',
  operation: 'getTenantToken'
});

logger.error('Authentication failed', {
  component: 'auth',
  operation: 'login',
  error: error.message
});
```

## Benefits

✅ **Loki Compatible**: JSON output in production for log aggregation
✅ **Developer Friendly**: Pretty output in development with emojis
✅ **Queryable**: Structured context for efficient log queries
✅ **Consistent**: Same format across all services
✅ **Typed**: TypeScript support for log context

## Configuration

```bash
# .env.development
LOG_FORMAT=pretty

# .env.production
LOG_FORMAT=json
```

## Best Practices

1. **Always include context**: Don't just log messages, include relevant data
2. **Use appropriate levels**: info for normal operations, warn for issues, error for failures
3. **Consistent field names**: Use the standard context fields listed above
4. **Don't log sensitive data**: Never log passwords, tokens, or PII
5. **Make messages searchable**: Use clear, consistent message strings

## Example: Converting a Module

```typescript
// Before
console.log(`🔄 Refreshing token for user ${userId}`);
// ... do work ...
console.log(`✅ Token refreshed successfully`);

// After
import { logger } from '@repo/utils/common/logger';

logger.info('Refreshing token', {
  component: 'auth',
  operation: 'refreshToken',
  userId
});
// ... do work ...
logger.info('Token refreshed successfully', {
  component: 'auth',
  operation: 'refreshToken',
  userId,
  expiresIn: tokenData.expires_in
});
```

## Files to Migrate

Priority files for migration:
1. `libs/auth/core/tokens.ts` - Token management
2. `libs/tenant/middleware-core.ts` - Tenant middleware
3. `libs/appModules/module-service.ts` - Module operations
4. `libs/api/server/server.ts` - API client
5. Server actions in `libs/appModules/server-actions/`

See [Migration Checklist](#migration-checklist) below.

## Migration Checklist

- [ ] libs/auth/core/tokens.ts
- [ ] libs/auth/core/sessions.ts
- [ ] libs/auth/core/oidc.ts
- [ ] libs/tenant/middleware-core.ts
- [ ] libs/appModules/module-service.ts
- [ ] libs/appModules/server-actions/extra-actions.ts
- [ ] libs/appModules/server-actions/module-actions.ts
- [ ] libs/api/server/server.ts
- [ ] apps/publicWeb/src/middleware.ts
- [ ] apps/core/src/middleware.ts

---

**Last Updated**: January 2025
