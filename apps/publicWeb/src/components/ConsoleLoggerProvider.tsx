'use client';

/**
 * Console Logger Provider - Initializes client-side console capture
 *
 * This component initializes the console logger to capture browser console.log
 * calls and send them to the server for Loki ingestion.
 */

import { useEffect } from 'react';
import { initializeConsoleLogger, destroyConsoleLogger } from '@repo/utils/client/console-logger';

export function ConsoleLoggerProvider() {
  useEffect(() => {
    // Only initialize in production or if explicitly enabled
    const shouldEnable =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGGER === 'true';

    if (!shouldEnable) {
      return;
    }

    // Initialize console logger
    initializeConsoleLogger({
      endpoint: '/api/logs',
      batchSize: 10,                   // Send after 10 logs
      batchInterval: 5000,             // Or after 5 seconds
      includeMetadata: true,           // Include tenant/user context
      enableInDevelopment: false,      // Disabled in dev by default
      onError: (error) => {
        // Silently fail - don't break the app
        console.error('Console logger error:', error);
      }
    });

    console.log('✅ Console logger initialized');

    // Cleanup on unmount
    return () => {
      destroyConsoleLogger();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
