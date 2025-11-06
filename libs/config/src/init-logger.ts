/**
 * Config Service Initialization Logger
 *
 * Logs config service status during app startup
 */

import { configClient } from './config-client';

/**
 * Initialize config client and log the result
 * Call this early in your app startup (e.g., in instrumentation.ts or layout.tsx)
 */
export async function initializeConfigWithLogging(): Promise<void> {
  const appName = process.env.CONFIG_SERVICE_APP_NAME || 'unknown';
  const environment = process.env.CONFIG_SERVICE_ENVIRONMENT || process.env.NODE_ENV || 'development';
  const hotReloadEnabled = process.env.ENABLE_CONFIG_HOT_RELOAD === 'true';

  // Use console.error to ensure output is visible in dev server logs
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('🔧 Config Service Initialization');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`📦 App: ${appName}`);
  console.error(`🌍 Environment: ${environment}`);
  console.error(`🔄 Hot-reload: ${hotReloadEnabled ? 'ENABLED' : 'DISABLED'}`);

  if (!hotReloadEnabled) {
    console.error('📝 Using local environment variables only');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  const serviceUrl = process.env.CONFIG_SERVICE_URL || 'http://config:3330';
  console.error(`📍 Config Service: ${serviceUrl}`);
  console.error('');

  try {
    // Initialize the config client
    await configClient.initialize();

    if (configClient.isLoaded()) {
      const lastFetch = new Date(configClient.getLastFetchTime()).toISOString();
      const allConfig = await configClient.getAll();
      const configKeys = allConfig ? Object.keys(allConfig) : [];

      console.error('✅ Config loaded successfully from config service');
      console.error(`📊 Loaded ${configKeys.length} config sections: ${configKeys.join(', ')}`);
      console.error(`🕒 Fetched at: ${lastFetch}`);
      console.error(`🔄 Next refresh: 5 minutes`);

      // Log sample values (without sensitive data)
      if (allConfig) {
        console.error('');
        console.error('📝 Sample Config Values:');
        if (allConfig.redis) {
          console.error(`   Redis: ${allConfig.redis.host}:${allConfig.redis.port}`);
        }
        if (allConfig.minio?.internal) {
          console.error(`   MinIO: ${allConfig.minio.internal.endpoint}:${allConfig.minio.internal.port}`);
        }
        if (allConfig.server) {
          console.error(`   Server Port: ${allConfig.server.port}`);
        }
      }
    } else {
      console.error('⚠️  Config service unavailable, using fallback values');
      console.error('📝 Using environment variables from .env file');
    }
  } catch (error) {
    console.error('❌ Config service initialization error:', error instanceof Error ? error.message : error);
    console.error('📝 Falling back to environment variables');
  }

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
}

/**
 * Log config service status without blocking
 * Use this for non-critical logging
 */
export function logConfigServiceStatus(): void {
  // Run async but don't await
  initializeConfigWithLogging().catch(error => {
    console.error('Failed to log config service status:', error);
  });
}
