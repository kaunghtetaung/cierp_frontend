// Simplified Auth Core - Everything you need in one place!

// Token functions
export * from './tokens';

// Session functions  
export * from './sessions';

// OIDC functions
export * from './oidc';

// Cookie utilities
export * from './cookies';

// Types
export * from './types';

// ===== CONVENIENCE FUNCTIONS =====

import { 
  getTokenForRequest,
  setUserAccessToken, 
  setUserRefreshToken,
  clearUserTokens,
  refreshUserTokenIfNeeded 
} from './tokens';

import { 
  createSession, 
  validateSession, 
  destroySession,
  renewSession,
  createSessionManager 
} from './sessions';

import {
  refreshAccessToken
} from './oidc';

import type { User, SessionData, RequestContext } from './types';

// Import centralized JWT utility to eliminate duplication
import { extractUserInfoFromJWT } from '../utils/jwt-utils';

// Import cache and cache keys for tenant settings
import { getCacheInstance, CacheKeys } from '@repo/cache';

/**
 * High-level auth function: Login a user and create session
 */
export async function loginUser(
  userId: string,
  tenantId: string,
  accessToken: string,
  refreshToken?: string,
  tokenExpiresIn: number = 3600,
  sessionOptions?: { ipAddress?: string; userAgent?: string; metadata?: Record<string, unknown> }
): Promise<SessionData> {
  // Store JWT token string directly for backend offline verification
  await setUserAccessToken(tenantId, userId, accessToken, tokenExpiresIn);
  if (refreshToken) {
    await setUserRefreshToken(tenantId, userId, refreshToken);
  }
  
  // Create session
  return await createSession(userId, tenantId, sessionOptions);
}

/**
 * High-level auth function: Logout a user and cleanup
 */
export async function logoutUser(sessionId: string, tenantId?: string, userId?: string): Promise<void> {
  // Destroy session
  await destroySession(sessionId);
  
  // Clear tokens if we have the info
  if (tenantId && userId) {
    await clearUserTokens(tenantId, userId);
  }
}

/**
 * High-level auth function: Validate request and get auth context  
 */
export async function validateRequest(
  sessionId: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<{
  isAuthenticated: boolean;
  user?: User;
  session?: SessionData;
  token?: string;
}> {
  // Validate session using environment-configured security settings
  const validation = await validateSession(sessionId, context);
  if (!validation.valid || !validation.session) {
    return { isAuthenticated: false };
  }
  
  const session = validation.session;
  
  // Try to get a token for this user
  const token = await getTokenForRequest(session.tenantId, session.userId);
  
  // Try to refresh token if needed and possible
  let finalToken = token;
  if (!token) {
    console.log(`🔄 [validateRequest] No token found for user ${session.userId}, attempting refresh...`);

    // Get tenant settings from Redis cache to retrieve logInFlow credentials
    const cache = getCacheInstance();
    const tenantSettingsKey = CacheKeys.tenantSettings(session.tenantId);
    const tenantSettings = await cache.get<any>(tenantSettingsKey);

    if (!tenantSettings?.secret?.logInFlow) {
      console.error(`❌ [validateRequest] No cached tenant settings with logInFlow found for tenant ${session.tenantId}`);
      console.log(`⚠️ [validateRequest] Cannot refresh user token without logInFlow credentials - logging out user`);

      // Destroy session since we can't refresh the token
      await destroySession(sessionId);
      return { isAuthenticated: false };
    }

    const { clientId, clientSecret } = tenantSettings.secret.logInFlow;

    if (!clientId || !clientSecret) {
      console.error(`❌ [validateRequest] Missing clientId or clientSecret in logInFlow for tenant ${session.tenantId}`);
      console.log(`⚠️ [validateRequest] Cannot refresh token without credentials - logging out user`);

      // Destroy session since we can't refresh the token
      await destroySession(sessionId);
      return { isAuthenticated: false };
    }

    console.log(`✅ [validateRequest] Using logInFlow client ID: ${clientId.substring(0, 10)}...`);

    finalToken = await refreshUserTokenIfNeeded(
      session.tenantId,
      session.userId,
      (refreshToken) => refreshAccessToken(refreshToken, clientId, clientSecret)
    );

    if (finalToken) {
      console.log(`✅ [validateRequest] Token refreshed successfully for user ${session.userId}`);
    } else {
      console.error(`❌ [validateRequest] Failed to refresh token for user ${session.userId} - logging out user`);

      // Token refresh failed (no refresh token or invalid refresh token)
      // Destroy the session and force user to login again
      await destroySession(sessionId);
      return { isAuthenticated: false };
    }
  }
  
  // Extract user data from JWT token
  // At this point, finalToken is guaranteed to exist because we logged out users without tokens above
  const userInfo = extractUserInfoFromJWT(finalToken);
  const roles = userInfo.roles || [];
  const user: User = {
    id: session.userId,
    tenantId: session.tenantId,
    email: userInfo.email || '',
    name: userInfo.name || '',
    roles: roles,
    permissions: userInfo.permissions || [],
    profileState: userInfo.profileState, // Profile completion state from JWT
    isActive: true,
    createdAt: userInfo.createdAt || session.createdAt,
    updatedAt: new Date()
  };

  return {
    isAuthenticated: true,
    user,
    session,
    token: finalToken
  };
}

/**
 * High-level auth function: Get auth context from request
 */
export async function getAuthContext(
  sessionId?: string,
  requestContext?: RequestContext
): Promise<{
  isAuthenticated: boolean;
  user?: User;
  session?: SessionData;
  tenantId?: string;
  token?: string;
}> {
  if (!sessionId) {
    return { isAuthenticated: false };
  }
  
  return await validateRequest(sessionId, {
    ipAddress: requestContext?.ipAddress,
    userAgent: requestContext?.userAgent
  });
}

/**
 * Create a configured session manager instance
 */
export function createAuthSessionManager(options?: {
  maxAge?: number;
  renewThreshold?: number;
  maxSessions?: number;
  ipValidation?: boolean;
  userAgentValidation?: boolean;
}) {
  return createSessionManager(options);
}