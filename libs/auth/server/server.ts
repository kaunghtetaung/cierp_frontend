// Simplified server-side authentication using refactored core
import { cache } from 'react';
import { getSafeCookies, getSafeHeaders } from '../../utils/server/headers-compat';
import { validateRequest } from '../core';
import { COOKIE_NAMES } from '@repo/utils/common/constants';
import type { 
  User, 
  AuthSession, 
  AuthenticationResult,
  AuthTokens 
} from '@repo/types';

// Session configuration
const sessionConfig = {
  maxAge: 30 * 60, // 30 minutes
  renewThreshold: 5 * 60, // 5 minutes
  requireHttps: process.env.NODE_ENV === 'production',
  trackActivity: true,
  ipValidation: false, // Disabled for cross-subdomain access
  userAgentValidation: false // Disabled for cross-subdomain access
};

/**
 * Get authentication status using simplified core functions
 * Cached for performance
 */
export const getAuthenticationStatus = cache(async (
  requestHeaders?: Headers
): Promise<AuthenticationResult> => {
  try {
    const cookieStore = requestHeaders ? null : await getSafeCookies();
    const headerStore = requestHeaders || await getSafeHeaders();

    // Get tenant ID from headers (set by middleware)
    const tenantId = headerStore.get('x-tenant-id');

    // Get session cookie
    const sessionCookieValue = cookieStore 
      ? cookieStore.get(COOKIE_NAMES.SESSION)?.value
      : headerStore.get('cookie')?.split(';').find(c => c.trim().startsWith(`${COOKIE_NAMES.SESSION}=`))?.split('=')[1];

    // Debug logging for session cookie detection
    const hostname = headerStore.get('host') || '';
    const allCookies = headerStore.get('cookie') || '';
    console.log(`Session validation for hostname: ${hostname}, tenantId: ${tenantId}`);
    console.log(`All cookies: ${allCookies}`);
    console.log(`Session cookie value: ${sessionCookieValue ? '[FOUND]' : '[NOT FOUND]'}`);

    if (!sessionCookieValue) {
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        tenantId,
        error: 'No session cookie found'
      };
    }

    // Get client IP and user agent for validation context
    const clientIp = headerStore.get('x-forwarded-for') || headerStore.get('x-real-ip');
    const userAgent = headerStore.get('user-agent');

    // Use simplified validateRequest function
    const authResult = await validateRequest(sessionCookieValue, {
      ipAddress: clientIp || undefined,
      userAgent: userAgent || undefined
    });

    if (!authResult.isAuthenticated) {
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        tenantId,
        error: 'Session validation failed'
      };
    }

    // Convert session data to AuthSession format
    const session: AuthSession | null = authResult.session ? {
      id: authResult.session.sessionId,
      userId: authResult.session.userId,
      tenantId: authResult.session.tenantId,
      expiresAt: authResult.session.expiresAt,
      createdAt: authResult.session.createdAt,
      lastActivityAt: authResult.session.lastActivityAt,
      ipAddress: authResult.session.ipAddress,
      userAgent: authResult.session.userAgent
    } : null;

    return {
      isAuthenticated: true,
      user: authResult.user || null,
      session,
      tenantId: authResult.session?.tenantId || tenantId,
      error: undefined
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      tenantId: null,
      error: 'Authentication check failed'
    };
  }
});

// The complex caching functions are no longer needed with simplified core
// User data is now extracted directly from JWT tokens

/**
 * Create new authentication session
 * Note: Session creation is now handled by the core loginUser function
 */
export async function createAuthSession(
  userId: string,
  tenantId: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<{ session: AuthSession; tokens: AuthTokens }> {
  // Simplified: For new auth flow, use the loginUser function from core
  // This is mainly for backward compatibility
  throw new Error('Use loginUser from core instead of createAuthSession');
}

/**
 * Destroy authentication session
 * Note: Session destruction is now handled by the core logoutUser function
 */
export async function destroyAuthSession(sessionId: string): Promise<void> {
  // Simplified: For new auth flow, use the logoutUser function from core
  // This is mainly for backward compatibility
  throw new Error('Use logoutUser from core instead of destroyAuthSession');
}

/**
 * Get current user (convenience function)
 */
export const getCurrentUser = cache(async (requestHeaders?: Headers): Promise<User | null> => {
  const auth = await getAuthenticationStatus(requestHeaders);
  return auth.user;
});

/**
 * Get current session (convenience function)
 */
export const getCurrentSession = cache(async (requestHeaders?: Headers): Promise<AuthSession | null> => {
  const auth = await getAuthenticationStatus(requestHeaders);
  return auth.session;
});

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.permissions.includes(permission as any) || false;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.roles.includes(role as any) || false;
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<{ user: User; session: AuthSession }> {
  const auth = await getAuthenticationStatus();
  
  if (!auth.isAuthenticated || !auth.user || !auth.session) {
    throw new Error('Authentication required');
  }
  
  return {
    user: auth.user,
    session: auth.session
  };
}

/**
 * Require specific permission (throws if not authorized)
 */
export async function requirePermission(permission: string): Promise<{ user: User; session: AuthSession }> {
  const auth = await requireAuth();
  
  if (!auth.user.permissions.includes(permission as any)) {
    throw new Error(`Permission required: ${permission}`);
  }
  
  return auth;
}

/**
 * Require specific role (throws if not authorized)
 */
export async function requireRole(role: string): Promise<{ user: User; session: AuthSession }> {
  const auth = await requireAuth();
  
  if (!auth.user.roles.includes(role as any)) {
    throw new Error(`Role required: ${role}`);
  }
  
  return auth;
}

/**
 * Clean expired sessions (maintenance function)
 */
export async function cleanExpiredSessions(): Promise<number> {
  try {
    // Simplified sessions are automatically cleaned up by Redis TTL
    // No manual cleanup needed
    console.log('Session cleanup handled automatically by Redis TTL');
    return 0;
  } catch (error) {
    console.error('Failed to clean expired sessions:', error);
    return 0;
  }
}