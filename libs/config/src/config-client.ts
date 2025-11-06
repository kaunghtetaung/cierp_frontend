/**
 * Config Service Client for Next.js Applications
 *
 * Features:
 * - Hot-reload configuration from centralized config service
 * - Fallback to environment variables
 * - Periodic refresh (5 minutes default)
 * - Type-safe configuration access
 * - Singleton pattern for server-side usage
 * - Graceful error handling
 *
 * Usage:
 * ```typescript
 * import { configClient } from '@repo/config';
 *
 * // In Server Components, API Routes, or Server Actions
 * const redisHost = await configClient.get('redis.host', process.env.REDIS_HOST);
 * const cacheTtl = await configClient.get('redis.ttl.default', 3600);
 * ```
 */

import { cache } from 'react';

interface ConfigClientOptions {
  /** Enable hot-reload from config service */
  enableHotReload?: boolean;
  /** Config service URL */
  serviceUrl?: string;
  /** App name in config service */
  appName?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retryAttempts?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
}

interface ConfigResponse {
  success: boolean;
  appName: string;
  environment: string;
  config: Record<string, any>;
  timestamp: string;
}

/**
 * Config Service Client
 * Singleton instance for server-side configuration management
 */
class ConfigServiceClient {
  private config: Record<string, any> | null = null;
  private options: Required<ConfigClientOptions>;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<void> | null = null;

  constructor(options: ConfigClientOptions = {}) {
    this.options = {
      enableHotReload: options.enableHotReload ?? process.env.ENABLE_CONFIG_HOT_RELOAD === 'true',
      serviceUrl: options.serviceUrl ?? process.env.CONFIG_SERVICE_URL ?? 'http://config:3330',
      appName: options.appName ?? process.env.CONFIG_SERVICE_APP_NAME ?? 'publicWeb',
      environment: options.environment ?? process.env.CONFIG_SERVICE_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
      refreshInterval: options.refreshInterval ?? (Number(process.env.CONFIG_REFRESH_INTERVAL) || 300000), // 5 minutes
      timeout: options.timeout ?? 10000, // 10 seconds
      retryAttempts: options.retryAttempts ?? (Number(process.env.CONFIG_RETRY_ATTEMPTS) || 3),
      retryDelay: options.retryDelay ?? (Number(process.env.CONFIG_RETRY_DELAY) || 5000),
      debug: options.debug ?? process.env.CONFIG_DEBUG === 'true',
    };

    this.log('ConfigServiceClient initialized', { options: this.options });
  }

