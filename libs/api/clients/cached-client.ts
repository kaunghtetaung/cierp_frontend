// Cached HTTP Client Factory - Using React cache() to fix circular dependency issues
// This ensures only one HTTP client instance is created per server request

import { cache } from 'react';
import { HttpClient } from './client';
import type { HttpClientConfig } from '../types/http-types';

/**
 * Creates a cached HTTP client instance using React's cache() function.
 * This prevents circular dependency issues that occur when creating multiple
 * HTTP client instances during React re-renders (e.g., dependent dropdowns).
 * 
 * The instance is cached per server request and automatically cleaned up.
 */
export const getCachedHttpClient = cache((config: Partial<HttpClientConfig> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏭 getCachedHttpClient: Creating new cached HTTP client instance with config:', {
      baseURL: config.baseURL,
      enableAuth: config.enableAuth,
      timeout: config.timeout
    });
  }
  
  return new HttpClient(config);
});

/**
 * Creates a cached HTTP client with default server-side configuration
 */
export const getCachedServerHttpClient = cache((baseURL: string) => {
  return getCachedHttpClient({
    baseURL,
    enableAuth: true,
    withCredentials: true,
    timeout: 30000 // 30 second timeout for server requests
  });
});

/**
 * For backwards compatibility - creates cached client with custom config
 */
export function createCachedHttpClient(config: Partial<HttpClientConfig> = {}): HttpClient {
  return getCachedHttpClient(config);
}