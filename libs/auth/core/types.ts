// Simplified Auth Types - Much cleaner than before!

// Re-export core types from individual modules
export type { 
  TokenData, 
  StoredToken 
} from './tokens';

// Re-export session types from your established patterns
export type { 
  SessionData, 
  SessionConfig,
  SessionValidationResult,
  SessionContext,
  SessionCreateOptions,
  SessionError
} from '@repo/security/types/session-types';

export type { 
  OIDCConfig, 
  TokenResponse 
} from './oidc';

// User types (from the existing types system)
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  tenantId: string;
  expiresAt: Date | string | number;
  createdAt: Date | string | number;
  lastActivityAt: Date | string | number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticationResult {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  tenantId: string | null;
  error: string | null;
}

// Auth context for middleware and components
export interface AuthContext {
  user: User | null;
  session: SessionData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenantId: string | null;
}

// Auth options for configuration
export interface AuthOptions {
  enableAuth?: boolean;
  sessionConfig?: Partial<SessionConfig>;
  autoRefresh?: boolean;
  refreshThreshold?: number;
}

// Common auth errors
export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TENANT_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'INVALID_TOKEN'
  | 'REFRESH_FAILED';

export interface AuthErrorInfo {
  type: AuthError;
  message: string;
  statusCode?: number;
}

// Request context for auth functions
export interface RequestContext {
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Auth middleware data
export interface AuthMiddlewareData {
  user?: User;
  session?: SessionData;
  tenantId?: string;
  isAuthenticated: boolean;
}