  /**
   * Initialize the config client and load configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.log('Initializing config client');

    if (!this.options.enableHotReload) {
      this.log('Hot-reload disabled, using environment variables only');
      this.isInitialized = true;
      return;
    }

    // Load initial config
    await this.loadConfig();

    // Start periodic refresh
    this.startPeriodicRefresh();

    this.isInitialized = true;
    this.log('Config client initialized successfully', {
      configLoaded: this.config !== null,
    });
  }

  /**
   * Load configuration from config service
   */
  private async loadConfig(): Promise<void> {
    // Prevent concurrent fetches
    if (this.fetchPromise) {
      await this.fetchPromise;
      return;
    }

    this.fetchPromise = this._loadConfigInternal();
    try {
      await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async _loadConfigInternal(): Promise<void> {
    const url = `${this.options.serviceUrl}/config/${this.options.appName}?environment=${this.options.environment}`;

    this.log('Fetching config from service', { url });

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          next: { revalidate: 0 }, // Don't cache this request
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: ConfigResponse = await response.json();

        if (data.success && data.config) {
          this.config = data.config;
          this.lastFetchTime = Date.now();
          this.log('✅ Config loaded successfully', {
            timestamp: data.timestamp,
            keysCount: Object.keys(data.config).length,
          });
          return;
        } else {
          throw new Error('Invalid response format from config service');
        }
      } catch (error) {
        const isLastAttempt = attempt === this.options.retryAttempts;

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            this.log(`⚠️ Config fetch timeout (attempt ${attempt}/${this.options.retryAttempts})`);
          } else {
            this.log(`⚠️ Config fetch failed (attempt ${attempt}/${this.options.retryAttempts}): ${error.message}`);
          }
        }

        if (isLastAttempt) {
          this.log('❌ All config fetch attempts failed, falling back to environment variables');
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      }
    }
  }

  /**
   * Start periodic config refresh
   */
  private startPeriodicRefresh(): void {
    if (!this.options.enableHotReload || this.refreshTimer) return;

    this.refreshTimer = setInterval(() => {
      this.log('Periodic config refresh triggered');
      this.loadConfig().catch(error => {
        this.log('Periodic refresh failed:', error);
      });
    }, this.options.refreshInterval);

    // Cleanup on process exit
    if (typeof process !== 'undefined') {
      const cleanup = () => {
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
          this.refreshTimer = null;
        }
      };

      process.once('SIGINT', cleanup);
      process.once('SIGTERM', cleanup);
    }
  }

  /**
   * Get configuration value by path with fallback
   *
   * @param path - Dot-notation path (e.g., 'database.url', 's3.bucket')
   * @param fallback - Fallback value if path not found
   * @returns Configuration value or fallback
   *
   * @example
   * ```typescript
   * const dbUrl = await configClient.get('database.url', process.env.DATABASE_URL);
   * const maxConnections = await configClient.get('database.maxConnections', 10);
   * ```
   */
  async get<T = any>(path: string, fallback: T): Promise<T> {
    // Initialize if not already done
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If hot-reload disabled or config not loaded, return fallback
    if (!this.options.enableHotReload || !this.config) {
      return fallback;
    }

    // Navigate nested config using dot notation
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        this.log(`Config path not found: ${path}, using fallback`);
        return fallback;
      }
    }

    return value !== undefined ? value : fallback;
  }

  /**
   * Get entire configuration object
   * Returns null if not loaded
   */
  async getAll(): Promise<Record<string, any> | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.config;
  }

  /**
   * Check if config is loaded from service
   */
  isLoaded(): boolean {
    return this.config !== null;
  }

  /**
   * Get last fetch timestamp
   */
  getLastFetchTime(): number {
    return this.lastFetchTime;
  }

  /**
   * Force reload configuration from service
   */
  async reload(): Promise<void> {
    if (!this.options.enableHotReload) {
      this.log('Hot-reload disabled, cannot force reload');
      return;
    }

    this.log('Force reloading configuration');
    await this.loadConfig();
  }

  /**
   * Stop periodic refresh (useful for testing or cleanup)
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      this.log('Periodic refresh stopped');
    }
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (!this.options.debug) return;

    const timestamp = new Date().toISOString();
    const prefix = `[ConfigClient ${this.options.appName}]`;

    if (data) {
      console.log(`${timestamp} ${prefix} ${message}`, data);
    } else {
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: ConfigServiceClient | null = null;

/**
 * Get the singleton config client instance
 */
export function getConfigClient(options?: ConfigClientOptions): ConfigServiceClient {
  if (!clientInstance) {
    clientInstance = new ConfigServiceClient(options);
  }
  return clientInstance;
}

/**
 * Default config client instance
 * Use this in Server Components, API Routes, and Server Actions
 */
export const configClient = getConfigClient();

// ============================================================================
// React Cache Helper
// ============================================================================

/**
 * Cached config getter for React Server Components
 * This ensures config is fetched only once per request
 *
 * @example
 * ```typescript
 * import { getCachedConfig } from '@repo/config';
 *
 * export default async function Page() {
 *   const dbUrl = await getCachedConfig('database.url', process.env.DATABASE_URL);
 *   return <div>Database: {dbUrl}</div>;
 * }
 * ```
 */
export const getCachedConfig = cache(async <T = any>(path: string, fallback: T): Promise<T> => {
  return configClient.get(path, fallback);
});

// ============================================================================
// Utility Types
// ============================================================================

export type { ConfigClientOptions, ConfigResponse };
export { ConfigServiceClient };
