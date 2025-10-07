# Token Lifetime Configuration

This directory contains the token lifetime and Redis TTL configuration for all token types in the authentication system.

## Overview

The token configuration system allows you to define:
- **Token Lifetime**: The actual JWT token validity period from OIDC
- **Redis TTL**: How long the token is cached in Redis
- **Safety Margin**: Buffer time before expiry to trigger refresh
- **Refresh Threshold**: TTL threshold for proactive refresh

## Configuration File

**Location**: `/libs/auth/config/token-config.ts`

### Token Types

#### 1. Initializer Token (`initializerToken`)

```typescript
{
  tokenLifetime: 600,      // 10 minutes
  redisTTL: 600,           // 10 minutes
  safetyMargin: 120,       // 2 minutes
  refreshThreshold: 300,   // 5 minutes
}
```

- **Use Case**: Fetching tenant settings, system initialization
- **Grant Type**: `client_credentials`
- **Scope**: `tenant:read`
- **Credentials**: `process.env.TENANT_API_CLIENT_ID` / `TENANT_API_CLIENT_SECRET`

#### 2. Tenant Access Token (`tenantAccessToken`)

```typescript
{
  tokenLifetime: 600,      // 10 minutes
  redisTTL: 600,           // 10 minutes
  safetyMargin: 120,       // 2 minutes
  refreshThreshold: 300,   // 5 minutes
}
```

- **Use Case**: Accessing tenant-specific resources, content, pages
- **Grant Type**: `client_credentials`
- **Scope**: `api.read`
- **Credentials**: `secret.apiAccess.clientId` / `clientSecret` from cached tenant settings

#### 3. User Access Token (`userAccessToken`)

```typescript
{
  tokenLifetime: 3600,     // 1 hour
  redisTTL: 3600,          // 1 hour
  safetyMargin: 300,       // 5 minutes
  refreshThreshold: 600,   // 10 minutes
}
```

- **Use Case**: User-authenticated API calls, user-specific operations
- **Grant Type**: `authorization_code`, `refresh_token`
- **Scope**: `openid profile email`
- **Credentials**: `secret.logInFlow.clientId` / `clientSecret` from cached tenant settings

#### 4. User Refresh Token (`userRefreshToken`)

```typescript
{
  tokenLifetime: 7 * 24 * 3600,    // 7 days
  redisTTL: 7 * 24 * 3600,         // 7 days
  safetyMargin: 24 * 3600,         // 1 day
  refreshThreshold: 2 * 24 * 3600, // 2 days
}
```

- **Use Case**: Obtaining new user access tokens
- **Grant Type**: `refresh_token`
- **Lifetime**: Long-lived token (7 days typical)

## How It Works

### Token Caching Flow

1. **Token Retrieved from OIDC**
   - Token has `expires_in` field (e.g., 3600s for 1 hour)
   - This is the **Token Lifetime**

2. **Token Stored in Redis**
   - Uses configured **Redis TTL** (must be ≤ Token Lifetime)
   - Redis automatically removes token after TTL expires

3. **Token Validation**
   - Before returning cached token, check remaining TTL
   - If TTL ≤ **Safety Margin**, consider token expired
   - Delete from cache and trigger refresh

4. **Proactive Refresh**
   - Background service checks token TTL
   - If TTL ≤ **Refresh Threshold**, refresh proactively
   - Prevents token expiration during active use

### Example Timeline

For a User Access Token with 1 hour lifetime:

```
Token Created (t=0)
├─ Token Lifetime: 3600s (1 hour)
├─ Redis TTL: 3600s (1 hour)
├─ Refresh Threshold: 600s (10 min)
└─ Safety Margin: 300s (5 min)

Timeline:
t=0s    - Token created and cached
t=3000s - Refresh threshold reached (600s remaining)
          → Background service can refresh proactively
t=3300s - Safety margin reached (300s remaining)
          → Token considered expired, will refresh on next use
t=3600s - Token expires (0s remaining)
          → Redis automatically removes token
```

## Configuration Best Practices

### 1. Redis TTL Should Be ≤ Token Lifetime

```typescript
// ✅ GOOD: Redis TTL matches token lifetime
tokenLifetime: 3600,
redisTTL: 3600,

// ✅ GOOD: Redis TTL is shorter (forced re-auth)
tokenLifetime: 3600,
redisTTL: 1800,  // Cache only 30 min of 1 hour token

// ❌ BAD: Redis TTL exceeds token lifetime
tokenLifetime: 3600,
redisTTL: 7200,  // Will cache expired tokens!
```

### 2. Safety Margin Prevents Expired Token Usage

```typescript
// ✅ GOOD: Safety margin gives time to refresh
tokenLifetime: 3600,
safetyMargin: 300,  // Refresh 5 min before expiry

// ❌ BAD: No safety margin
tokenLifetime: 3600,
safetyMargin: 0,    // Token might expire during request!
```

### 3. Refresh Threshold Enables Proactive Renewal

```typescript
// ✅ GOOD: Proactive refresh 10 min before expiry
tokenLifetime: 3600,
refreshThreshold: 600,

// ⚠️ OK: No proactive refresh (reactive only)
tokenLifetime: 3600,
refreshThreshold: 0,  // Only refresh when needed
```

## Performance vs Security Trade-offs

### Longer Redis TTL

**Pros:**
- Fewer token refreshes
- Better performance
- Less load on OIDC server

**Cons:**
- Tokens cached longer
- Less reactive to permission changes
- Higher risk if Redis compromised

