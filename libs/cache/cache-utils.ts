// Cache configuration and utilities
import { UnifiedCache } from './unified-cache';
import type { CacheConfig, CacheInstance } from './types';

// Default cache configuration following management panel pattern
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  username: process.env.REDIS_USERNAME, // Add username for Redis ACL
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: '',
  lazyConnect: true,
  enableLogging: process.env.NODE_ENV !== 'production',
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  connectTimeout: 10000,
  commandTimeout: 5000
};

/**
 * Get or create cache instance using singleton pattern
 */
export function getCacheInstance(config?: Partial<CacheConfig>): UnifiedCache {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  return UnifiedCache.getInstance(finalConfig);
}

/**
 * Reset cache instance (useful for testing)
 */
export function resetCacheInstance(): void {
  // Note: With singleton pattern, we need to handle reset differently
  // This is mainly for testing purposes
  console.warn('Cache instance reset not fully supported with singleton pattern');
}

/**
 * Create a new cache instance with custom config
 * Note: With singleton pattern, this returns the same instance with merged config
 */
export function createCacheInstance(config: Partial<CacheConfig> = {}): UnifiedCache {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  return UnifiedCache.getInstance(finalConfig);
}

/**
 * Cache key builders for consistent naming with ciApp:TenantId hierarchy
 */
export const CacheKeys = {
  // Global tokens (no tenant scope)
  initializerToken: () => 'ciApp:InitializerToken',
  
  // Tenant-scoped tokens
  tenantAccessToken: (tenantId: string) => `ciApp:${tenantId}:Token:tenantAccessToken`,
  userAccessToken: (tenantId: string, userId: string) => `ciApp:${tenantId}:Token:userAccessToken:${userId}`,
  userRefreshToken: (tenantId: string, userId: string) => `ciApp:${tenantId}:Token:userRefreshToken:${userId}`,
  
  // Tenant settings
  tenantSettings: (tenantId: string) => `ciApp:${tenantId}:TenantSettings`,
  
  // Content namespace - organized under Content
  contentSettings: (tenantId: string) => `ciApp:${tenantId}:Content:Settings:${tenantId}`,
  
  // App namespace - for application initialization and modules
  appInitialize: (appId: string, tenantId: string) => `ciApp:${tenantId}:App:Schema:${appId}`,
  appModules: (appId: string, tenantId: string) => `ciApp:${tenantId}:App:Modules:${appId}`,
  appModule: (appId: string, tenantId: string, moduleSlug: string) => `ciApp:${tenantId}:App:Module:${appId}:${moduleSlug}`,
  
  // Extra Action Forms
  extraActionForm: (tenantId: string, formName: string) => `ciApp:${tenantId}:ExtraActionForm:${formName}`,
  
  // Content:Page module
  page: (tenantId: string, pageId?: string) => 
    pageId ? `ciApp:${tenantId}:Content:Page:${pageId}` : `ciApp:${tenantId}:Content:Page`,
  pageBySlug: (tenantId: string, slug: string) => `ciApp:${tenantId}:Content:Page:${slug}`,
  pageSettings: (tenantId: string) => `ciApp:${tenantId}:Content:Page:Settings:${tenantId}`,
  pageList: (tenantId: string) => `ciApp:${tenantId}:Content:Page:List:${tenantId}`,
  
  // Content:Post module
  post: (tenantId: string, postId?: string) => 
    postId ? `ciApp:${tenantId}:Content:Post:${postId}` : `ciApp:${tenantId}:Content:Post`,
  postBySlug: (tenantId: string, slug: string) => `ciApp:${tenantId}:Content:Post:${slug}`,
  postSettings: (tenantId: string) => `ciApp:${tenantId}:Content:Post:Settings:${tenantId}`,
  postList: (tenantId: string) => `ciApp:${tenantId}:Content:Post:List`,
  postCategory: (tenantId: string, slug: string) => `ciApp:${tenantId}:Content:Post:Category:${slug}`,
  postCategories: (tenantId: string) => `ciApp:${tenantId}:Content:Post:Categories`,
  postTag: (tenantId: string, slug: string) => `ciApp:${tenantId}:Content:Post:Tag:${slug}`,
  postTags: (tenantId: string) => `ciApp:${tenantId}:Content:Post:Tags`,
  
  // Session management - hybrid approach
  userSession: (tenantId: string, sessionId: string) => `ciApp:${tenantId}:Session:${sessionId}`,
  userSessions: (tenantId: string, userId: string) => `ciApp:${tenantId}:UserSession:${userId}`,
  sessionLookup: (sessionId: string) => `ciApp:SessionLookup:${sessionId}`, // Global lookup to find tenant
  
  // Tenant users
  tenantUsers: (tenantId: string) => `ciApp:${tenantId}:TenantUsers`,
  userProfile: (tenantId: string, userId: string) => `ciApp:${tenantId}:User:${userId}`,
  userPermissions: (tenantId: string, userId: string) => `ciApp:${tenantId}:UserPermissions:${userId}`,
  
  // Content management
  content: (tenantId: string, contentId: string) => `ciApp:${tenantId}:Content:${contentId}`,
  contentList: (tenantId: string, type?: string) => 
    type ? `ciApp:${tenantId}:ContentList:${type}` : `ciApp:${tenantId}:ContentList`,
  
  // API responses (tenant-scoped)
  apiResponse: (tenantId: string, endpoint: string, params?: string) => 
    params ? `ciApp:${tenantId}:API:${endpoint}:${params}` : `ciApp:${tenantId}:API:${endpoint}`,
  
  // Security (tenant-scoped)
  csrfToken: (tenantId: string, sessionId: string) => `ciApp:${tenantId}:CSRF:${sessionId}`,
  rateLimitUser: (tenantId: string, userId: string) => `ciApp:${tenantId}:RateLimit:User:${userId}`,
  rateLimitIP: (tenantId: string, ip: string) => `ciApp:${tenantId}:RateLimit:IP:${ip}`,
  
  // Analytics and metrics
  analytics: (tenantId: string, metric: string, period: string) => 
    `ciApp:${tenantId}:Analytics:${metric}:${period}`,
  
  // Lock keys for preventing race conditions
  lock: (tenantId: string, resource: string) => `ciApp:${tenantId}:Lock:${resource}`,
  
  // Health and monitoring (global)
  healthCheck: () => 'ciApp:HealthCheck:timestamp',
  
  // Custom key builder
  custom: (tenantId: string, ...parts: string[]) => `ciApp:${tenantId}:${parts.join(':')}`,
  
  // Global custom key builder (for non-tenant resources)
  globalCustom: (...parts: string[]) => `ciApp:${parts.join(':')}`
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  // Short-term cache (5 minutes)
  SHORT: 300,
  
  // Medium-term cache (1 hour)
  MEDIUM: 3600,
  
  // Long-term cache (24 hours)
  LONG: 86400,
  
  // Session cache (sliding, typically 30 minutes)
  SESSION: 1800,
  
  // Token cache (usually 59 minutes for safety margin)
  TOKEN: 3540,
  
  // User data cache (6 hours)
  USER_DATA: 21600,
  
  // Tenant settings cache (12 hours)
  TENANT_SETTINGS: 43200,
  
  // Content cache (2 hours)
  CONTENT: 7200,
  
  // API response cache (varies by endpoint, default 15 minutes)
  API_RESPONSE: 900,
  
  // Analytics cache (1 hour)
  ANALYTICS: 3600,
  
  // Rate limiting windows
  RATE_LIMIT_SHORT: 60,     // 1 minute
  RATE_LIMIT_MEDIUM: 300,   // 5 minutes
  RATE_LIMIT_LONG: 3600,    // 1 hour
  
  // Health check cache
  HEALTH_CHECK: 30
};

