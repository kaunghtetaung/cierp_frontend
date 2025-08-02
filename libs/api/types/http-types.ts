// HTTP Client types and interfaces - SOLID refactoring
import type { ApiResponse, HttpMethod, ApiRequestConfig } from "@repo/types";

export interface HttpClientConfig {
  readonly baseURL: string;
  readonly timeout: number;
  readonly withCredentials: boolean;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly enableCSRF: boolean;
  readonly enableAuth: boolean;
}

export interface HttpRequestContext {
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers: Record<string, string>;
  readonly body?: any;
  readonly options: RequestInit;
  readonly config: ApiRequestConfig;
  metadata?: Record<string, any>;
}

export interface HttpResponseContext<T = any> {
  readonly request: HttpRequestContext;
  readonly response: Response;
  readonly data?: T;
  readonly error?: Error;
}

// Interceptor interfaces following Strategy Pattern
export interface RequestInterceptor {
  intercept(context: HttpRequestContext): Promise<HttpRequestContext>;
}

export interface ResponseInterceptor {
  intercept<T>(context: HttpResponseContext<T>): Promise<HttpResponseContext<T>>;
}

export interface ErrorInterceptor {
  intercept<T>(context: HttpResponseContext<T>): Promise<HttpResponseContext<T>>;
}

// Core HTTP operations strategy
export interface HttpExecutor {
  execute<T>(context: HttpRequestContext): Promise<HttpResponseContext<T>>;
}

// URL building strategy
export interface UrlBuilder {
  buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string;
}

// Header building strategy
export interface HeaderBuilder {
  buildHeaders(
    method: HttpMethod,
    customHeaders: Record<string, string>,
    config: ApiRequestConfig
  ): Promise<Record<string, string>>;
}

// Response handling strategy
export interface ResponseHandler {
  handleResponse<T>(response: Response): Promise<ApiResponse<T>>;
  handleError<T>(error: unknown): ApiResponse<T>;
}

// Retry strategy
export interface RetryStrategy {
  shouldRetry(error: unknown, attempt: number): boolean;
  getDelay(attempt: number): number;
}

// Constants for configuration
export const HTTP_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_ATTEMPTS: 5,
  CONTENT_TYPE_JSON: "application/json",
  UNSAFE_HTTP_METHODS: ["POST", "PUT", "PATCH", "DELETE"],
} as const;