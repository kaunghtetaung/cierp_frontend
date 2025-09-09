// Enhanced UnifiedCache with native Redis client integration
import { createClient, RedisClientType } from 'redis';
import type {
  CacheConfig,
  CacheOptions,
  CacheSetOptions,
  CacheMetadata,
  CacheStats
} from './types';

export class UnifiedCache {
  private static instance: UnifiedCache;
  private redis: RedisClientType;
  private keyPrefix: string;
  private lockMap = new Map<string, Promise<any>>();
  private hitCount = 0;
  private missCount = 0;
  private connected = false;
  private connecting = false;
  private config: CacheConfig;

  private constructor(config: CacheConfig) {
    this.keyPrefix = config.keyPrefix || "";
    this.config = config;
    
    // Build Redis URL with proper authentication
    let redisUrl = 'redis://';
    if (config.password) {
      // Native redis client uses URL format for auth
      redisUrl += `:${config.password}@`;
      console.log('🔐 Redis: Using password authentication');
    }
    redisUrl += `${config.host || 'localhost'}:${config.port || 6379}`;
    if (config.db && config.db > 0) {
      redisUrl += `/${config.db}`;
    }

    // Create Redis client with proper error handling
    this.redis = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: config.connectTimeout || 5000,
        reconnectStrategy: (retries) => {
          if (retries > (config.maxRetriesPerRequest || 3)) {
            console.error('Redis: Max reconnection attempts reached');
            return false; // Stop reconnecting
          }
          // Exponential backoff with max 3 seconds
          return Math.min(retries * (config.retryDelayOnFailover || 100), 3000);
        }
      }
    }) as RedisClientType;

    // Set up event handlers
    this.redis.on('error', (error) => {
      // Log but don't crash on Redis errors
      if (!error.message.includes('NOAUTH') && config.enableLogging) {
        console.error('Redis connection error:', error.message);
      }
      this.connected = false;
    });

    this.redis.on('connect', () => {
      if (config.enableLogging) {
        console.log('Redis connected successfully');
      }
      this.connected = true;
    });

    this.redis.on('ready', () => {
      if (config.enableLogging) {
        console.log('Redis ready for commands');
      }
      this.connected = true;
    });

    this.redis.on('end', () => {
      if (config.enableLogging) {
        console.log('Redis connection closed');
      }
      this.connected = false;
    });

    // Initialize connection if not lazy
    if (!config.lazyConnect) {
      this.connect();
    }
  }

  /**
   * Connect to Redis (used for lazy connections)
   */
  private async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    
    this.connecting = true;
    try {
      await this.redis.connect();
      this.connected = true;
    } catch (error: any) {
      console.error("Redis initial connection failed:", error.message);
      // Continue without Redis - operations will fail gracefully
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Ensure Redis is connected before operations
   */
  private async ensureConnected(): Promise<boolean> {
    if (!this.connected && !this.connecting) {
      await this.connect();
    }
    // Wait a bit for connection if currently connecting
    if (this.connecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.connected;
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
      // Ensure connected
      if (!await this.ensureConnected()) {
        this.missCount++;
        return null;
      }

      const redisKey = this.getKey(key);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          if (this.config.enableLogging) {
            console.warn(`[Cache] Redis GET timeout for key: ${key}`);
          }
          resolve(null);
        }, this.config.commandTimeout || 2000);
      });
      
      // Race between Redis operation and timeout
      const value = await Promise.race([
        this.redis.get(redisKey),
        timeoutPromise
      ]);
      
      if (this.config.enableLogging && key.includes('tenantAccessToken')) {
        console.log(`🔍 [Cache] Getting key: ${key} -> Redis key: ${redisKey} -> Value: ${value ? 'FOUND' : 'NULL'}`);
      }
      
      if (value === null || value === undefined) {
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
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error getting key ${key}:`, error.message);
      }
      this.missCount++;
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      // Ensure connected
      if (!await this.ensureConnected()) {
        return false;
      }

      const redisKey = this.getKey(key);
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (this.config.enableLogging && key.includes('tenantAccessToken')) {
        console.log(`💾 [Cache] Setting key: ${key} -> Redis key: ${redisKey} -> TTL: ${ttlSeconds}s`);
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          if (this.config.enableLogging) {
            console.warn(`[Cache] Redis SET timeout for key: ${key}`);
          }
          resolve(false);
        }, this.config.commandTimeout || 2000);
      });

      // Set with or without TTL
      const setPromise = ttlSeconds && ttlSeconds > 0
        ? this.redis.setEx(redisKey, ttlSeconds, serializedValue)
        : this.redis.set(redisKey, serializedValue);

      const result = await Promise.race([
        setPromise.then(() => true),
        timeoutPromise
      ]);
      
      if (this.config.enableLogging && key.includes('tenantAccessToken')) {
        // Verify it was set
        const verifyValue = await this.redis.get(redisKey).catch(() => null);
        console.log(`💾 [Cache] Verification: key ${key} ${verifyValue ? 'STORED' : 'NOT STORED'}`);
      }
      
      return result;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error setting key ${key}:`, error.message);
      }
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
      if (this.config.enableLogging && key.includes('tenantAccessToken')) {
        console.log(`🔄 [Cache] getSet for key: ${key} with TTL: ${ttlSeconds}s`);
      }
      
      // Try to get from cache first
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        if (this.config.enableLogging && key.includes('tenantAccessToken')) {
          console.log(`🔄 [Cache] Found cached value for key: ${key}`);
        }
        return cachedValue;
      }

      // Check if another request is already fetching this key
      const existingPromise = this.lockMap.get(key);
      if (existingPromise) {
        if (this.config.enableLogging && key.includes('tenantAccessToken')) {
          console.log(`🔄 [Cache] Using existing promise for key: ${key}`);
        }
        return await existingPromise;
      }

      // Create new fetch promise and store it in lockMap
      const fetchPromise = (async () => {
        try {
          if (this.config.enableLogging && key.includes('tenantAccessToken')) {
            console.log(`🔄 [Cache] Fetching fresh value for key: ${key}`);
          }
          
          // Double-check cache after acquiring lock
          const secondCachedValue = await this.get<T>(key);
          if (secondCachedValue !== null) {
            if (this.config.enableLogging && key.includes('tenantAccessToken')) {
              console.log(`🔄 [Cache] Found cached value on second check for key: ${key}`);
            }
            return secondCachedValue;
          }

          // If not in cache, fetch from source
          const freshValue = await fetchFunction();

          if (this.config.enableLogging && key.includes('tenantAccessToken')) {
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
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error in getSet for key ${key}:`, error.message);
      }
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
      if (!await this.ensureConnected()) {
        return false;
      }

      const result = await this.redis.del(this.getKey(key));
      return result > 0;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error deleting key ${key}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!await this.ensureConnected()) {
        return false;
      }

      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error checking existence of key ${key}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!await this.ensureConnected()) {
        return -1;
      }

      return await this.redis.ttl(this.getKey(key));
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error getting TTL for key ${key}:`, error.message);
      }
      return -1;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!await this.ensureConnected()) {
        return false;
      }

      const result = await this.redis.expire(this.getKey(key), ttlSeconds);
      return result === 1;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error setting TTL for key ${key}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Get keys matching pattern
   */
  async getKeysPattern(pattern: string): Promise<string[]> {
    try {
      if (!await this.ensureConnected()) {
        return [];
      }

      return await this.redis.keys(pattern);
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error getting keys with pattern ${pattern}:`, error.message);
      }
      return [];
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      if (!await this.ensureConnected()) {
        return 0;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.redis.del(keys);
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`[Cache] Error deleting keys with pattern ${pattern}:`, error.message);
      }
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (!await this.ensureConnected()) {
        return;
      }

      await this.redis.flushDb();
      this.hitCount = 0;
      this.missCount = 0;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Cache] Error clearing cache:', error.message);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      if (!await this.ensureConnected()) {
        return {
          connected: false,
          totalKeys: 0,
          memoryUsage: 0,
          hits: this.hitCount,
          misses: this.missCount
        };
      }

      const info = await this.redis.info('memory');
      const memoryUsage = this.parseMemoryUsage(info);
      const totalKeys = await this.redis.dbSize();
      
      return {
        connected: this.connected,
        totalKeys,
        memoryUsage,
        hits: this.hitCount,
        misses: this.missCount
      };
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Cache] Error getting stats:', error.message);
      }
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
      if (!await this.ensureConnected()) {
        return { healthy: false };
      }

      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { healthy: true, latency };
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Cache] Health check failed:', error.message);
      }
      return { healthy: false };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.redis.quit();
        this.connected = false;
      }
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Cache] Error disconnecting:', error.message);
      }
    }
  }

  /**
   * Get Redis instance for advanced operations
   */
  getRedisInstance(): RedisClientType {
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