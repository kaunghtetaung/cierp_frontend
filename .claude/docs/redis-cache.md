# Redis Cache Module Documentation

This document describes the Redis caching system for the multi-tenant application, covering cache architecture, utilities, and usage patterns.

## Architecture Overview

The application uses a **Redis-based caching system** with tenant-scoped keys and hierarchical organization:

- **Cache Implementation**: UnifiedCache class with singleton pattern
- **Redis Client**: IORedis for high-performance Redis operations
- **Key Structure**: Hierarchical namespace with tenant isolation
- **Cache Patterns**: Cache-aside, request-level deduplication, distributed locking

## Module Structure

The cache module is organized in `/libs/cache` with clear separation:

```
libs/cache/
├── unified-cache.ts    # Core cache implementation class
├── cache-utils.ts      # Utilities, key builders, TTL constants
├── types.ts           # TypeScript type definitions
├── index.ts          # Main exports
└── package.json      # Dependencies (ioredis)
```

## Core Cache Class

**Location**: `/libs/cache/unified-cache.ts`

### `UnifiedCache` (Singleton)

The main cache class implementing Redis operations with built-in error handling and performance tracking.

```typescript
import { getCacheInstance } from '@repo/cache';

const cache = getCacheInstance({
  host: 'localhost',
  port: 6379,
  db: 0
});
```

#### Core Methods

##### `get<T>(key: string): Promise<T | null>`

Retrieves value from cache with automatic JSON deserialization.

```typescript
const userProfile = await cache.get<UserProfile>('ciApp:tenant1:User:123');
// Returns: UserProfile object or null if not found
```

##### `set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>`

Stores value in cache with optional TTL.

```typescript
// Store with 1 hour TTL
await cache.set('ciApp:tenant1:User:123', userProfile, 3600);

// Store permanently
await cache.set('ciApp:tenant1:Settings', tenantSettings);
```

##### `getSet<T>(key: string, fetchFunction: () => Promise<T>, ttlSeconds: number): Promise<T>`

**Cache-aside pattern** with distributed locking to prevent thundering herd.

```typescript
const userProfile = await cache.getSet(
  CacheKeys.userProfile('tenant1', '123'),
  async () => {
    // This only runs if cache miss
    return await userService.getProfile('123');
  },
  CacheTTL.USER_DATA // 6 hours
);
```

##### `del(key: string): Promise<boolean>`

Deletes key from cache.

```typescript
await cache.del(CacheKeys.userProfile('tenant1', '123'));
```

##### `exists(key: string): Promise<boolean>`

Checks if key exists in cache.

```typescript
const hasCache = await cache.exists(CacheKeys.tenantSettings('tenant1'));
```

#### Advanced Methods

##### `deletePattern(pattern: string): Promise<number>`

Bulk delete keys matching pattern.

```typescript
// Clear all user data for tenant
await cache.deletePattern('ciApp:tenant1:User:*');

// Clear all content cache
await cache.deletePattern('ciApp:*:Content:*');
```

##### `getKeysPattern(pattern: string): Promise<string[]>`

Get all keys matching pattern.

```typescript
const userKeys = await cache.getKeysPattern('ciApp:tenant1:User:*');
```

##### `ttl(key: string): Promise<number>`

Get remaining TTL for key.

```typescript
const remainingTTL = await cache.ttl(CacheKeys.userSession('tenant1', 'sess123'));
// Returns: seconds remaining, -1 if no TTL, -2 if key doesn't exist
```

##### `expire(key: string, ttlSeconds: number): Promise<boolean>`

Set TTL for existing key.

```typescript
await cache.expire(CacheKeys.userSession('tenant1', 'sess123'), 1800);
```

## Cache Utilities

**Location**: `/libs/cache/cache-utils.ts`

### Configuration Management

#### `getCacheInstance(config?: Partial<CacheConfig>): UnifiedCache`

Factory function to get cache instance with optional config override.

```typescript
// Use default config
const cache = getCacheInstance();

// Override specific settings
const cache = getCacheInstance({
  host: 'redis-cluster.example.com',
  port: 6380,
  password: 'secret'
});
```

#### `getCacheConfig(): Partial<CacheConfig>`

Get environment-specific cache configuration.

```typescript
const config = getCacheConfig();
// Returns development, production, or testing config
```

#### `validateCacheConfig(config: Partial<CacheConfig>)`

