// Cache type definitions
import type { Redis } from 'ioredis';

export interface CacheConfig {
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly username?: string;
  readonly db: number;
  readonly keyPrefix?: string;
  readonly lazyConnect?: boolean;
  readonly enableLogging: boolean;
  readonly maxRetriesPerRequest: number;
  readonly retryDelayOnFailover: number;
  readonly connectTimeout: number;
  readonly commandTimeout: number;
  readonly url?: string; // Support for full Redis URL
}

export interface CacheOptions {
  readonly ttl?: number;
  readonly refresh?: boolean;
}

export interface CacheSetOptions<T> {
  readonly serialize?: (value: T) => string;
  readonly deserialize?: (value: string) => T;
}

export interface CacheMetadata {
  readonly key: string;
  readonly ttl: number;
  readonly created: Date;
  readonly accessed: Date;
}

export interface CacheStats {
  readonly connected: boolean;
  readonly totalKeys: number;
  readonly memoryUsage: number;
  readonly hits: number;
  readonly misses: number;
}

export type CacheSerializationFn<T> = (value: T) => string;
export type CacheDeserializationFn<T> = (value: string) => T;

export interface CacheInstance {
  readonly redis: Redis;
  readonly config: CacheConfig;
}