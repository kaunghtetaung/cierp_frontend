// HTTP Client Usage Examples - Practical demonstrations

import { httpClient, createHttpClient } from '../clients/client';
import type { TenantSettingsDto, ApiResponse } from '@repo/types';

/**
 * Example 1: Successful API call with proper error handling
 */
export async function exampleSuccessfulTenantFetch(tenantId: string): Promise<void> {
  try {
    const response: ApiResponse<TenantSettingsDto> = await httpClient.get(
      '/tenant/settings',
      { id: tenantId }
    );

    if (response.success) {
      console.log('✅ SUCCESS:', {
        data: response.data,
        message: response.message,
        timestamp: response.timestamp
      });
      
      // Example response:
      // {
      //   data: {
      //     id: "tenant123",
      //     name: "Crystal Image Corp",
      //     isActive: true,
      //     domains: ["crystal-image.com"]
      //   },
      //   message: "Tenant settings retrieved successfully",
      //   timestamp: "2024-01-15T10:30:00Z"
      // }
    } else {
      console.error('❌ API ERROR:', {
        error: response.error,
        message: response.message,
        timestamp: response.timestamp
      });
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
  }
}

/**
 * Example 2: Error handling for tenant not found
 */
export async function exampleTenantNotFound(): Promise<void> {
  try {
    const response: ApiResponse<TenantSettingsDto> = await httpClient.get(
      '/tenant/settings',
      { id: 'nonexistent-tenant' }
    );

    // This will be false and contain error details
    if (!response.success) {
      console.error('❌ TENANT NOT FOUND:', {
        error: response.error,        // "Tenant nonexistent-tenant not found"
        message: response.message,    // "Tenant nonexistent-tenant not found"
        success: response.success,    // false
        data: response.data,          // null
        timestamp: response.timestamp
      });
    }
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
}

/**
 * Example 3: Domain resolution with success/error handling
 */
export async function exampleDomainResolution(domain: string): Promise<void> {
  const apiClient = createHttpClient({
    baseURL: 'https://api.tenant.com:3331',
    enableAuth: true,
    enableCSRF: false
  });

  try {
    const response: ApiResponse<{ id: string; tenantId: string }> = await apiClient.get(
      '/tenant/initialize',
      { host: domain }
    );

    if (response.success) {
      console.log('✅ DOMAIN RESOLVED:', {
        tenantId: response.data.id || response.data.tenantId,
        domain: domain,
        message: response.message,
        timestamp: response.timestamp
      });

      // Example success response:
      // {
      //   data: { id: "tenant123", tenantId: "tenant123" },
      //   message: "Tenant resolved successfully",
      //   success: true,
      //   timestamp: "2024-01-15T10:30:00Z"
      // }
    } else {
      console.error('❌ DOMAIN NOT FOUND:', {
        domain: domain,
        error: response.error,        // "No tenant found for domain"
        message: response.message,    // "No tenant found for domain: unknown.com"
        success: response.success,    // false
        timestamp: response.timestamp
      });
    }
  } catch (error) {
    console.error('❌ DOMAIN RESOLUTION ERROR:', error);
  }
}

/**
 * Example 4: Token request with authentication
 */
export async function exampleTokenRequest(): Promise<void> {
  const authClient = createHttpClient({
    baseURL: 'https://auth.tenant.com:3332',
    enableAuth: false,  // No auth for token requests
    enableCSRF: false
  });

  try {
    const response: ApiResponse<{ access_token: string; expires_in: number }> = await authClient.post(
      '/oidc/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'tenant:read'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from('client_id:client_secret').toString('base64')
        }
      }
    );

    if (response.success) {
      console.log('✅ TOKEN RECEIVED:', {
        hasToken: !!response.data.access_token,
        expiresIn: response.data.expires_in,
        message: response.message,
        timestamp: response.timestamp
      });

      // Example success response:
      // {
      //   data: {
      //     access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      //     expires_in: 3600,
      //     token_type: "Bearer"
      //   },
      //   message: "Token generated successfully",
      //   success: true,
      //   timestamp: "2024-01-15T10:30:00Z"
      // }
    } else {
      console.error('❌ TOKEN REQUEST FAILED:', {
        error: response.error,        // "Invalid client credentials"
        message: response.message,    // "Invalid client credentials"
        success: response.success,    // false
        timestamp: response.timestamp
      });
    }
  } catch (error) {
    console.error('❌ TOKEN REQUEST ERROR:', error);
  }
}

