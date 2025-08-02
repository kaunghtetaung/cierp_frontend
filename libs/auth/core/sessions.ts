// Simplified Session Management - Following your established patterns
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import { generateSecureRandomString } from "@repo/utils/common/security";
import { SECURITY_CONFIG } from "@repo/utils/common/constants";

// Import your established session types to maintain consistency
import type {
  SessionData,
  SessionConfig,
  SessionValidationResult,
  SessionContext,
  SessionCreateOptions,
  SessionError
} from "@repo/security/types/session-types";

// Environment-configurable session security settings
const getSessionSecurityConfig = () => ({
  // IP Validation: Prevents session hijacking but breaks cross-subdomain/network changes
  // Set AUTH_SESSION_IP_VALIDATION=false for cross-subdomain apps or dynamic IPs
  // Set AUTH_SESSION_IP_VALIDATION=true for high-security single-domain apps
  ipValidation: process.env.AUTH_SESSION_IP_VALIDATION === 'true',
  
  // UserAgent Validation: Prevents session hijacking but breaks browser updates/switches
  // Set AUTH_SESSION_USER_AGENT_VALIDATION=false for flexible user experience
  // Set AUTH_SESSION_USER_AGENT_VALIDATION=true for strict device binding
  userAgentValidation: process.env.AUTH_SESSION_USER_AGENT_VALIDATION === 'true',
});

// Use your established session configuration with environment overrides
const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60,
  renewThreshold: 5 * 60, // 5 minutes
  maxSessions: 5,
  requireHttps: process.env.NODE_ENV === "production",
  trackActivity: true,
  ...getSessionSecurityConfig(),
};

// ===== CORE SESSION FUNCTIONS =====

export async function createSession(
  userId: string,
  tenantId: string,
  options: SessionCreateOptions = {},
  config: Partial<SessionConfig> = {}
): Promise<SessionData> {
  const fullConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const cache = getCacheInstance();
  
  // Generate secure session ID
  const sessionId = generateSecureRandomString(32);
  
  // Create session data following your readonly pattern
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (options.maxAge || fullConfig.maxAge) * 1000);
  
  const sessionData: SessionData = {
    sessionId,
    userId,
    tenantId,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    metadata: options.metadata
  };
  
  // Store session using your established cache key pattern
  await cache.set(
    CacheKeys.userSession(tenantId, sessionId), 
    sessionData, 
    fullConfig.maxAge
  );
  
  // Store global session lookup using your pattern
  await cache.set(
    CacheKeys.sessionLookup(sessionId),
    tenantId,
    fullConfig.maxAge
  );
  
  // Track user sessions for limit enforcement
  await addToUserSessions(tenantId, userId, sessionId);
  
  // Enforce session limit
  await enforceSessionLimit(tenantId, userId, fullConfig);
  
  return sessionData;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  // First get tenant ID from global lookup
  const cache = getCacheInstance();
  const sessionLookupKey = CacheKeys.sessionLookup(sessionId);
  const tenantId = await cache.get<string>(sessionLookupKey);
  
  console.log(`[GET_SESSION] sessionId: ${sessionId.substring(0, 20)}..., lookupKey: ${sessionLookupKey}, tenantId: ${tenantId}`);
  
  if (!tenantId) {
    console.log(`[GET_SESSION] No tenant found for session ${sessionId.substring(0, 20)}...`);
    return null;
  }
  
  // Now get session data using proper cache key
  const sessionKey = CacheKeys.userSession(tenantId, sessionId);
  const sessionData = await cache.get<SessionData>(sessionKey);
  
  console.log(`[GET_SESSION] sessionKey: ${sessionKey}, sessionData found: ${!!sessionData}`);
  
  if (!sessionData) {
    console.log(`[GET_SESSION] No session data found for key: ${sessionKey}`);
    return null;
  }
  
  // Convert date strings back to Date objects (Redis serialization)
  return {
    ...sessionData,
    createdAt: new Date(sessionData.createdAt),
    expiresAt: new Date(sessionData.expiresAt),
    lastActivityAt: new Date(sessionData.lastActivityAt)
  };
}

