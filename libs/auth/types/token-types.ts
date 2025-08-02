// Token management types and constants - SOLID refactoring
export type TokenType =
  | "initializerToken"
  | "tenantAccessToken"
  | "userAccessToken"
  | "userRefreshToken";

export interface TokenData {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
  readonly scope?: string;
  readonly refresh_token?: string;
}

export interface TokenMetadata {
  readonly expiresAt: number;
  readonly tokenType: TokenType;
  readonly tenantId?: string;
  readonly userId?: string;
}

export interface OIDCConfig {
  readonly authDomain: string;
  readonly apiDomain: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

// Token management constants - extracted from magic numbers
export const TOKEN_CONSTANTS = {
  // TTL values (in seconds)
  DEFAULT_TOKEN_TTL: 3600, // 1 hour
  REFRESH_TOKEN_TTL: 7 * 24 * 3600, // 7 days
  TOKEN_TTL: 3540, // 59 minutes (safety margin)
  
  // Refresh thresholds
  DEFAULT_REFRESH_THRESHOLD_MINUTES: 5,
  SAFETY_MARGIN_SECONDS: 300, // 5 minutes
  
  // Retry configuration
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,
  
  // Timeout configuration
  TOKEN_REQUEST_TIMEOUT_MS: 10000,
} as const;

// Token strategy interface following Strategy pattern
export interface TokenStrategy {
  getToken(tenantId?: string, userId?: string): Promise<string | null>;
  refreshToken?(tenantId: string, userId?: string): Promise<string | null>;
  clearToken(tenantId?: string, userId?: string): Promise<void>;
}

// OIDC client interface for dependency injection
export interface OIDCClient {
  fetchToken(endpoint: string, params: Record<string, string>): Promise<TokenData>;
  refreshUserToken(refreshToken: string): Promise<TokenData>;
  getAuthDomain(): Promise<string>;
  getApiDomain(): Promise<string>;
}

// Cache interface for dependency injection
export interface TokenCache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<number>;
  ttl(key: string): Promise<number>;
}

// Token validation result
export interface TokenValidationResult {
  isValid: boolean;
  token?: string;
  expiresIn?: number;
  needsRefresh: boolean;
}