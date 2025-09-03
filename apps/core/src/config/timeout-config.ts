/**
 * Timeout Configuration for Microservice Requests
 * 
 * Different timeout values for different types of operations
 * to balance user experience with service reliability
 */

export const TIMEOUT_CONFIG = {
  // Server-side rendering timeouts (shorter to avoid blocking)
  SERVER: {
    // Quick data fetch for SSR
    FAST: 8000,      // 8 seconds
    // Standard data fetch for SSR  
    STANDARD: 15000, // 15 seconds
    // Maximum timeout for SSR (prevents infinite loading)
    MAX: 20000,      // 20 seconds
  },
  
  // Client-side request timeouts (can be longer)
  CLIENT: {
    // Quick operations (auth, small lists)
    FAST: 10000,     // 10 seconds
    // Standard operations (module lists, form submissions)
    STANDARD: 25000, // 25 seconds
    // Long operations (reports, bulk operations)
    LONG: 45000,     // 45 seconds
    // Maximum for any client request
    MAX: 60000,      // 60 seconds
  },
  
  // Retry configuration
  RETRY: {
    // Number of automatic retries for timeout errors
    MAX_ATTEMPTS: 3,
    // Base delay between retries (multiplied by attempt number)
    BASE_DELAY: 2000, // 2 seconds
    // Maximum delay between retries
    MAX_DELAY: 10000, // 10 seconds
  },
  
  // Auto-refresh intervals for failed requests
  AUTO_REFRESH: {
    // Quick retry for immediate timeout
    IMMEDIATE: 1000,  // 1 second
    // Standard retry interval
    STANDARD: 3000,   // 3 seconds
    // Long retry interval
    LONG: 10000,      // 10 seconds
  }
} as const

/**
 * Get timeout value based on operation type and context
 */
export function getTimeout(
  type: 'server' | 'client',
  operation: 'fast' | 'standard' | 'long' | 'max' = 'standard'
): number {
  const config = type === 'server' ? TIMEOUT_CONFIG.SERVER : TIMEOUT_CONFIG.CLIENT
  
  switch (operation) {
    case 'fast': return config.FAST
    case 'standard': return config.STANDARD
    case 'long': return config.LONG || config.STANDARD
    case 'max': return config.MAX
    default: return config.STANDARD
  }
}

/**
 * Get retry delay based on attempt number
 */
export function getRetryDelay(attemptNumber: number): number {
  const delay = TIMEOUT_CONFIG.RETRY.BASE_DELAY * attemptNumber
  return Math.min(delay, TIMEOUT_CONFIG.RETRY.MAX_DELAY)
}

/**
 * Check if error is timeout-related
 */
export function isTimeoutError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return message.includes('timeout') || 
         message.includes('timed out') ||
         message.includes('aborted') ||
         message.includes('request to microservice timed out')
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return message.includes('fetch') ||
         message.includes('network') ||
         message.includes('connection') ||
         message.includes('econnrefused') ||
         message.includes('enotfound')
}