export async function validateSession(
  sessionId: string,
  context: SessionContext = {},
  config: Partial<SessionConfig> = {}
): Promise<SessionValidationResult> {
  const fullConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  
  console.log(`[VALIDATE_SESSION] sessionId: ${sessionId.substring(0, 20)}..., config: ipValidation=${fullConfig.ipValidation}, userAgentValidation=${fullConfig.userAgentValidation}`);
  
  const session = await getSession(sessionId);
  if (!session) {
    console.log(`[VALIDATE_SESSION] Session not found for ${sessionId.substring(0, 20)}...`);
    return {
      valid: false,
      error: {
        type: 'not_found',
        message: 'Session not found',
        timestamp: new Date()
      }
    };
  }
  
  console.log(`[VALIDATE_SESSION] Session found: userId=${session.userId}, tenantId=${session.tenantId}, expires=${session.expiresAt}`);
  
  
  // Check expiration
  const now = context.currentTime || new Date();
  if (now >= session.expiresAt) {
    await destroySession(sessionId);
    return {
      valid: false,
      error: {
        type: 'expired',
        message: 'Session expired',
        timestamp: now
      }
    };
  }
  
  // Check IP validation if enabled
  if (fullConfig.ipValidation && context.ipAddress && session.ipAddress) {
    console.log(`[VALIDATE_SESSION] IP check: context=${context.ipAddress}, session=${session.ipAddress}`);
    if (context.ipAddress !== session.ipAddress) {
      console.log(`[VALIDATE_SESSION] IP mismatch: destroying session`);
      await destroySession(sessionId);
      return {
        valid: false,
        error: {
          type: 'ip_mismatch',
          message: 'IP address mismatch',
          timestamp: now
        }
      };
    }
  }
  
  // Check User Agent validation if enabled
  if (fullConfig.userAgentValidation && context.userAgent && session.userAgent) {
    console.log(`[VALIDATE_SESSION] UserAgent check: context=${context.userAgent?.substring(0, 50)}..., session=${session.userAgent?.substring(0, 50)}...`);
    if (context.userAgent !== session.userAgent) {
      console.log(`[VALIDATE_SESSION] UserAgent mismatch: destroying session`);
      await destroySession(sessionId);
      return {
        valid: false,
        error: {
          type: 'user_agent_mismatch',
          message: 'User agent mismatch',
          timestamp: now
        }
      };
    }
  }
  
  // Check if renewal is needed
  const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
  const shouldRenew = timeUntilExpiry <= fullConfig.renewThreshold * 1000;
  
  // Update last activity if tracking is enabled
  let updatedSession = session;
  if (fullConfig.trackActivity) {
    updatedSession = await updateSessionActivity(sessionId, session) || session;
  }
  
  console.log(`[VALIDATE_SESSION] Session validation successful for ${sessionId.substring(0, 20)}...`);
  
  return {
    valid: true,
    session: updatedSession,
    shouldRenew
  };
}

export async function renewSession(
  sessionId: string,
  config: Partial<SessionConfig> = {}
): Promise<SessionData | null> {
  const fullConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  
  const session = await getSession(sessionId);
  if (!session) return null;
  
  // Create renewed session following readonly pattern
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + fullConfig.maxAge * 1000);
  
  const renewedSession: SessionData = {
    sessionId: session.sessionId,
    userId: session.userId,
    tenantId: session.tenantId,
    createdAt: session.createdAt,
    expiresAt: newExpiresAt,
    lastActivityAt: now,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    metadata: session.metadata
  };
  
  // Update in cache with new TTL using proper cache key
  const cache = getCacheInstance();
  await cache.set(
    CacheKeys.userSession(session.tenantId, sessionId), 
    renewedSession, 
    fullConfig.maxAge
  );
  
  return renewedSession;
}

export async function updateSessionActivity(
  sessionId: string,
  existingSession?: SessionData,
  metadata?: Record<string, unknown>
): Promise<SessionData | null> {
  const session = existingSession || await getSession(sessionId);
  if (!session) return null;
  
  const now = new Date();
  const updatedSession: SessionData = {
    sessionId: session.sessionId,
    userId: session.userId,
    tenantId: session.tenantId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastActivityAt: now,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    metadata: metadata ? { ...session.metadata, ...metadata } : session.metadata
  };
  
  // Update in cache (maintain original TTL) using proper cache key
  const cache = getCacheInstance();
  const sessionKey = CacheKeys.userSession(session.tenantId, sessionId);
  const currentTTL = await cache.ttl(sessionKey);
  if (currentTTL > 0) {
    await cache.set(sessionKey, updatedSession, currentTTL);
  }
  
  return updatedSession;
}