Validate cache configuration.

```typescript
const { valid, errors } = validateCacheConfig({
  host: 'invalid-host',
  port: 99999
});

if (!valid) {
  console.error('Config errors:', errors);
}
```

### Cache Key Builders

#### `CacheKeys` Object

Standardized key builders following `ciApp:TenantId:Namespace:Identifier` pattern.

##### Authentication & Tokens

```typescript
// Global tokens (no tenant scope)
CacheKeys.initializerToken() 
// → 'ciApp:InitializerToken'

// Tenant-scoped tokens
CacheKeys.tenantAccessToken('tenant1')
// → 'ciApp:tenant1:Token:tenantAccessToken'

CacheKeys.userAccessToken('tenant1', 'user123')
// → 'ciApp:tenant1:Token:userAccessToken:user123'

CacheKeys.userRefreshToken('tenant1', 'user123')
// → 'ciApp:tenant1:Token:userRefreshToken:user123'
```

##### Tenant & User Data

```typescript
// Tenant settings
CacheKeys.tenantSettings('tenant1')
// → 'ciApp:tenant1:TenantSettings'

// User data
CacheKeys.userProfile('tenant1', 'user123')
// → 'ciApp:tenant1:User:user123'

CacheKeys.userPermissions('tenant1', 'user123')
// → 'ciApp:tenant1:UserPermissions:user123'

CacheKeys.tenantUsers('tenant1')
// → 'ciApp:tenant1:TenantUsers'
```

##### Application & Modules

```typescript
// App initialization
CacheKeys.appInitialize('core', 'tenant1')
// → 'ciApp:tenant1:App:Schema:core'

CacheKeys.appModules('core', 'tenant1')
// → 'ciApp:tenant1:App:Modules:core'

CacheKeys.appModule('core', 'tenant1', 'users')
// → 'ciApp:tenant1:App:Module:core:users'
```

##### Content Management

```typescript
// Pages
CacheKeys.page('tenant1', 'page123')
// → 'ciApp:tenant1:Content:Page:page123'

CacheKeys.pageBySlug('tenant1', 'about-us')
// → 'ciApp:tenant1:Content:Page:about-us'

CacheKeys.pageList('tenant1')
// → 'ciApp:tenant1:Content:Page:List:tenant1'

// Posts
CacheKeys.post('tenant1', 'post123')
// → 'ciApp:tenant1:Content:Post:post123'

CacheKeys.postBySlug('tenant1', 'my-article')
// → 'ciApp:tenant1:Content:Post:my-article'

CacheKeys.postCategory('tenant1', 'tech')
// → 'ciApp:tenant1:Content:Post:Category:tech'

CacheKeys.postCategories('tenant1')
// → 'ciApp:tenant1:Content:Post:Categories'
```

##### Sessions & Security

```typescript
// Session management
CacheKeys.userSession('tenant1', 'sess123')
// → 'ciApp:tenant1:Session:sess123'

CacheKeys.sessionLookup('sess123')
// → 'ciApp:SessionLookup:sess123' (global lookup)

// Security
CacheKeys.csrfToken('tenant1', 'sess123')
// → 'ciApp:tenant1:CSRF:sess123'

CacheKeys.rateLimitUser('tenant1', 'user123')
// → 'ciApp:tenant1:RateLimit:User:user123'

CacheKeys.rateLimitIP('tenant1', '192.168.1.1')
// → 'ciApp:tenant1:RateLimit:IP:192.168.1.1'
```

##### API & Analytics

```typescript
// API response cache
CacheKeys.apiResponse('tenant1', '/api/users', 'page=1')
// → 'ciApp:tenant1:API:/api/users:page=1'

// Analytics
CacheKeys.analytics('tenant1', 'pageviews', 'daily')
// → 'ciApp:tenant1:Analytics:pageviews:daily'

// Custom keys
CacheKeys.custom('tenant1', 'feature', 'settings')
// → 'ciApp:tenant1:feature:settings'

CacheKeys.globalCustom('health', 'status')
// → 'ciApp:health:status'
```

### TTL Constants

#### `CacheTTL` Object

Predefined TTL values in seconds for different data types.