/**
 * Cache configuration presets
 */
export const CachePresets = {
  development: {
    enableLogging: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    commandTimeout: 3000
  } as Partial<CacheConfig>,
  
  production: {
    enableLogging: false,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    commandTimeout: 5000
  } as Partial<CacheConfig>,
  
  testing: {
    enableLogging: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    commandTimeout: 1000
  } as Partial<CacheConfig>
};

/**
 * Get cache configuration for current environment
 */
export function getCacheConfig(): Partial<CacheConfig> {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return CachePresets.production;
    case 'test':
      return CachePresets.testing;
    default:
      return CachePresets.development;
  }
}

/**
 * Validate cache configuration
 */
export function validateCacheConfig(config: Partial<CacheConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.host && typeof config.host !== 'string') {
    errors.push('Host must be a string');
  }
  
  if (config.port && (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)) {
    errors.push('Port must be an integer between 1 and 65535');
  }
  
  if (config.db && (!Number.isInteger(config.db) || config.db < 0)) {
    errors.push('Database number must be a non-negative integer');
  }
  
  if (config.connectTimeout && (!Number.isInteger(config.connectTimeout) || config.connectTimeout < 1000)) {
    errors.push('Connect timeout must be at least 1000ms');
  }
  
  if (config.commandTimeout && (!Number.isInteger(config.commandTimeout) || config.commandTimeout < 1000)) {
    errors.push('Command timeout must be at least 1000ms');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}