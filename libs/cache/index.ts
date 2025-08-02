// Main exports from cache package
export { UnifiedCache } from './unified-cache';
export {
  getCacheInstance,
  resetCacheInstance,
  createCacheInstance,
  CacheKeys,
  CacheTTL,
  CachePresets,
  getCacheConfig,
  validateCacheConfig
} from './cache-utils';
export type {
  CacheConfig,
  CacheOptions,
  CacheSetOptions,
  CacheMetadata,
  CacheStats,
  CacheInstance,
  CacheSerializationFn,
  CacheDeserializationFn
} from './types';

// Default export for convenience
export { getCacheInstance as default } from './cache-utils';