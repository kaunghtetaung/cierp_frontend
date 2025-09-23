// Authenticated API client for server actions in core app
'use server'

import { getCurrentUser, getCurrentSession, TokenManager } from '@repo/auth/server-api';
import { getCurrentTenantForServer } from '@repo/tenant/server';
import type { ApiResponse } from '@repo/types';

/**
 * Make an authenticated API request from server actions
 * Automatically includes user access token in the Authorization header
 */
export async function authenticatedFetch<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  try {
    // Get current user and tenant from server context
    const [user, session, tenant] = await Promise.all([
      getCurrentUser(),
      getCurrentSession(),
      getCurrentTenantForServer()
    ]);

    if (!user || !session) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      };
    }

    if (!tenant) {
      return {
        success: false,
        error: 'Tenant context required',
        statusCode: 400
      };
    }

    // Get user access token using TokenManager
    const tokenManager = TokenManager.getInstance();
    const token = await tokenManager.getTokenForRequest(tenant.id, user.id);

    if (!token) {
      return {
        success: false,
        error: 'Failed to get access token',
        statusCode: 401
      };
    }

    // Build full URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_GATEWAY_URL || 'http://localhost:3331';
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Make the request with authentication
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenant.id,
        'x-user-id': user.id,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Request failed with status ${response.status}`,
        statusCode: response.status
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      statusCode: response.status
    };

  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
      statusCode: 500
    };
  }
}

/**
 * Helper functions for common HTTP methods
 */
export const apiClient = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) => 
    authenticatedFetch<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    authenticatedFetch<T>(endpoint, { method: 'POST', body, headers }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    authenticatedFetch<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    authenticatedFetch<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    authenticatedFetch<T>(endpoint, { method: 'DELETE', headers })
};