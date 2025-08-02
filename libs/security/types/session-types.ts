// Session management types and interfaces - SOLID refactoring
export interface SessionConfig {
  readonly maxAge: number; // in seconds
  readonly renewThreshold: number; // in seconds
  readonly maxSessions: number;
  readonly requireHttps: boolean;
  readonly trackActivity: boolean;
  readonly ipValidation: boolean;
  readonly userAgentValidation: boolean;
}

export interface SessionData {
  readonly sessionId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly lastActivityAt: Date;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SessionValidationResult {
  readonly valid: boolean;
  readonly session?: SessionData;
  readonly error?: SessionError;
  readonly shouldRenew?: boolean;
}

export interface SessionError {
  readonly type: 'expired' | 'invalid' | 'ip_mismatch' | 'user_agent_mismatch' | 'not_found';
  readonly message: string;
  readonly timestamp: Date;
}

export interface SessionContext {
  currentTime?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionCreateOptions {
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  maxAge?: number;
}

// Cache interface for dependency injection
export interface SessionCache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getKeysPattern(pattern: string): Promise<string[]>;
}

// Strategy interfaces following Single Responsibility Principle

// Session creation strategy
export interface SessionCreationStrategy {
  createSession(
    userId: string,
    tenantId: string,
    options?: SessionCreateOptions
  ): SessionData;
}

// Session validation strategy
export interface SessionValidationStrategy {
  validateSession(
    sessionData: SessionData,
    context?: SessionContext
  ): SessionValidationResult;
}

// Session renewal strategy
export interface SessionRenewalStrategy {
  renewSession(sessionData: SessionData): SessionData;
  shouldRenew(sessionData: SessionData): boolean;
}

// Session storage strategy
export interface SessionStorageStrategy {
  storeSession(sessionData: SessionData): Promise<void>;
  retrieveSession(sessionId: string): Promise<SessionData | null>;
  destroySession(sessionId: string): Promise<void>;
  destroyAllUserSessions(userId: string, tenantId: string): Promise<void>;
}

// Session activity tracking strategy
export interface SessionActivityStrategy {
  updateActivity(sessionId: string, metadata?: Record<string, unknown>): Promise<boolean>;
  trackLastActivity(sessionData: SessionData, metadata?: Record<string, unknown>): SessionData;
}

// Session cleanup strategy
export interface SessionCleanupStrategy {
  cleanExpiredSessions(): Promise<number>;
  getActiveSessionCount(userId: string, tenantId: string): Promise<number>;
}

// User session management strategy
export interface UserSessionStrategy {
  addToUserSessions(tenantId: string, userId: string, sessionId: string): Promise<void>;
  removeFromUserSessions(tenantId: string, userId: string, sessionId: string): Promise<void>;
  getUserSessions(tenantId: string, userId: string): Promise<string[]>;
  enforceSessionLimit(tenantId: string, userId: string): Promise<void>;
}

// Constants for configuration
export const SESSION_CONSTANTS = {
  DEFAULT_MAX_AGE: 30 * 60, // 30 minutes
  DEFAULT_RENEW_THRESHOLD: 5 * 60, // 5 minutes
  DEFAULT_MAX_SESSIONS: 5,
  CLEANUP_BATCH_SIZE: 100,
  MIGRATION_TTL_BUFFER: 60, // 1 minute buffer for migrations
} as const;