// Enhanced session management with security best practices
import {
  generateSecureSessionId,
  hashString,
} from "@repo/utils/common/security";
import { SECURITY_CONFIG } from "@repo/utils/common/constants";
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import type { UnifiedCache } from "@repo/cache";
import type { AuthSession } from "@repo/types";

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
  readonly type:
    | "expired"
    | "invalid"
    | "ip_mismatch"
    | "user_agent_mismatch"
    | "not_found";
  readonly message: string;
  readonly timestamp: Date;
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60,
  renewThreshold: 5 * 60, // 5 minutes
  maxSessions: 5,
  requireHttps: process.env.NODE_ENV === "production",
  trackActivity: true,
  ipValidation: true,
  userAgentValidation: true,
};

/**
 * Create new session with cryptographically secure ID
 */
export function createSession(
  userId: string,
  tenantId: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    maxAge?: number;
  } = {},
  config: Partial<SessionConfig> = {}
): SessionData {
  const finalConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const sessionId = generateSecureSessionId();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (options.maxAge || finalConfig.maxAge) * 1000
  );

  return {
    sessionId,
    userId,
    tenantId,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    metadata: options.metadata,
  };
}

/**
 * Validate session with comprehensive security checks
 */
export function validateSession(
  sessionData: SessionData,
  context: {
    currentTime?: Date;
    ipAddress?: string;
    userAgent?: string;
  } = {},
  config: Partial<SessionConfig> = {}
): SessionValidationResult {
  const finalConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const now = context.currentTime || new Date();

  // Ensure dates are properly parsed (handle both Date objects and string dates from cache)

  const expiresAt =
    sessionData.expiresAt instanceof Date
      ? sessionData.expiresAt
      : new Date(sessionData.expiresAt);

  const createdAt =
    sessionData.createdAt instanceof Date
      ? sessionData.createdAt
      : new Date(sessionData.createdAt);

  const lastActivityAt =
    sessionData.lastActivityAt instanceof Date
      ? sessionData.lastActivityAt
      : new Date(sessionData.lastActivityAt);

  // Validate date parsing
  if (
    isNaN(expiresAt.getTime()) ||
    isNaN(createdAt.getTime()) ||
    isNaN(lastActivityAt.getTime())
  ) {
    return {
      valid: false,
      error: {
        type: "invalid",
        message: "Session contains invalid date values",
        timestamp: now,
      },
    };
  }

  // Check if session has expired
  if (now > expiresAt) {
    return {
      valid: false,
      error: {
        type: "expired",
        message: "Session has expired",
        timestamp: now,
      },
    };
  }

  // Check IP address validation
  if (
    finalConfig.ipValidation &&
    context.ipAddress &&
    sessionData.ipAddress &&
    context.ipAddress !== sessionData.ipAddress
  ) {
    return {
      valid: false,
      error: {
        type: "ip_mismatch",
        message: "IP address mismatch",
        timestamp: now,
      },
    };
  }

  // Check user agent validation
  if (
    finalConfig.userAgentValidation &&
    context.userAgent &&
    sessionData.userAgent &&
    context.userAgent !== sessionData.userAgent
  ) {
    return {
      valid: false,
      error: {
        type: "user_agent_mismatch",
        message: "User agent mismatch",
        timestamp: now,
      },
    };
  }

  // Check if session should be renewed
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const shouldRenew = timeUntilExpiry <= finalConfig.renewThreshold * 1000;

  // Return session data with properly parsed dates
  const validatedSession: SessionData = {
    ...sessionData,
    expiresAt,
    createdAt,
    lastActivityAt,
  };

  return {
    valid: true,
    session: validatedSession,
    shouldRenew,
  };
}

/**
 * Renew session with new expiry time
 */
export function renewSession(
  sessionData: SessionData,
  config: Partial<SessionConfig> = {}
): SessionData {
  const finalConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + finalConfig.maxAge * 1000);

  return {
    ...sessionData,
    expiresAt,
    lastActivityAt: now,
  };
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(
  sessionData: SessionData,
  metadata?: Record<string, unknown>
): SessionData {
  const now = new Date();

  return {
    ...sessionData,
    lastActivityAt: now,
    metadata: metadata
      ? { ...sessionData.metadata, ...metadata }
      : sessionData.metadata,
  };
}

/**
 * Generate session hash for storage
 */
