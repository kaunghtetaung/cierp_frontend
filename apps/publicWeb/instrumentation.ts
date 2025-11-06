/**
 * Next.js Instrumentation
 *
 * This file is used to run code once when the server starts.
 * It's perfect for initializing monitoring, tracing, or other
 * setup that needs to happen before the application starts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import {
  monitoringSetup,
  type MonitoringConfig,
} from '@repo/utils/monitoring';

// Configuration for monitoring setup
const monitoringConfig: MonitoringConfig = {
  serviceName: process.env.SERVICE_NAME || 'publicWeb',
  environment: process.env.NODE_ENV || 'development',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  enableTracing: process.env.ENABLE_TRACING === 'true',
  logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
};

export async function register() {
  // Only run instrumentation in Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize config service and log status
    const { initializeConfigWithLogging } = await import('@repo/config');
    await initializeConfigWithLogging();

    // Initialize monitoring
    await monitoringSetup(monitoringConfig);
  }
}
