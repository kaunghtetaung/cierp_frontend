/**
 * Environment utilities
 * Helper functions to check current environment
 */

/**
 * Check if the application is running in development mode
 * @returns true if NODE_ENV is 'development', false otherwise
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the application is running in production mode
 * @returns true if NODE_ENV is 'production', false otherwise
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if debug mode is enabled
 * Can be controlled via environment variable for fine-grained control
 * @returns true if debugging should be enabled
 */
export function isDebugEnabled(): boolean {
  // Enable debug if explicitly set to true, or if in development mode
  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
    return true;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'false') {
    return false;
  }

  // Default: enable in development, disable in production
  return isDevelopment();
}
