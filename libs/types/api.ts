// Enhanced API types with strict type safety
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  readonly data: T;
  readonly message: string;
  readonly success: boolean;
  readonly error?: string;
  readonly timestamp: Date;
}

export interface ApiError {
  readonly message: string;
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
  };
}

export interface ApiPaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: "asc" | "desc";
  readonly search?: string;
}

export interface ApiFilters {
  readonly [key: string]: string | number | boolean | undefined;
}

export interface HttpClientConfig {
  readonly baseURL: string;
  readonly timeout: number;
  readonly headers: Record<string, string>;
  readonly withCredentials: boolean;
}

export interface ApiEndpoints {
  readonly auth: {
    readonly login: string;
    readonly logout: string;
    readonly refresh: string;
    readonly session: string;
  };
  readonly user: {
    readonly profile: string;
    readonly update: string;
  };
  readonly tenant: {
    readonly initialize: string;
    readonly settings: string;
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  readonly method: HttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: string | FormData;
  readonly params?: Record<string, string | number | boolean>;
  readonly timeout?: number;
}

export interface ApiRequestConfig extends RequestOptions {
  readonly endpoint: string;
  readonly tenantId?: string;
  readonly userSessionId?: string;
  readonly userId?: string;
  readonly withAuth?: boolean;
  readonly language?: string;
}

export interface TokenRefreshResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}