// Main exports from api package - client-safe only
// For server-side exports, use '@repo/api/server-only'

// Client-safe type exports only
export type { ApiResponse } from '@repo/types';
export type { HttpMethod, ApiRequestConfig } from '@repo/types';

// Export error handling utilities (client-safe)
export * from './messages/error-messages';

// Export HTTP client creation function
export { createHttpClient } from './clients/client';
export type { HttpClient } from './clients/client';

// Export cached HTTP client creation function (for server-side usage)
export { createCachedHttpClient } from './clients/cached-client';

// Server-side API utilities (import only on server-side)
export type { ServerApiClient, ServerApiConfig, ServerApiError } from './server/server';

// API endpoint helpers
export function createApiUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  // Handle server-side context
  if (typeof window === 'undefined') {
    const fullUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    if (params) {
      const url = new URL(fullUrl, 'http://localhost');
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
      return url.toString();
    }
    
    return fullUrl;
  }
  
  // Client-side
  const url = new URL(`${baseUrl}${endpoint}`, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  
  return url.toString();
}

// Response type helpers
export function isApiError(response: any): response is { success: false; error: string } {
  return response && response.success === false && typeof response.error === 'string';
}

export function isApiSuccess<T>(response: any): response is { success: true; data: T } {
  return response && response.success === true && response.data !== undefined;
}

// Environment helpers
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}