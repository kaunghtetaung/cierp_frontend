/**
 * Tenant ID Request Interceptor
 * Ensures every API request includes the x-tenant-id header
 */

import { getValidTenantId } from '../utils/tenant-resolver';
import { MIDDLEWARE_HEADERS } from '@repo/utils/common/constants';
import type { RequestInterceptor, HttpRequestContext } from '../types/http-types';

export class TenantRequestInterceptor implements RequestInterceptor {
  async intercept(context: HttpRequestContext): Promise<HttpRequestContext> {
    // Check if tenant ID is already in headers
    const existingTenantId = context.headers[MIDDLEWARE_HEADERS.TENANT_ID];
    
    if (existingTenantId) {
      // Tenant ID already present, just validate it
      console.debug(`Request has tenant ID: ${existingTenantId}`);
      return context;
    }

    // Resolve tenant ID from available sources
    const tenantId = await getValidTenantId();
    
    if (tenantId) {
      console.debug(`Adding tenant ID to request: ${tenantId}`);
      
      return {
        ...context,
        headers: {
          ...context.headers,
          [MIDDLEWARE_HEADERS.TENANT_ID]: tenantId,
        },
      };
    }

    // Critical: No tenant ID could be resolved
    console.error('CRITICAL: Cannot resolve tenant ID for API request', {
      url: context.url,
      method: context.method,
      headers: context.headers,
    });

    // You might want to throw an error here to prevent the request
    // or allow it to continue and let the API gateway handle it
    
    // Option 1: Throw error to prevent request
    // throw new Error('Tenant ID is required for all API requests');
    
    // Option 2: Add a warning header and continue
    return {
      ...context,
      headers: {
        ...context.headers,
        'X-Warning': 'Missing tenant ID - request may fail',
      },
    };
  }
}

/**
 * Factory function to create tenant interceptor
 */
export function createTenantInterceptor(): TenantRequestInterceptor {
  return new TenantRequestInterceptor();
}