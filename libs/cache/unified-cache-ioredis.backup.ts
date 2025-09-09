// Enhanced UnifiedCache with Redis integration
import Redis from 'ioredis';
import type {
  CacheConfig,
  CacheOptions,
  CacheSetOptions,
  CacheMetadata,
  CacheStats
} from './types';

export class UnifiedCache {
  private static instance: UnifiedCache;
  private redis: Redis;
  private keyPrefix: string;
  private lockMap = new Map<string, Promise<any>>();
  private hitCount = 0;
  private missCount = 0;

  private constructor(config: CacheConfig) {
    this.keyPrefix = config.keyPrefix || "";
    
    
    const redisOptions: any = {
      host: config.host,
      port: config.port,
      db: config.db || 0,
      lazyConnect: true, // Use lazy connect to prevent blocking
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1, // Reduce retries to avoid spam
      enableReadyCheck: false, // Disable ready check to prevent hanging
      reconnectOnError: (err: Error) => {
        // Don't reconnect on auth errors
        const targetError = 'NOAUTH';
        if (err.message.includes(targetError)) {
          return false;
        }
        return true;
      }
    };

    // For Redis 6+ with ACL, use username if provided
    // Otherwise use legacy auth with just password
    // NOTE: Currently using legacy auth - username is ignored even if provided
    if (config.password) {
      // Legacy mode - just password (for default user)
      redisOptions.password = config.password;
      console.log('🔐 Redis: Using legacy auth (password only)');
      if (config.username) {
        console.log(`⚠️ Redis: Username "${config.username}" provided but not used (Redis using legacy auth)`);
      }
    } else {
      console.log('🔐 Redis: No authentication configured');
    }

    this.redis = new Redis(redisOptions);

    // Manually connect to handle errors gracefully
    this.redis.connect().catch((error) => {
      console.error("Redis initial connection failed:", error.message);
      // Continue without Redis - operations will fail gracefully
    });

    this.redis.on("error", (error) => {
      // Log but don't crash on Redis errors
      if (!error.message.includes('NOAUTH')) {
        console.error("Redis connection error:", error.message);
      }
    });

    this.redis.on("connect", () => {
      console.log("Redis connected successfully");
    });

    this.redis.on("ready", () => {
      console.log("Redis ready for commands");
    });
  }

  static getInstance(config?: CacheConfig): UnifiedCache {
    if (!UnifiedCache.instance) {
      if (!config) {
        throw new Error(
          "UnifiedCache config is required for first initialization"
        );
      }
      UnifiedCache.instance = new UnifiedCache(config);
    }
    return UnifiedCache.instance;
  }

  private getKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  /**
   * Get value from cache with built-in timeout protection
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redisKey = this.getKey(key);
      
      // Create a timeout promise that rejects after 2 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Redis GET timeout for key: ${key}`));
        }, 2000); // 2 second timeout for Redis operations
      });
      
      // Race between Redis operation and timeout
      const value = await Promise.race([
        this.redis.get(redisKey),
        timeoutPromise
      ]).catch((error) => {
        console.warn(`[Cache] Redis GET failed or timed out for ${key}:`, error.message);
        return null;
      });
      
      if (key.includes('tenantAccessToken')) {
        console.log(`🔍 [Cache] Getting key: ${key} -> Redis key: ${redisKey} -> Value: ${value ? 'FOUND' : 'NULL'}`);
      }
      
      if (value === null) {
        this.missCount++;
        return null;
      }

      this.hitCount++;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // If JSON parsing fails, return as string
        return value as T;
      }
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      this.missCount++;
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const redisKey = this.getKey(key);
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (key.includes('tenantAccessToken')) {
        console.log(`💾 [Cache] Setting key: ${key} -> Redis key: ${redisKey} -> TTL: ${ttlSeconds}s`);
      }
      
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.setex(redisKey, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(redisKey, serializedValue);
      }
      
      if (key.includes('tenantAccessToken')) {
        // Verify it was set
        const verifyValue = await this.redis.get(redisKey);
        console.log(`💾 [Cache] Verification: key ${key} ${verifyValue ? 'STORED' : 'NOT STORED'}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Cache-aside pattern: get value or compute and cache if not exists
   */
  async getSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 3600,
    _options: CacheSetOptions<T> = {}
  ): Promise<T> {
    try {
      if (key.includes('tenantAccessToken')) {
        console.log(`🔄 [Cache] getSet for key: ${key} with TTL: ${ttlSeconds}s`);
      }
      
      // Try to get from cache first
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        if (key.includes('tenantAccessToken')) {
          console.log(`🔄 [Cache] Found cached value for key: ${key}`);
        }
        return cachedValue;
      }

      // Check if another request is already fetching this key
      const existingPromise = this.lockMap.get(key);
      if (existingPromise) {
        if (key.includes('tenantAccessToken')) {
          console.log(`🔄 [Cache] Using existing promise for key: ${key}`);
        }
        return await existingPromise;
      }

      // Create new fetch promise and store it in lockMap
      const fetchPromise = (async () => {
        try {
          if (key.includes('tenantAccessToken')) {
            console.log(`🔄 [Cache] Fetching fresh value for key: ${key}`);
          }
          
          // Double-check cache after acquiring lock
          const secondCachedValue = await this.get<T>(key);
          if (secondCachedValue !== null) {
            if (key.includes('tenantAccessToken')) {
              console.log(`🔄 [Cache] Found cached value on second check for key: ${key}`);
            }
            return secondCachedValue;
          }

          // If not in cache, fetch from source
          const freshValue = await fetchFunction();

          if (key.includes('tenantAccessToken')) {
            console.log(`🔄 [Cache] Fetched fresh value for key: ${key}, storing in cache`);
          }

          // Store in cache
          await this.set(key, freshValue, ttlSeconds);

          return freshValue;
        } finally {
          // Always clean up the lock
          this.lockMap.delete(key);
        }
      })();

      this.lockMap.set(key, fetchPromise);
      return await fetchPromise;
    } catch (error) {
      console.error(`[Cache] Error in getSet for key ${key}:`, error);
      // Clean up lock on error
      this.lockMap.delete(key);
      throw error;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.getKey(key));
    } catch (error) {
      console.error(`[Cache] Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(this.getKey(key), ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error setting TTL for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get keys matching pattern
   */
  async getKeysPattern(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error(`[Cache] Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.redis.del(...keys);
    } catch (error) {
      console.error(`[Cache] Error deleting keys with pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.hitCount = 0;
      this.missCount = 0;
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsage = this.parseMemoryUsage(info);
      const totalKeys = await this.redis.dbsize();
      
      return {
        connected: this.redis.status === 'ready',
        totalKeys,
        memoryUsage,
        hits: this.hitCount,
        misses: this.missCount
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return {
        connected: false,
        totalKeys: 0,
        memoryUsage: 0,
        hits: this.hitCount,
        misses: this.missCount
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { healthy: true, latency };
    } catch (error) {
      console.error('[Cache] Health check failed:', error);
      return { healthy: false };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('[Cache] Error disconnecting:', error);
    }
  }

  /**
   * Get Redis instance for advanced operations
   */
  getRedisInstance(): Redis {
    return this.redis;
  }


  /**
   * Parse memory usage from Redis info
   */
  private parseMemoryUsage(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}