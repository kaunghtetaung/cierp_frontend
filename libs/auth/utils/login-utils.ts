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
      // Fallback: redirect to public web login page
      const { getPublicUrlClient } = await import('@repo/utils/client/domain');
      const publicUrl = getPublicUrlClient();
      window.location.href = `${publicUrl}/login`;
    }
  } catch (error) {
    console.error('Logout failed:', error);
    // Fallback: redirect to public web login page
    const { getPublicUrlClient } = await import('@repo/utils/client/domain');
    const publicUrl = getPublicUrlClient();
    window.location.href = `${publicUrl}/login`;
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
          error: undefined
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
        error: undefined
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
 * User role structure from the access token
 */
interface UserRoleInfo {
  organizationId: string;
  departmentId: string;
  roles: string[];
}

/**
 * Check if a user has access to a specific application based on acceptRolesList
 * @param user - User object with roles
 * @param acceptRolesList - Application's acceptRolesList
 * @returns boolean indicating if user has access
 */
export function hasApplicationAccess(
  user: User | null,
  acceptRolesList?: Array<{ departmentId: string; roles: string[] }>
): boolean {
  if (!user) return false;
  
  // If no acceptRolesList defined, allow access (backward compatibility)
  if (!acceptRolesList || acceptRolesList.length === 0) {
    return true;
  }

  // Handle both old string[] format and new object format for user roles
  const userRoles = user.roles as any[];
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Check each user role
  for (const userRole of userRoles) {
    if (typeof userRole === 'string') {
      // Old format: simple string role - check against wildcard departments
      for (const acceptRole of acceptRolesList) {
        if (acceptRole.departmentId === '*' && 
            acceptRole.roles.some(r => 
              r.toLowerCase() === userRole.toLowerCase() ||
              userRole.toLowerCase().includes(r.toLowerCase())
            )) {
          return true;
        }
      }
    } else if (userRole && typeof userRole === 'object') {
      // Handle both formats: new {organizationId, departmentId, roles} and JWT {Organization, Department, Role}
      const roleInfo = userRole as any;

      // Extract department (handle both departmentId and Department fields)
      const userDepartment = roleInfo.departmentId || roleInfo.Department;

      // Extract roles (handle both roles[] array and Role string)
      const userRoles = roleInfo.roles || (roleInfo.Role ? [roleInfo.Role] : []);

      for (const acceptRole of acceptRolesList) {
        // Check department match (wildcard "*" means any department)
        const departmentMatch =
          acceptRole.departmentId === '*' ||
          acceptRole.departmentId === userDepartment;

        if (departmentMatch && userRoles && userRoles.length > 0) {
          // Check if user has any of the required roles for this department
          const hasRequiredRole = acceptRole.roles.some(requiredRole =>
            userRoles.some((userRoleName: string) => {
              const normalizedUserRole = userRoleName.toLowerCase();
              const normalizedRequiredRole = requiredRole.toLowerCase();

              return normalizedUserRole === normalizedRequiredRole ||
                     normalizedUserRole.includes(normalizedRequiredRole) ||
                     normalizedRequiredRole.includes(normalizedUserRole);
            })
          );

          if (hasRequiredRole) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Check if user is a system admin
 */
export function isSystemAdmin(user: User | null): boolean {
  if (!user) return false;
  
  const userRoles = user.roles as any[];
  if (!userRoles) return false;

  for (const role of userRoles) {
    if (typeof role === 'string') {
      if (role.toLowerCase() === 'systemadmin' || role.toLowerCase() === 'system_admin') {
        return true;
      }
    } else if (role && typeof role === 'object' && role.roles) {
      const roleInfo = role as UserRoleInfo;
      if (roleInfo.roles.some((r: string) => 
        r.toLowerCase() === 'systemadmin' || r.toLowerCase() === 'system_admin'
      )) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if user is an organization admin
 */
export function isOrganizationAdmin(user: User | null): boolean {
  if (!user) return false;
  
  const userRoles = user.roles as any[];
  if (!userRoles) return false;

  for (const role of userRoles) {
    if (typeof role === 'string') {
      if (role.toLowerCase() === 'organizationadmin' || role.toLowerCase() === 'organization_admin') {
        return true;
      }
    } else if (role && typeof role === 'object' && role.roles) {
      const roleInfo = role as UserRoleInfo;
      if (roleInfo.roles.some((r: string) => 
        r.toLowerCase() === 'organizationadmin' || r.toLowerCase() === 'organization_admin'
      )) {
        return true;
      }
    }
  }
  
  return false;
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
  // Import dynamically to avoid circular dependencies
  const { getPublicUrlClient } = require('@repo/utils/client/domain');
  const publicUrl = getPublicUrlClient();
  const url = new URL('/login', publicUrl);
  if (returnUrl) {
    url.searchParams.set('returnUrl', returnUrl);
  }
  return url.toString();
}

/**
 * Get current return URL for login redirect
 */
export function getCurrentReturnUrl(): string {
  return window.location.href; // Use full URL instead of just path
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
      roles: ['user'] as any,
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