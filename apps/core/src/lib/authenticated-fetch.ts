// Authenticated fetch utility function for server-side API calls
// This is NOT a server action, just a utility function
// Import this in wrapper functions or server actions as needed

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession, TokenManager } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
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
    // Get headers for tenant context
    const headerStore = await headers();
    let tenantId = headerStore.get('x-tenant-id') || undefined;

    // Get current user and session from server context
    const [user, session] = await Promise.all([
      getCurrentUser(headerStore),
      getCurrentSession(headerStore)
    ]);

    if (!user || !session) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      };
    }

    // Use tenant from user/session if not in headers
    tenantId = tenantId || user.tenantId || session.tenantId;

    if (!tenantId) {
      return {
        success: false,
        error: 'Tenant context required',
        statusCode: 400
      };
    }

    // Get user access token using TokenManager
    const tokenManager = TokenManager.getInstance();
    const token = await tokenManager.getTokenForRequest(tenantId, user.userId || user.id);

    if (!token) {
      return {
        success: false,
        error: 'Failed to get access token',
        statusCode: 401
      };
    }

    // Build full URL using getApiDomain (same as appModules wrapper)
    const apiUrl = await getApiDomain();
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Make the request with authentication
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'x-user-id': user.userId || user.id,
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