```typescript
// Short-term cache (5 minutes)
CacheTTL.SHORT = 300

// Medium-term cache (1 hour)  
CacheTTL.MEDIUM = 3600

// Long-term cache (24 hours)
CacheTTL.LONG = 86400

// Specific use cases
CacheTTL.SESSION = 1800      // 30 minutes
CacheTTL.TOKEN = 3540        // 59 minutes (safety margin)
CacheTTL.USER_DATA = 21600   // 6 hours
CacheTTL.TENANT_SETTINGS = 43200  // 12 hours
CacheTTL.CONTENT = 7200      // 2 hours
CacheTTL.API_RESPONSE = 900  // 15 minutes

// Rate limiting
CacheTTL.RATE_LIMIT_SHORT = 60    // 1 minute
CacheTTL.RATE_LIMIT_MEDIUM = 300  // 5 minutes
CacheTTL.RATE_LIMIT_LONG = 3600   // 1 hour
```

### Environment Presets

#### `CachePresets` Object

Environment-specific configurations.

```typescript
// Development
CachePresets.development = {
  enableLogging: true,
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  commandTimeout: 3000
}

// Production
CachePresets.production = {
  enableLogging: false,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000
}

// Testing
CachePresets.testing = {
  enableLogging: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  commandTimeout: 1000
}
```

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# Connection settings (optional)
REDIS_URL=redis://user:password@host:port/db
```

### Connection Options

```typescript
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db: number;
  keyPrefix?: string;
  lazyConnect?: boolean;
  enableLogging: boolean;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  connectTimeout: number;
  commandTimeout: number;
  url?: string; // Full Redis URL support
}
```

## Usage Patterns

### 1. Basic Caching

```typescript
import { getCacheInstance, CacheKeys, CacheTTL } from '@repo/cache';

const cache = getCacheInstance();

// Store user profile
await cache.set(
  CacheKeys.userProfile('tenant1', 'user123'),
  userProfile,
  CacheTTL.USER_DATA
);

// Retrieve user profile
const profile = await cache.get<UserProfile>(
  CacheKeys.userProfile('tenant1', 'user123')
);
```

### 2. Cache-Aside Pattern

```typescript
async function getUserProfile(tenantId: string, userId: string): Promise<UserProfile> {
  return await cache.getSet(
    CacheKeys.userProfile(tenantId, userId),
    async () => {
      // Only called on cache miss
      console.log('Fetching user profile from database');
      return await userService.getProfile(userId);
    },
    CacheTTL.USER_DATA
  );
}
```

### 3. Bulk Operations

```typescript
// Clear all user data for tenant
await cache.deletePattern(`ciApp:tenant1:User:*`);

// Get all session keys
const sessionKeys = await cache.getKeysPattern(`ciApp:tenant1:Session:*`);

// Check if any sessions exist
const hasSessions = sessionKeys.length > 0;
```

### 4. Session Management

```typescript
// Store session
await cache.set(
  CacheKeys.userSession(tenantId, sessionId),
  sessionData,
  CacheTTL.SESSION
);

// Store global session lookup
await cache.set(
  CacheKeys.sessionLookup(sessionId),
  tenantId,
  CacheTTL.SESSION
);

// Find tenant by session
const tenantId = await cache.get<string>(
  CacheKeys.sessionLookup(sessionId)
);
```

### 5. Content Caching

```typescript
import { StandardCacheStrategy } from '@repo/post/strategies/cache-strategy';

const cacheStrategy = new StandardCacheStrategy();

// Clear specific post cache
await cacheStrategy.clearPostCache('tenant1', 'my-article');

// Clear all posts for tenant
await cacheStrategy.clearPostCache('tenant1');
```

### 6. Rate Limiting

```typescript
// Check rate limit
const rateLimitKey = CacheKeys.rateLimitUser(tenantId, userId);
const currentCount = await cache.get<number>(rateLimitKey) || 0;

if (currentCount >= RATE_LIMIT) {
  throw new Error('Rate limit exceeded');
}

// Increment counter
await cache.set(rateLimitKey, currentCount + 1, CacheTTL.RATE_LIMIT_MEDIUM);
```

### 7. API Response Caching

```typescript
async function getCachedApiResponse<T>(
  tenantId: string, 
  endpoint: string, 
  params: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return await cache.getSet(
    CacheKeys.apiResponse(tenantId, endpoint, params),
    fetchFn,
    CacheTTL.API_RESPONSE
  );
}
```

## Performance Features

### 1. Request-Level Caching

The cache automatically prevents duplicate requests using internal locking:

```typescript
// Multiple concurrent calls return the same promise
const [result1, result2, result3] = await Promise.all([
  cache.getSet(key, fetchFn, ttl),
  cache.getSet(key, fetchFn, ttl),  // Uses existing promise
  cache.getSet(key, fetchFn, ttl)   // Uses existing promise
]);
// fetchFn is only called once
```

### 2. Automatic Serialization

JSON serialization/deserialization is handled automatically:

```typescript
// Objects are automatically serialized
await cache.set('key', { name: 'John', age: 30 });

