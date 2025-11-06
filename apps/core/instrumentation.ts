/**
 * Next.js Instrumentation Hook
 *
 * This file is called once when the Next.js server starts.
 * Perfect for initializing services like config service.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on Node.js runtime (not Edge)
    const { initializeConfigWithLogging } = await import('@repo/config');
    await initializeConfigWithLogging();
  }
}
