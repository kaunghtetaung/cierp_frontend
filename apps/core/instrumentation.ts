/**
 * Next.js Instrumentation Hook
 *
 * This file is loaded before any other server code.
 * Perfect for initializing console wrapper for JSON logging.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and initialize console wrapper
    const { consoleWrapper } = await import('@repo/utils/server/console-wrapper');

    // Console wrapper auto-initializes if LOG_FORMAT=json
    // This ensures all console.log calls output JSON format in production
    console.log('Instrumentation: Console wrapper loaded for', process.env.NODE_ENV);
  }
}
