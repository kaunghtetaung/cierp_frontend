/**
 * @repo/config
 * Configuration management library for Next.js applications
 *
 * Features:
 * - Hot-reload from centralized config service
 * - Type-safe configuration access
 * - Environment variable fallback
 * - React Server Component support
 */

export {
  configClient,
  getConfigClient,
  getCachedConfig,
  ConfigServiceClient,
} from './config-client';

export type {
  ConfigClientOptions,
  ConfigResponse,
} from './config-client';

export {
  initializeConfigWithLogging,
  logConfigServiceStatus,
} from './init-logger';
