// Server-side API client for API gateway calls
import { getSafeHeaders } from '../../utils/server/headers-compat';
import type { ApiResponse, ApiError } from '@repo/types';
import { getApiEndpoint } from '../../utils/common/url';

export interface ServerApiConfig {
  readonly baseUrl?: string; // Optional - will use dynamic URL if not provided
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly apiKey?: string;
  readonly apiSecret?: string;
}

const DEFAULT_CONFIG: ServerApiConfig = {
  baseUrl: undefined, // Will use dynamic URL generation
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  apiKey: process.env.API_GATEWAY_KEY,
  apiSecret: process.env.API_GATEWAY_SECRET
};

export class ServerApiClient {
  private config: ServerApiConfig;

  constructor(config: Partial<ServerApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make server-side API request to gateway
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: unknown;
      headers?: Record<string, string>;
      tenantId?: string;
      timeout?: number;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      tenantId,
      timeout = this.config.timeout
    } = options;

    try {
      // Get tenant ID from headers if not provided
      let finalTenantId = tenantId;
      if (!finalTenantId) {
        try {
          const headerStore = await getSafeHeaders();
          finalTenantId = headerStore.get('x-tenant-id') || undefined;
        } catch {
          // Headers not available in this context
        }
      }

      // Build URL - use dynamic URL if baseUrl not configured
      let url: string;
      if (endpoint.startsWith('http')) {
        url = endpoint;
      } else {
        let baseUrl = this.config.baseUrl;
        
        // If no baseUrl configured, use dynamic URL generation
        if (!baseUrl) {
          try {
            const headerStore = await getSafeHeaders();
            const host = headerStore.get('host');
            const protocol = headerStore.get('x-forwarded-proto') || 'http';

            if (host) {
              const apiEndpoint = getApiEndpoint(host, protocol);
              baseUrl = apiEndpoint.fullUrl;
            } else {
              // For localhost, require API_GATEWAY_URL
              baseUrl = process.env.API_GATEWAY_URL;
              if (!baseUrl) {
                throw new Error('API_GATEWAY_URL environment variable is required for localhost');
              }
            }
          } catch (error) {
            // If headers not available, require API_GATEWAY_URL environment variable
            baseUrl = process.env.API_GATEWAY_URL;
            if (!baseUrl) {
              throw new Error('API_GATEWAY_URL environment variable is required when headers are not available');
            }
          }
        }
        
        url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      }

      // Build headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Server/1.0',
        ...customHeaders
      };

      // Add tenant ID
      if (finalTenantId) {
        requestHeaders['x-tenant-id'] = finalTenantId;
      }

      // Add API authentication
      if (this.config.apiKey) {
        requestHeaders['x-api-key'] = this.config.apiKey;
      }
      if (this.config.apiSecret) {
        requestHeaders['Authorization'] = `Bearer ${this.config.apiSecret}`;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: AbortSignal.timeout(timeout)
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          requestOptions.body = body;
          // Remove Content-Type to let browser set it with boundary
          delete requestHeaders['Content-Type'];
        } else {
          requestOptions.body = JSON.stringify(body);
        }
      }

      console.log(`🌐 API Gateway ${method} request:`, {
        url,
        tenantId: finalTenantId,
        hasBody: !!body
      });

      // Make request with retry logic
      const response = await this.makeRequestWithRetry(url, requestOptions);

      // Handle response
      return await this.handleResponse<T>(response);

    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, tenantId?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', tenantId });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, tenantId?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, tenantId });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, tenantId?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, tenantId });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, tenantId?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', tenantId });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, tenantId?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, tenantId });
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // Retry on network errors
      if (attempt < this.config.retryAttempts && this.isRetryableError(error)) {
        console.log(`⏳ Retrying API request (${attempt}/${this.config.retryAttempts}):`, url);
        await this.delay(this.config.retryDelay * attempt);
        return this.makeRequestWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = undefined;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
        } catch {
          // Ignore JSON parsing errors for error responses
        }
      }

      console.error('❌ API Gateway error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        message: errorMessage
      });

      throw new ServerApiError(errorMessage, 'HTTP_ERROR', response.status, errorDetails);
    }

    if (isJson) {
      const data = await response.json();
      console.log('✅ API Gateway success:', {
        url: response.url,
        status: response.status
      });
      
      return {
        data: data.data || data,
        message: data.message || 'Success',
        success: data.success !== false,
        timestamp: new Date()
      };
    }

    // For non-JSON responses
    const text = await response.text();
    return {
      data: text as any,
      message: 'Success',
      success: true,
      timestamp: new Date()
    };
  }

  /**
   * Handle request errors
   */
  private handleError<T>(error: unknown): ApiResponse<T> {
    if (error instanceof ServerApiError) {
      return {
        data: null as any,
        message: error.message,
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ API request failed:', message);
    
    return {
      data: null as any,
      message,
      success: false,
      error: message,
      timestamp: new Date()
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return false; // Timeout - don't retry
    }
    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Server API Error class
 */
export class ServerApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

/**
 * Default server API client instance
 */
export const serverApiClient = new ServerApiClient();

/**
 * Create custom server API client
 */
export function createServerApiClient(config: Partial<ServerApiConfig> = {}): ServerApiClient {
  return new ServerApiClient(config);
}

/**
 * Helper function to get user from API gateway
 */
export async function getUserFromApiGateway(
  userId: string,
  tenantId: string
): Promise<any | null> {
  try {
    const response = await serverApiClient.get(`/users/${encodeURIComponent(userId)}`, tenantId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user from API gateway:', error);
    return null;
  }
}

/**
 * Helper function to validate session with API gateway
 */
export async function validateSessionWithApiGateway(
  sessionId: string,
  tenantId: string
): Promise<{ valid: boolean; userId?: string; session?: any }> {
  try {
    const response = await serverApiClient.post('/auth/validate-session', {
      sessionId
    }, tenantId);
    
    if (response.success && response.data) {
      return {
        valid: true,
        userId: response.data.userId,
        session: response.data.session
      };
    }
    
    return { valid: false };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { valid: false };
  }
}