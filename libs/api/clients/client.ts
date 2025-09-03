// Refactored HTTP Client - SOLID principles implementation
// Single Responsibility: Coordinate HTTP strategies and interceptors
// Open/Closed: Extensible via strategy and interceptor injection
// Dependency Inversion: Depends on abstractions (interfaces), not concretions

import type { 
  HttpClientConfig,
  HttpRequestContext,
  HttpResponseContext,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  UrlBuilder,
  HeaderBuilder,
  ResponseHandler,
  RetryStrategy,
  HttpExecutor,
} from '../types/http-types';
import { HTTP_CONSTANTS } from '../types/http-types';
import type { ApiResponse, HttpMethod, ApiRequestConfig } from "@repo/types";

// Strategy implementations
import { StandardUrlBuilder } from '../builders/url-builder';
import { StandardHeaderBuilder } from '../builders/header-builder';
import { StandardResponseHandler } from '../handlers/response-handler';
import { StandardRetryStrategy } from '../handlers/retry-strategy';
import { StandardHttpExecutor } from '../executors/http-executor';

// Interceptor implementations
import { ValidationRequestInterceptor } from '../interceptors/validation-interceptor';
import { TenantRequestInterceptor } from '../interceptors/tenant-interceptor';
import { AuthResponseInterceptor } from '../interceptors/auth-interceptor';
import { GlobalErrorInterceptor } from '../interceptors/error-interceptor';

const DEFAULT_CONFIG: HttpClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: HTTP_CONSTANTS.DEFAULT_TIMEOUT,
  withCredentials: true,
  retryAttempts: HTTP_CONSTANTS.DEFAULT_RETRY_ATTEMPTS,
  retryDelay: HTTP_CONSTANTS.DEFAULT_RETRY_DELAY,
  enableCSRF: true,
  enableAuth: true,
};

/**
 * Refactored HTTP Client using Strategy Pattern and Interceptor Architecture
 * 
 * Responsibilities:
 * 1. Coordinate HTTP strategies (URL building, headers, response handling)
 * 2. Manage request/response interceptor pipeline
 * 3. Provide unified HTTP API
 */
export class HttpClient {
  private config: HttpClientConfig;
  
  // Strategy instances - following Dependency Injection principle
  private urlBuilder: UrlBuilder;
  private headerBuilder: StandardHeaderBuilder;
  private responseHandler: ResponseHandler;
  private retryStrategy: RetryStrategy;
  private httpExecutor: HttpExecutor;
  
  // Interceptor pipelines
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize strategies with injected dependencies
    this.urlBuilder = new StandardUrlBuilder(this.config);
    this.headerBuilder = new StandardHeaderBuilder(this.config);
    this.responseHandler = new StandardResponseHandler();
    this.retryStrategy = new StandardRetryStrategy(this.config);
    this.httpExecutor = new StandardHttpExecutor(this.config, this.retryStrategy);
    
    // Setup default interceptors
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    try {
      // Request interceptors (order matters!)
      // 1. Tenant ID interceptor (must be first to ensure tenant context)
      this.addRequestInterceptor(new TenantRequestInterceptor());
      
      // 2. Validation interceptor
      if (ValidationRequestInterceptor) {
        this.addRequestInterceptor(new ValidationRequestInterceptor());
      }
      
      // Response interceptors
      if (AuthResponseInterceptor) {
        this.addResponseInterceptor(new AuthResponseInterceptor(this.config.enableAuth));
      }
      
      // Error interceptors
      if (GlobalErrorInterceptor) {
        this.addErrorInterceptor(new GlobalErrorInterceptor());
      }
    } catch (error) {
      console.warn('Failed to setup interceptors:', error);
      // Continue without interceptors rather than failing completely
    }
  }

  // ===== INTERCEPTOR MANAGEMENT =====
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // ===== CORE HTTP METHODS =====
  async request<T>(
    endpoint: string,
    options: Partial<ApiRequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      params,
      timeout = this.config.timeout,
      ...configOptions
    } = options;

    try {
      // Build URL
      const url = this.urlBuilder.buildUrl(endpoint, params);

      // Build headers
      const requestHeaders = await this.headerBuilder.buildHeaders(
        method,
        headers,
        { ...configOptions, ...options } as ApiRequestConfig
      );

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: this.config.withCredentials ? "include" : "omit",
        signal: AbortSignal.timeout(timeout),
      };

      // Add body for non-GET requests
      if (body && method !== "GET") {
        if (body instanceof FormData) {
          requestOptions.body = body;
        } else {
          requestOptions.body = JSON.stringify(body);
          requestHeaders["Content-Type"] = HTTP_CONSTANTS.CONTENT_TYPE_JSON;
        }
      }

      // Create request context
      let requestContext: HttpRequestContext = {
        url,
        method,
        headers: requestHeaders,
        body,
        options: requestOptions,
        config: { ...configOptions, ...options } as ApiRequestConfig
      };

      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        requestContext = await interceptor.intercept(requestContext);
      }

      // Execute HTTP request
      let responseContext = await this.httpExecutor.execute<T>(requestContext);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        responseContext = await interceptor.intercept(responseContext);
      }

      // Handle response or error
      if (responseContext.error) {
        // Apply error interceptors
        for (const interceptor of this.errorInterceptors) {
          responseContext = await interceptor.intercept(responseContext);
        }
        
        // If still has error after interceptors, handle it
        if (responseContext.error) {
          return this.responseHandler.handleError<T>(responseContext.error);
        }
      }

      // Handle successful response
      return await this.responseHandler.handleResponse<T>(responseContext.response);
    } catch (error) {
      return this.responseHandler.handleError<T>(error);
    }
  }

  // ===== CONVENIENCE HTTP METHODS =====
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body });
  }

  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }

  // ===== CONFIGURATION AND UTILITIES =====
  getConfig(): Readonly<HttpClientConfig> {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate strategies with new config
    this.urlBuilder = new StandardUrlBuilder(this.config);
    this.headerBuilder = new StandardHeaderBuilder(this.config);
    this.retryStrategy = new StandardRetryStrategy(this.config);
    this.httpExecutor = new StandardHttpExecutor(this.config, this.retryStrategy);
  }

  /**
   * Set CSRF token
   */
  setCSRFToken(token: string | null): void {
    this.headerBuilder.setCSRFToken(token);
  }

  /**
   * Clear tokens
   */
  clearTokens(): void {
    this.headerBuilder.clearCSRFToken();
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

/**
 * Create custom HTTP client
 */
export function createHttpClient(
  config: Partial<HttpClientConfig> = {}
): HttpClient {
  return new HttpClient(config);
}