// And deserialized on retrieval
const user = await cache.get<{name: string, age: number}>('key');
```

### 3. Connection Management

- **Lazy Connection**: Connects only when needed
- **Auto-Reconnect**: Handles connection failures gracefully
- **Connection Pooling**: Efficient connection reuse

### 4. Error Handling

All cache operations include comprehensive error handling:

```typescript
// Cache operations never throw - return null/false on error
const value = await cache.get('key'); // null if error or not found
const success = await cache.set('key', 'value'); // false if error
```

## Monitoring & Health

### Cache Statistics

```typescript
const stats = await cache.getStats();
console.log({
  connected: stats.connected,
  totalKeys: stats.totalKeys,
  memoryUsage: stats.memoryUsage,
  hitRatio: stats.hits / (stats.hits + stats.misses),
  hits: stats.hits,
  misses: stats.misses
});
```

### Health Check

```typescript
const health = await cache.healthCheck();
if (health.healthy) {
  console.log(`Redis healthy, latency: ${health.latency}ms`);
} else {
  console.error('Redis health check failed');
}
```

### Debug Logging

For tenant access tokens and other sensitive operations, detailed logging is available:

```typescript
// Debug output for token operations
💾 [Cache] Setting key: ciApp:tenant1:Token:tenantAccessToken -> Redis key: ciApp:tenant1:Token:tenantAccessToken -> TTL: 3540s
💾 [Cache] Verification: key ciApp:tenant1:Token:tenantAccessToken STORED
🔍 [Cache] Getting key: ciApp:tenant1:Token:tenantAccessToken -> Redis key: ciApp:tenant1:Token:tenantAccessToken -> Value: FOUND
```

## Security Considerations

### 1. Tenant Isolation

- All tenant data is scoped with tenant ID in keys
- Cross-tenant data access is prevented by key structure
- Global keys are explicitly marked (InitializerToken, SessionLookup)

### 2. Key Structure Security

```typescript
// Secure: Tenant-scoped
CacheKeys.userProfile('tenant1', 'user123')
// → 'ciApp:tenant1:User:user123'

// Secure: Global but explicit
CacheKeys.sessionLookup('session123') 
// → 'ciApp:SessionLookup:session123'
```

### 3. TTL Management

- All sensitive data has appropriate TTL
- Session data expires automatically
- Token data has safety margins (59min vs 60min token expiry)

### 4. Pattern-Based Operations

Bulk operations are scoped to prevent accidental cross-tenant access:

```typescript
// Safe: Only affects tenant1
await cache.deletePattern('ciApp:tenant1:*');

// Dangerous: Affects all tenants (use with caution)
await cache.deletePattern('ciApp:*');
```

## Migration & Maintenance

### Cache Invalidation Strategy

```typescript
// Clear related caches when data changes
async function updateUserProfile(tenantId: string, userId: string, profile: UserProfile) {
  // Update database
  await userService.updateProfile(userId, profile);
  
  // Invalidate caches
  await cache.del(CacheKeys.userProfile(tenantId, userId));
  await cache.del(CacheKeys.userPermissions(tenantId, userId));
  await cache.deletePattern(`ciApp:${tenantId}:API:*`); // Clear API caches
}
```

### Cache Warming

```typescript
// Pre-populate frequently accessed data
async function warmCache(tenantId: string) {
  const tenantSettings = await getTenantSettings(tenantId); // Uses cache-aside
  const userList = await getTenantUsers(tenantId);          // Uses cache-aside
  
  console.log(`Cache warmed for tenant ${tenantId}`);
}
```

### Testing Support

```typescript
// Clear cache in tests
beforeEach(async () => {
  const cache = getCacheInstance();
  await cache.clear(); // Clear entire cache database
});
```

This Redis cache system provides a robust, tenant-aware caching layer with comprehensive utilities, security features, and performance optimizations for multi-tenant applications.