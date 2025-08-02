// Login utilities for client-side authentication
import type { User, AuthSession, LoginRequest, AuthenticationResult } from '@repo/types';

/**
 * Client-side login utility that redirects to OIDC authorization
 */
export async function initiateLogin(returnUrl?: string): Promise<void> {
  try {
    const params = new URLSearchParams();
    if (returnUrl) {
      params.append('returnUrl', returnUrl);
    }

    const response = await fetch(`/api/auth/login?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to initiate login');
    }

    const data = await response.json();
    
    if (data.authorizationUrl) {
      // Redirect to OIDC authorization server
      window.location.href = data.authorizationUrl;
    } else {
      throw new Error('No authorization URL received');
    }
  } catch (error) {
    console.error('Login initiation failed:', error);
    throw error;
  }
}

/**
 * Client-side logout utility
 */
export async function initiateLogout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to logout');
    }

    // Response will be a redirect to OIDC logout endpoint
    if (response.redirected) {
      window.location.href = response.url;
    } else {
      // Fallback: redirect to login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
    // Fallback: redirect to login page
    window.location.href = '/login';
  }
}

/**
 * Get current authentication status
 */
export async function getAuthStatus(): Promise<AuthenticationResult> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // API route doesn't exist, don't log as error
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          tenantId: null,
          error: null
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Only log network errors, not 404s
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Network error or API not available - don't spam logs
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        tenantId: null,
        error: null
      };
    }
    
    console.error('Failed to get auth status:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      tenantId: null,
      error: (error as Error).message
    };
  }
}

/**
 * Refresh current session
 */
export async function refreshSession(): Promise<{ success: boolean; expiresAt?: Date }> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh session');
    }

    const data = await response.json();
    return {
      success: true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    };
  } catch (error) {
    console.error('Session refresh failed:', error);
    return { success: false };
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission as any);
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role as any);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.some(role => user.roles.includes(role as any));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  return permissions.every(permission => user.permissions.includes(permission as any));
}

/**
 * Check if session is about to expire (within 5 minutes)
 */
export function isSessionExpiringSoon(session: AuthSession | null): boolean {
  if (!session) return false;
  const fiveMinutes = 5 * 60 * 1000;
  // Handle expiresAt as either Date object, string, or number
  const expiresAt = session.expiresAt;
  const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : 
                    typeof expiresAt === 'string' ? new Date(expiresAt).getTime() :
                    typeof expiresAt === 'number' ? expiresAt : Date.now();
  return expiryTime - Date.now() < fiveMinutes;
}

/**
 * Get remaining session time in minutes
 */
export function getRemainingSessionTime(session: AuthSession | null): number {
  if (!session) return 0;
  // Handle expiresAt as either Date object, string, or number
  const expiresAt = session.expiresAt;
  const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : 
                    typeof expiresAt === 'string' ? new Date(expiresAt).getTime() :
                    typeof expiresAt === 'number' ? expiresAt : Date.now();
  const remaining = expiryTime - Date.now();
  return Math.max(0, Math.floor(remaining / (60 * 1000)));
}

/**
 * Create login URL with return URL
 */
export function createLoginUrl(returnUrl?: string): string {
  const url = new URL('/login', window.location.origin);
  if (returnUrl) {
    url.searchParams.set('returnUrl', returnUrl);
  }
  return url.toString();
}

/**
 * Get current return URL for login redirect
 */
export function getCurrentReturnUrl(): string {
  return window.location.pathname + window.location.search;
}

/**
 * Redirect to login with current URL as return URL
 */
export function redirectToLogin(): void {
  const returnUrl = getCurrentReturnUrl();
  window.location.href = createLoginUrl(returnUrl);
}

/**
 * Storage utilities for client-side session management
 */
export const SessionStorage = {
  /**
   * Store session data in localStorage (for offline access)
   */
  storeSession(user: User, session: AuthSession): void {
    try {
      const sessionData = {
        user,
        session,
        timestamp: Date.now()
      };
      localStorage.setItem('auth_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  },

  /**
   * Get stored session data
   */
  getStoredSession(): { user: User; session: AuthSession } | null {
    try {
      const data = localStorage.getItem('auth_session');
      if (!data) return null;

      const sessionData = JSON.parse(data);
      
      // Check if stored session is still valid
      if (sessionData.session.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }

      return {
        user: sessionData.user,
        session: {
          ...sessionData.session,
          expiresAt: new Date(sessionData.session.expiresAt),
          createdAt: new Date(sessionData.session.createdAt),
          lastActivityAt: new Date(sessionData.session.lastActivityAt)
        }
      };
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  },

  /**
   * Clear stored session data
   */
  clearSession(): void {
    try {
      localStorage.removeItem('auth_session');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
};

/**
 * Error handling utilities
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AuthError(error.message, 'UNKNOWN_ERROR');
  }
  
  return new AuthError('An unknown authentication error occurred', 'UNKNOWN_ERROR');
}

/**
 * Development utilities
 */
export const DevUtils = {
  /**
   * Log authentication events in development
   */
  logAuthEvent(event: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] ${event}`, data);
    }
  },

  /**
   * Mock user for development/testing
   */
  createMockUser(overrides?: Partial<User>): User {
    return {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
      roles: ['user'],
      permissions: ['read'],
      tenantId: 'mock-tenant',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  },

  /**
   * Mock session for development/testing
   */
  createMockSession(overrides?: Partial<AuthSession>): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    return {
      id: 'mock-session-id',
      userId: 'mock-user-id',
      tenantId: 'mock-tenant',
      expiresAt,
      createdAt: now,
      lastActivityAt: now,
      ...overrides
    };
  }
};