export async function destroySession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  const cache = getCacheInstance();
  
  if (session) {
    // Remove session using proper cache key
    await cache.del(CacheKeys.userSession(session.tenantId, sessionId));
    
    // Remove from user sessions
    await removeFromUserSessions(session.tenantId, session.userId, sessionId);
  }
  
  // Always remove global session lookup
  await cache.del(CacheKeys.sessionLookup(sessionId));
}

export async function destroyAllUserSessions(tenantId: string, userId: string): Promise<void> {
  const userSessions = await getUserSessions(tenantId, userId);
  const cache = getCacheInstance();
  
  // Remove all user sessions using proper cache keys
  await Promise.all([
    ...userSessions.map(sessionId => [
      cache.del(CacheKeys.userSession(tenantId, sessionId)),
      cache.del(CacheKeys.sessionLookup(sessionId))
    ]).flat(),
    cache.del(CacheKeys.userSessions(tenantId, userId))
  ]);
}

// ===== USER SESSION MANAGEMENT =====

async function addToUserSessions(tenantId: string, userId: string, sessionId: string): Promise<void> {
  const cache = getCacheInstance();
  const key = CacheKeys.userSessions(tenantId, userId);
  
  // Get current sessions
  const currentSessions = await cache.get<string[]>(key) || [];
  
  // Add new session (avoid duplicates)
  if (!currentSessions.includes(sessionId)) {
    currentSessions.push(sessionId);
    await cache.set(key, currentSessions, 7 * 24 * 3600); // 7 days TTL
  }
}

async function removeFromUserSessions(tenantId: string, userId: string, sessionId: string): Promise<void> {
  const cache = getCacheInstance();
  const key = CacheKeys.userSessions(tenantId, userId);
  
  // Get current sessions
  const currentSessions = await cache.get<string[]>(key) || [];
  
  // Remove session
  const filteredSessions = currentSessions.filter(id => id !== sessionId);
  
  if (filteredSessions.length > 0) {
    await cache.set(key, filteredSessions, 7 * 24 * 3600);
  } else {
    await cache.del(key);
  }
}

async function getUserSessions(tenantId: string, userId: string): Promise<string[]> {
  const cache = getCacheInstance();
  const key = CacheKeys.userSessions(tenantId, userId);
  return await cache.get<string[]>(key) || [];
}

async function enforceSessionLimit(
  tenantId: string, 
  userId: string, 
  config: SessionConfig
): Promise<void> {
  const userSessions = await getUserSessions(tenantId, userId);
  
  if (userSessions.length <= config.maxSessions) return;
  
  // Get all session data to find oldest ones
  const cache = getCacheInstance();
  const sessionDataPromises = userSessions.map(async sessionId => {
    const data = await getSession(sessionId);
    return data ? { sessionId, createdAt: data.createdAt } : null;
  });
  
  const sessionData = (await Promise.all(sessionDataPromises))
    .filter(Boolean) as { sessionId: string; createdAt: Date }[];
  
  // Sort by creation date (oldest first)
  sessionData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  // Remove oldest sessions to enforce limit
  const sessionsToRemove = sessionData.slice(0, sessionData.length - config.maxSessions);
  
  await Promise.all(
    sessionsToRemove.map(({ sessionId }) => destroySession(sessionId))
  );
}

// ===== CLEANUP FUNCTIONS =====

export async function cleanExpiredSessions(): Promise<number> {
  // This is a simplified version - in production you'd want more sophisticated cleanup
  // For now, we rely on Redis TTL to handle expiration
  return 0;
}

export async function getActiveSessionCount(tenantId: string, userId: string): Promise<number> {
  const userSessions = await getUserSessions(tenantId, userId);
  
  // Verify each session is still valid
  const validSessions = await Promise.all(
    userSessions.map(async sessionId => {
      const session = await getSession(sessionId);
      return session && new Date() < session.expiresAt;
    })
  );
  
  return validSessions.filter(Boolean).length;
}

// ===== UTILITY FUNCTIONS =====

export function createSessionManager(config: Partial<SessionConfig> = {}) {
  const fullConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  
  return {
    createSession: (userId: string, tenantId: string, options?: SessionCreateOptions) =>
      createSession(userId, tenantId, options, fullConfig),
    
    validateSession: (sessionId: string, context?: SessionContext) =>
      validateSession(sessionId, context, fullConfig),
    
    renewSession: (sessionId: string) =>
      renewSession(sessionId, fullConfig),
    
    destroySession,
    destroyAllUserSessions,
    getSession,
    updateSessionActivity,
    getActiveSessionCount,
    cleanExpiredSessions
  };
}