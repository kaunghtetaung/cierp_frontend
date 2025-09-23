/**
 * Tenant ID Request Interceptor
 * Ensures every API request includes the x-tenant-id header
 */

import { getValidTenantId } from '../utils/tenant-resolver';
import { MIDDLEWARE_HEADERS } from '@repo/utils/common/constants';
import type { RequestInterceptor, HttpRequestContext } from '../types/http-types';

export class TenantRequestInterceptor implements RequestInterceptor {
  async intercept(context: HttpRequestContext): Promise<HttpRequestContext> {
    console.log("\n🔐 === TENANT INTERCEPTOR START ===");
    console.log("🔐 Request URL:", context.url);
    console.log("🔐 Request Method:", context.method);
    
    // Check if tenant ID is already in headers
    const existingTenantId = context.headers[MIDDLEWARE_HEADERS.TENANT_ID];
    
    if (existingTenantId) {
      // Tenant ID already present, just validate it
      console.log(`🔐 Tenant ID already in headers: ${existingTenantId}`);
      console.log("🔐 === TENANT INTERCEPTOR END (EXISTING) ===\n");
      return context;
    }

    // Check if tenantId is passed in the config
    const configTenantId = (context.config as any)?.tenantId;
    if (configTenantId) {
      console.log(`🔐 Tenant ID from config: ${configTenantId}`);
      console.log("🔐 Adding to headers");
      console.log("🔐 === TENANT INTERCEPTOR END (CONFIG) ===\n");
      return {
        ...context,
        headers: {
          ...context.headers,
          [MIDDLEWARE_HEADERS.TENANT_ID]: configTenantId,
        },
      };
    }

    // Resolve tenant ID from available sources
    console.log("🔐 No tenant ID found, attempting to resolve...");
    const tenantId = await getValidTenantId();
    
    if (tenantId) {
      console.log(`🔐 Resolved tenant ID: ${tenantId}`);
      console.log("🔐 === TENANT INTERCEPTOR END (RESOLVED) ===\n");
      
      return {
        ...context,
        headers: {
          ...context.headers,
          [MIDDLEWARE_HEADERS.TENANT_ID]: tenantId,
        },
      };
    }

    // Critical: No tenant ID could be resolved
    console.error('🔐 CRITICAL: Cannot resolve tenant ID for API request', {
      url: context.url,
      method: context.method,
      headers: context.headers,
    });
    console.log("🔐 === TENANT INTERCEPTOR END (ERROR) ===\n");

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