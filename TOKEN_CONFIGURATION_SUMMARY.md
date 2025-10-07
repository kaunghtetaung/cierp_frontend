# Token Lifetime Configuration Implementation Summary

## 🎯 Overview

Implemented a comprehensive token lifetime and Redis TTL configuration system that allows you to define token behavior for each token type independently.

## ✅ What Was Implemented

### 1. Token Configuration System

**File**: `/libs/auth/config/token-config.ts`

- **Token Lifetime Config Interface**: Defines token lifetime, Redis TTL, safety margin, and refresh threshold for each token type
- **Configuration Map**: `TOKEN_LIFETIME_CONFIG` with settings for all 4 token types
- **Utility Functions**:
  - `getTokenConfig()` - Get config for specific token type
  - `validateTokenConfig()` - Validate configuration rules
  - `shouldRefreshToken()` - Check if token should be refreshed
  - `describeTokenConfig()` - Human-readable description
  - `logAllTokenConfigs()` - Log all configs

### 2. Updated Token Strategies

All three token strategies now use the configuration:

#### Initializer Token Strategy
- Uses `initializerToken` config
- Logs config on initialization
- Uses configured Redis TTL for caching
- Uses configured safety margin for expiry check

#### Tenant Token Strategy
- Uses `tenantAccessToken` config
- Logs config on initialization
- Uses configured Redis TTL for caching
- Uses configured safety margin for expiry check

#### User Token Strategy
- Uses both `userAccessToken` and `userRefreshToken` configs
- Logs configs on initialization
- Uses configured Redis TTL for caching access and refresh tokens
- Uses configured safety margin for expiry validation

### 3. Token Configuration Page

**URL**: `http://app.um1ygn.edu.mm/testToken/config`

Features:
- Visual display of all token configurations
- Color-coded token type cards
- Human-readable durations
- Token use case descriptions
- Configuration guide
- Best practices
- File location reference

## 📊 Current Configuration

### Initializer Token
- **Token Lifetime**: 600s (10 minutes)
- **Redis TTL**: 600s (10 minutes)
- **Safety Margin**: 120s (2 minutes)
- **Refresh Threshold**: 300s (5 minutes)
- **Use**: Tenant settings, system initialization

### Tenant Access Token
- **Token Lifetime**: 600s (10 minutes)
- **Redis TTL**: 600s (10 minutes)
- **Safety Margin**: 120s (2 minutes)
- **Refresh Threshold**: 300s (5 minutes)
- **Use**: Content, pages, tenant resources

### User Access Token
- **Token Lifetime**: 3600s (1 hour)
- **Redis TTL**: 3600s (1 hour)
- **Safety Margin**: 300s (5 minutes)
- **Refresh Threshold**: 600s (10 minutes)
- **Use**: User-authenticated API calls

### User Refresh Token
- **Token Lifetime**: 604800s (7 days)
- **Redis TTL**: 604800s (7 days)
- **Safety Margin**: 86400s (1 day)
- **Refresh Threshold**: 172800s (2 days)
- **Use**: Obtaining new access tokens

## 🔧 How It Works

### Token Caching Flow

1. **Token Retrieved from OIDC**
   - Token has `expires_in` field from OIDC
   - This becomes the **Token Lifetime**

2. **Token Stored in Redis**
   - Uses configured **Redis TTL** (not token lifetime)
   - Redis TTL can be shorter for security
   - Redis TTL must be ≤ Token Lifetime

3. **Token Validation**
   - Check remaining TTL before returning cached token
   - If TTL ≤ **Safety Margin**, consider expired
   - Delete from cache and trigger refresh

4. **Proactive Refresh**
   - Background service checks token TTL
   - If TTL ≤ **Refresh Threshold**, refresh proactively
   - Prevents token expiration during use

### Example Timeline (User Access Token)

```
Token Created (t=0)
├─ Token Lifetime: 3600s (1 hour)
├─ Redis TTL: 3600s (1 hour)
├─ Refresh Threshold: 600s (10 min)
└─ Safety Margin: 300s (5 min)

Timeline:
t=0s    - Token created and cached in Redis
t=3000s - Refresh threshold reached (600s remaining)
          → Background service can refresh proactively
t=3300s - Safety margin reached (300s remaining)
          → Token considered expired, will refresh on next use
t=3600s - Token expires (0s remaining)
          → Redis automatically removes token
```

## 📝 Key Features

### 1. Independent Configuration
Each token type has its own configuration:
- Different lifetimes
- Different Redis TTL
- Different safety margins
- Different refresh thresholds

### 2. Validation
Built-in validation ensures:
- Redis TTL ≤ Token Lifetime
- Safety Margin < Token Lifetime
- Refresh Threshold < Token Lifetime

### 3. Logging
Comprehensive logging shows:
- Configuration on strategy initialization
- Token caching operations with TTL values
- Token expiry warnings
- Refresh triggers