**Example:**
```typescript
// Cache full token lifetime
tokenLifetime: 3600,
redisTTL: 3600,
```

### Shorter Redis TTL

**Pros:**
- More frequent re-authentication
- Better security
- Faster permission revocation

**Cons:**
- More token refreshes
- Higher latency
- More load on OIDC server

**Example:**
```typescript
// Force re-auth every 30 minutes
tokenLifetime: 3600,
redisTTL: 1800,
```

## Modifying Configuration

### 1. Edit Configuration File

```typescript
// /libs/auth/config/token-config.ts

export const TOKEN_LIFETIME_CONFIG: Record<string, TokenLifetimeConfig> = {
  userAccessToken: {
    tokenLifetime: 3600,     // Change to desired value
    redisTTL: 3600,          // Adjust Redis cache time
    safetyMargin: 300,       // Modify safety buffer
    refreshThreshold: 600,   // Update refresh trigger
  },
};
```

### 2. Restart Application

The configuration is loaded when the application starts. After modifying the config:

```bash
# Restart the development server
npm run dev
```

### 3. Verify Changes

Check server logs for configuration initialization:

```
📋 UserTokenStrategy initialized with configs: {
  accessToken: {
    tokenLifetime: '3600s',
    redisTTL: '3600s',
    safetyMargin: '300s'
  }
}
```

## Viewing Configuration

### Web UI

Visit the token configuration page:

```
http://app.um1ygn.edu.mm/testToken/config
```

This page displays:
- All token configurations
- Human-readable durations
- Configuration guide
- Best practices

### Programmatic Access

```typescript
import { getTokenConfig, describeTokenConfig } from '@repo/auth/config';

// Get configuration for a token type
const config = getTokenConfig('userAccessToken');
console.log(config);
// {
//   tokenLifetime: 3600,
//   redisTTL: 3600,
//   safetyMargin: 300,
//   refreshThreshold: 600
// }

// Get human-readable description
const description = describeTokenConfig('userAccessToken');
console.log(description);
```

## Validation

The configuration includes built-in validation:

```typescript
import { validateTokenConfig, getTokenConfig } from '@repo/auth/config';

const config = getTokenConfig('userAccessToken');
const isValid = validateTokenConfig(config);

if (!isValid) {
  console.error('Invalid token configuration!');
}
```

### Validation Rules

1. **Redis TTL ≤ Token Lifetime**
   ```
   redisTTL must not exceed tokenLifetime
   ```

2. **Safety Margin < Token Lifetime**
   ```
   safetyMargin must be less than tokenLifetime
   ```

3. **Refresh Threshold < Token Lifetime**
   ```
   refreshThreshold must be less than tokenLifetime
   ```

## Common Scenarios

### Scenario 1: Increase User Session Length

**Goal**: Keep users logged in longer

```typescript
// Before (1 hour)
userAccessToken: {
  tokenLifetime: 3600,
  redisTTL: 3600,
  safetyMargin: 300,
  refreshThreshold: 600,
}

// After (4 hours)
userAccessToken: {
  tokenLifetime: 14400,  // 4 hours
  redisTTL: 14400,       // 4 hours
  safetyMargin: 600,     // 10 min
  refreshThreshold: 1800, // 30 min
}
```

### Scenario 2: Improve Security with Shorter Cache

**Goal**: Force more frequent re-authentication

```typescript
// Before (cache full lifetime)
userAccessToken: {
  tokenLifetime: 3600,
  redisTTL: 3600,
  safetyMargin: 300,
  refreshThreshold: 600,
}

// After (cache only 30 min)
userAccessToken: {
  tokenLifetime: 3600,
  redisTTL: 1800,        // Only cache 30 min
  safetyMargin: 300,
  refreshThreshold: 600,
}
```

### Scenario 3: Reduce OIDC Server Load

**Goal**: Fewer token refreshes

```typescript
// Before (aggressive refresh)
tenantAccessToken: {
  tokenLifetime: 600,
  redisTTL: 600,
  safetyMargin: 120,     // 2 min before expiry
  refreshThreshold: 300, // Refresh if < 5 min
}

// After (lazy refresh)
tenantAccessToken: {
  tokenLifetime: 600,
  redisTTL: 600,
  safetyMargin: 60,      // 1 min before expiry
  refreshThreshold: 120, // Refresh if < 2 min
}
```

## Troubleshooting

### Issue: Tokens Expiring Too Quickly

**Symptom**: Users getting logged out frequently

**Solution**: Increase `tokenLifetime` or reduce `safetyMargin`

```typescript
// Increase valid time window
userAccessToken: {
  tokenLifetime: 7200,   // 2 hours instead of 1
  safetyMargin: 300,     // Keep same
}
```

### Issue: Too Many Token Refreshes

**Symptom**: High load on OIDC server

**Solution**: Increase `refreshThreshold` or reduce `redisTTL`

```typescript
// Less aggressive refresh
userAccessToken: {
  refreshThreshold: 300, // 5 min instead of 10 min
}
```

### Issue: Cached Expired Tokens

**Symptom**: Getting "token expired" errors from API

**Solution**: Ensure `redisTTL ≤ tokenLifetime`

```typescript
// ❌ WRONG
tokenLifetime: 3600,
redisTTL: 7200,  // Caching expired tokens!

// ✅ CORRECT
tokenLifetime: 3600,
redisTTL: 3600,  // Matches token lifetime
```

## Related Documentation

- [Token Management Architecture](../README.md)
- [Token Strategies](../managers/README.md)
- [OIDC Integration](../core/README.md)
- [Session Management](../../security/README.md)