/**
 * Example 5: POST request with validation error handling
 */
export async function examplePostWithValidation(): Promise<void> {
  try {
    const response: ApiResponse<{ id: string }> = await httpClient.post(
      '/tenant/create',
      {
        name: '', // Invalid - empty name
        domain: 'invalid-domain'
      }
    );

    if (response.success) {
      console.log('✅ TENANT CREATED:', {
        tenantId: response.data.id,
        message: response.message,
        timestamp: response.timestamp
      });
    } else {
      console.error('❌ VALIDATION ERROR:', {
        error: response.error,        // "Validation failed"
        message: response.message,    // "Validation failed"
        success: response.success,    // false
        timestamp: response.timestamp
      });

      // Example validation error response:
      // {
      //   data: null,
      //   message: "Validation failed",
      //   success: false,
      //   error: "HTTP 400: Bad Request - Name is required, Invalid domain format",
      //   timestamp: "2024-01-15T10:30:00Z"
      // }
    }
  } catch (error) {
    console.error('❌ POST REQUEST ERROR:', error);
  }
}

/**
 * Example 6: Network/timeout error handling
 */
export async function exampleNetworkError(): Promise<void> {
  const slowClient = createHttpClient({
    baseURL: 'https://slow-api.example.com',
    timeout: 1000, // 1 second timeout
    enableAuth: false
  });

  try {
    const response: ApiResponse<any> = await slowClient.get('/slow-endpoint');

    if (!response.success) {
      console.error('❌ NETWORK/TIMEOUT ERROR:', {
        error: response.error,        // "AbortError: The operation was aborted"
        message: response.message,    // "Request timeout"
        success: response.success,    // false
        timestamp: response.timestamp
      });
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
  }
}

/**
 * Example 7: Service-level error handling pattern
 */
export class ExampleService {
  private httpClient = createHttpClient({
    baseURL: 'https://api.tenant.com:3331',
    enableAuth: true,
    enableCSRF: false
  });

  async getTenantSettings(tenantId: string): Promise<TenantSettingsDto> {
    const response: ApiResponse<TenantSettingsDto> = await this.httpClient.get(
      '/tenant/settings',
      { id: tenantId }
    );

    // Service throws error if API call fails
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch tenant settings');
    }

    // Service returns only the data on success
    return response.data;
  }

  async handleTenantRequest(tenantId: string): Promise<void> {
    try {
      const tenant = await this.getTenantSettings(tenantId);
      
      console.log('✅ SERVICE SUCCESS:', {
        tenantId: tenant.id,
        tenantName: tenant.name,
        isActive: tenant.isActive
      });
    } catch (error) {
      console.error('❌ SERVICE ERROR:', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Service-level error handling
      // - Log error details
      // - Maybe retry
      // - Return default values
      // - Show user-friendly message
    }
  }
}

/**
 * Usage examples for different scenarios
 */
export async function runExamples(): Promise<void> {
  console.log('=== HTTP Client Response Examples ===\n');

  // 1. Successful request
  await exampleSuccessfulTenantFetch('tenant123');
  
  // 2. Not found error
  await exampleTenantNotFound();
  
  // 3. Domain resolution
  await exampleDomainResolution('crystal-image.com');
  await exampleDomainResolution('unknown-domain.com');
  
  // 4. Token request
  await exampleTokenRequest();
  
  // 5. Validation error
  await examplePostWithValidation();
  
  // 6. Network error
  await exampleNetworkError();
  
  // 7. Service-level handling
  const service = new ExampleService();
  await service.handleTenantRequest('tenant123');
  await service.handleTenantRequest('nonexistent');
}