export async function generateSessionHash(sessionId: string): Promise<string> {
  return hashString(sessionId);
}

/**
 * Create session storage key
 */
export function createSessionStorageKey(
  tenantId: string,
  userId: string
): string {
  return `session:${tenantId}:${userId}`;
}

/**
 * Create session lookup key
 */
export function createSessionLookupKey(sessionId: string): string {
  return `SessionLookup:${sessionId}`;
}

/**
 * Session manager class for comprehensive session handling
 */
export class SessionManager {
  private config: SessionConfig;
  private cache: UnifiedCache;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.cache = getCacheInstance();
  }

  /**
   * Create and store new session
   */
  async createSession(
    userId: string,
    tenantId: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<SessionData> {
    const session = createSession(userId, tenantId, options, this.config);

    // Store session in cache with tenant-scoped keys
    const sessionKey = CacheKeys.userSession(tenantId, session.sessionId);
    const lookupKey = CacheKeys.sessionLookup(session.sessionId); // Global lookup
    const userSessionsKey = CacheKeys.userSessions(tenantId, userId);

    await Promise.all([
      // Store session data
      this.cache.set(sessionKey, session, this.config.maxAge),
      // Store global session lookup to find tenant
      this.cache.set(lookupKey, { userId, tenantId }, this.config.maxAge),
      // Add to user's sessions list
      this.addToUserSessions(tenantId, userId, session.sessionId),
    ]);

    return session;
  }

  /**
   * Validate and retrieve session
   */
  async validateSession(
    sessionId: string,
    context: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<SessionValidationResult> {
    try {
      // First, lookup which tenant this session belongs to
      const lookupKey = CacheKeys.sessionLookup(sessionId);
      console.log(
        "🔍 [VALIDATE SESSION] Looking up session with key:",
        lookupKey
      );
      let lookupData = await this.cache.get<{
        userId: string;
        tenantId: string;
      }>(lookupKey);

      if (!lookupData) {
        console.log(
          "🔍 [VALIDATE SESSION] Session lookup not found in both new and old formats"
        );
        return {
          valid: false,
          error: {
            type: "not_found",
            message: "Session not found",
            timestamp: new Date(),
          },
        };
      }

      // Now get the actual session data from tenant-scoped key
      const sessionKey = CacheKeys.userSession(lookupData.tenantId, sessionId);
      console.log(
        "🔍 [VALIDATE SESSION] Looking up session data with key:",
        sessionKey
      );
      let sessionData = await this.cache.get<SessionData>(sessionKey);

      if (!sessionData) {
        return {
          valid: false,
          error: {
            type: "not_found",
            message: "Session data not found",
            timestamp: new Date(),
          },
        };
      }

      const result = validateSession(sessionData, context, this.config);

      // Auto-renew if needed
      if (result.valid && result.shouldRenew) {
        const renewedSession = renewSession(sessionData, this.config);
        await this.cache.set(sessionKey, renewedSession, this.config.maxAge);
        result.session = renewedSession;
      }

      return result;
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        error: {
          type: "invalid",
          message: "Session validation failed",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<void> {
    try {
      // Get session info first for cleanup
      const lookupKey = CacheKeys.sessionLookup(sessionId);
      const sessionInfo = await this.cache.get<{
        userId: string;
        tenantId: string;
      }>(lookupKey);

      if (!sessionInfo) {
        console.warn(`Session lookup not found for sessionId: ${sessionId}`);
        return;
      }

      // Remove session data using tenant-scoped key
      const sessionKey = CacheKeys.userSession(sessionInfo.tenantId, sessionId);

      await Promise.all([
        this.cache.del(sessionKey),
        this.cache.del(lookupKey),
      ]);

      // Remove from user's sessions list
      if (sessionInfo) {
        await this.removeFromUserSessions(
          sessionInfo.tenantId,
          sessionInfo.userId,
          sessionId
        );
      }
    } catch (error) {
      console.error("Failed to destroy session:", error);
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyAllUserSessions(
    userId: string,
    tenantId: string
  ): Promise<void> {
    try {
      // Get all user sessions using tenant-scoped key
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const sessionIds =
        (await this.cache.get<string[]>(userSessionsKey)) || [];

      // Destroy each session
      const destroyPromises = sessionIds.map((sessionId) =>
        this.destroySession(sessionId)
      );
      await Promise.all(destroyPromises);

      // Clear the user sessions list
      await this.cache.del(userSessionsKey);
    } catch (error) {
      console.error("Failed to destroy all user sessions:", error);
    }
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      // Redis automatically handles TTL, but we can clean up orphaned lookups
      // This is primarily for maintenance and consistency

      // Get all session lookup keys
      const lookupPattern = "SessionLookup:*";
      const lookupKeys = await this.cache.getKeysPattern(lookupPattern);

      let cleanedCount = 0;

      for (const lookupKey of lookupKeys) {
        const sessionId = lookupKey.split(":").pop();
        if (sessionId) {
          const sessionKey = CacheKeys.userSession(sessionId);
          const sessionExists = await this.cache.exists(sessionKey);

          if (!sessionExists) {
            // Session expired but lookup still exists - clean it up
            await this.cache.del(lookupKey);
            cleanedCount++;
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error("Failed to clean expired sessions:", error);
      return 0;
    }
  }

  /**
   * Get active session count for user
   */
  async getActiveSessionCount(
    userId: string,
    tenantId: string
  ): Promise<number> {
    try {
      const userSessionsKey = CacheKeys.userSessions(userId);
      const sessionIds =
        (await this.cache.get<string[]>(userSessionsKey)) || [];
      return sessionIds.length;
    } catch (error) {
      console.error("Failed to get active session count:", error);
      return 0;
    }
  }

  /**
   * Update session activity
   */
  async updateActivity(
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const sessionKey = CacheKeys.userSession(sessionId);
      const sessionData = await this.cache.get<SessionData>(sessionKey);

      if (!sessionData) {
        return false;
      }

      const updatedSession = updateSessionActivity(sessionData, metadata);
      await this.cache.set(sessionKey, updatedSession, this.config.maxAge);

      return true;
    } catch (error) {
      console.error("Failed to update session activity:", error);
      return false;
    }
  }

  /**
   * Add session to user's sessions list
   */
  private async addToUserSessions(
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const currentSessions =
        (await this.cache.get<string[]>(userSessionsKey)) || [];

      // Add new session ID if not already present
      if (!currentSessions.includes(sessionId)) {
        const updatedSessions = [...currentSessions, sessionId];

        // Limit to maxSessions
        if (updatedSessions.length > this.config.maxSessions) {
          // Remove oldest sessions
          const sessionsToRemove = updatedSessions.slice(
            0,
            updatedSessions.length - this.config.maxSessions
          );
          for (const oldSessionId of sessionsToRemove) {
            await this.destroySession(oldSessionId);
          }
          updatedSessions.splice(0, sessionsToRemove.length);
        }

        await this.cache.set(userSessionsKey, updatedSessions, CacheTTL.LONG);
      }
    } catch (error) {
      console.error("Failed to add to user sessions:", error);
    }
  }

  /**
   * Remove session from user's sessions list
   */
  private async removeFromUserSessions(
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const userSessionsKey = CacheKeys.userSessions(tenantId, userId);
      const currentSessions =
        (await this.cache.get<string[]>(userSessionsKey)) || [];

      const updatedSessions = currentSessions.filter((id) => id !== sessionId);

      if (updatedSessions.length !== currentSessions.length) {
        if (updatedSessions.length === 0) {
          await this.cache.del(userSessionsKey);
        } else {
          await this.cache.set(userSessionsKey, updatedSessions, CacheTTL.LONG);
        }
      }
    } catch (error) {
      console.error("Failed to remove from user sessions:", error);
    }
  }
}

/**
 * Convert session data to AuthSession type
 */
export function toAuthSession(sessionData: SessionData): AuthSession {
  return {
    id: sessionData.sessionId,
    userId: sessionData.userId,
    tenantId: sessionData.tenantId,
    expiresAt: sessionData.expiresAt,
    createdAt: sessionData.createdAt,
    lastActivityAt: sessionData.lastActivityAt,
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent,
  };
}

/**
 * Convert AuthSession to session data
 */
export function fromAuthSession(authSession: AuthSession): SessionData {
  return {
    sessionId: authSession.id,
    userId: authSession.userId,
    tenantId: authSession.tenantId,
    createdAt: authSession.createdAt,
    expiresAt: authSession.expiresAt,
    lastActivityAt: authSession.lastActivityAt,
    ipAddress: authSession.ipAddress,
    userAgent: authSession.userAgent,
  };
}
