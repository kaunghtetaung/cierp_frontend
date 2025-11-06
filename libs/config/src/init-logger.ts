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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Config Service Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 App: ${appName}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔄 Hot-reload: ${hotReloadEnabled ? 'ENABLED' : 'DISABLED'}`);

  if (!hotReloadEnabled) {
    console.log('📝 Using local environment variables only');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  const serviceUrl = process.env.CONFIG_SERVICE_URL || 'http://config:3330';
  console.log(`📍 Config Service: ${serviceUrl}`);
  console.log('');

  try {
    // Initialize the config client
    await configClient.initialize();

    if (configClient.isLoaded()) {
      const lastFetch = new Date(configClient.getLastFetchTime()).toISOString();
      const allConfig = await configClient.getAll();
      const configKeys = allConfig ? Object.keys(allConfig) : [];

      console.log('✅ Config loaded successfully from config service');
      console.log(`📊 Loaded ${configKeys.length} config sections: ${configKeys.join(', ')}`);
      console.log(`🕒 Fetched at: ${lastFetch}`);
      console.log(`🔄 Next refresh: 5 minutes`);

      // Log sample values (without sensitive data)
      if (allConfig) {
        console.log('');
        console.log('📝 Sample Config Values:');
        if (allConfig.redis) {
          console.log(`   Redis: ${allConfig.redis.host}:${allConfig.redis.port}`);
        }
        if (allConfig.minio?.internal) {
          console.log(`   MinIO: ${allConfig.minio.internal.endpoint}:${allConfig.minio.internal.port}`);
        }
        if (allConfig.server) {
          console.log(`   Server Port: ${allConfig.server.port}`);
        }
      }
    } else {
      console.log('⚠️  Config service unavailable, using fallback values');
      console.log('📝 Using environment variables from .env file');
    }
  } catch (error) {
    console.error('❌ Config service initialization error:', error instanceof Error ? error.message : error);
    console.log('📝 Falling back to environment variables');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
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