### 4. Visual Interface
Web UI displays:
- All token configurations
- Human-readable durations
- Color-coded by token type
- Configuration guide
- Best practices

## 🎨 Configuration Examples

### Increase User Session Length

```typescript
userAccessToken: {
  tokenLifetime: 14400,  // 4 hours (was 1 hour)
  redisTTL: 14400,       // 4 hours
  safetyMargin: 600,     // 10 min (was 5 min)
  refreshThreshold: 1800, // 30 min (was 10 min)
}
```

### Improve Security with Shorter Cache

```typescript
userAccessToken: {
  tokenLifetime: 3600,   // 1 hour
  redisTTL: 1800,        // Only cache 30 min (was 1 hour)
  safetyMargin: 300,     // 5 min
  refreshThreshold: 600, // 10 min
}
```

### Reduce OIDC Server Load

```typescript
tenantAccessToken: {
  tokenLifetime: 600,    // 10 min
  redisTTL: 600,         // 10 min
  safetyMargin: 60,      // 1 min (was 2 min)
  refreshThreshold: 120, // 2 min (was 5 min)
}
```

## 📂 Files Created/Modified

### Created Files
1. `/libs/auth/config/token-config.ts` - Main configuration file
2. `/libs/auth/config/index.ts` - Configuration exports
3. `/libs/auth/config/README.md` - Comprehensive documentation
4. `/apps/publicWeb/src/app/testToken/config/page.tsx` - Config page
5. `/apps/publicWeb/src/app/testToken/config/TokenConfigClient.tsx` - Config UI

### Modified Files
1. `/libs/auth/managers/initializer-token-strategy.ts` - Uses config
2. `/libs/auth/managers/tenant-token-strategy.ts` - Uses config
3. `/libs/auth/managers/user-token-strategy.ts` - Uses config

## 🚀 Usage

### Viewing Configuration

**Web UI**:
```
http://app.um1ygn.edu.mm/testToken/config
```

**Code**:
```typescript
import { getTokenConfig, describeTokenConfig } from '@repo/auth/config';

const config = getTokenConfig('userAccessToken');
console.log(config);
```

### Modifying Configuration

1. Edit `/libs/auth/config/token-config.ts`
2. Modify values in `TOKEN_LIFETIME_CONFIG`
3. Restart application: `npm run dev`
4. Verify in logs or web UI

### Example Modification

```typescript
// /libs/auth/config/token-config.ts

export const TOKEN_LIFETIME_CONFIG: Record<string, TokenLifetimeConfig> = {
  userAccessToken: {
    tokenLifetime: 7200,     // Change: 2 hours instead of 1
    redisTTL: 7200,          // Change: match new lifetime
    safetyMargin: 600,       // Change: 10 min instead of 5
    refreshThreshold: 1200,  // Change: 20 min instead of 10
  },
};
```

## 🎯 Benefits

### 1. Flexibility
- Configure each token type independently
- Balance performance vs security per token type
- Easy to adjust based on requirements

### 2. Performance
- Control cache duration to reduce token refreshes
- Optimize OIDC server load
- Proactive refresh prevents expiration

### 3. Security
- Force re-authentication with shorter Redis TTL
- Safety margin prevents expired token usage
- Validation prevents misconfiguration

### 4. Observability
- Comprehensive logging
- Visual configuration display
- Human-readable durations

### 5. Maintainability
- Centralized configuration
- Well-documented
- Type-safe with TypeScript

## 📚 Documentation

- **Configuration Guide**: `/libs/auth/config/README.md`
- **Web UI**: `http://app.um1ygn.edu.mm/testToken/config`
- **Code Documentation**: Inline comments in `token-config.ts`

## ✅ Validation

The configuration includes automatic validation:

```typescript
import { validateTokenConfig, getTokenConfig } from '@repo/auth/config';

const config = getTokenConfig('userAccessToken');
const isValid = validateTokenConfig(config);
// true if valid, false if invalid with console errors
```

## 🔍 Troubleshooting

### Tokens Expiring Too Quickly
**Solution**: Increase `tokenLifetime` or reduce `safetyMargin`

### Too Many Token Refreshes
**Solution**: Increase `refreshThreshold` or reduce frequency

### Cached Expired Tokens
**Solution**: Ensure `redisTTL ≤ tokenLifetime`

## 🎉 Summary

You now have a complete token lifetime configuration system that:
- ✅ Defines token lifetime and Redis TTL for each token type
- ✅ Uses configured values in all token strategies
- ✅ Logs configuration and caching operations
- ✅ Provides web UI for viewing configuration
- ✅ Includes comprehensive documentation
- ✅ Validates configuration rules
- ✅ Supports easy modification

**Next Steps**:
1. Visit `http://app.um1ygn.edu.mm/testToken/config` to view current configuration
2. Read `/libs/auth/config/README.md` for detailed documentation
3. Modify `/libs/auth/config/token-config.ts` to adjust settings
4. Monitor server logs to see configuration in action
