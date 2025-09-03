// Authentication hooks for React components
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAuthStatus, 
  initiateLogin, 
  initiateLogout, 
  refreshSession,
  hasPermission,
  hasRole,
  hasAnyRole,
  hasAllPermissions,
  isSessionExpiringSoon,
  getRemainingSessionTime,
  redirectToLogin,
  SessionStorage,
  DevUtils
} from '../utils/login-utils';
import type { User, AuthSession, AuthenticationResult } from '@repo/types';

export interface UseAuthOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number; // minutes before expiry to auto-refresh
  onAuthChange?: (isAuthenticated: boolean, user: User | null) => void;
  onSessionExpiring?: (minutesRemaining: number) => void;
  onError?: (error: Error) => void;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for backward compatibility
  error: string | null;
  tenantId: string | null;
}

export interface AuthActions {
  login: (returnUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Main authentication hook
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    autoRefresh = true,
    refreshThreshold = 5,
    onAuthChange,
    onSessionExpiring,
    onError
  } = options;

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    loading: true, // Alias for isLoading for backward compatibility
    error: null,
    tenantId: null
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef<number>(0);
  const maxFailures = 3; // Stop polling after 3 consecutive failures

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      // Keep loading and isLoading in sync
      if ('isLoading' in updates) {
        newState.loading = updates.isLoading!;
      }
      if ('loading' in updates) {
        newState.isLoading = updates.loading!;
      }
      return newState;
    });
  }, []);

  // Handle authentication errors
  const handleError = useCallback((error: Error) => {
    DevUtils.logAuthEvent('AUTH_ERROR', error);
    updateState({ error: error.message, isLoading: false });
    onError?.(error);
  }, [onError, updateState]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    // Stop checking if we've had too many consecutive failures
    if (failureCountRef.current >= maxFailures) {
      return;
    }

    try {
      DevUtils.logAuthEvent('CHECKING_AUTH');
      
      const result = await getAuthStatus();
      
      // Reset failure count on successful response
      if (!result.error) {
        failureCountRef.current = 0;
      } else if (result.error) {
        failureCountRef.current++;
        if (failureCountRef.current >= maxFailures) {
          console.warn('Auth API consistently failing, stopping periodic checks');
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
        }
      }
      
      const newState: Partial<AuthState> = {
        user: result.user,
        session: result.session,
        isAuthenticated: result.isAuthenticated,
        tenantId: result.tenantId,
        isLoading: false,
        error: result.error || null
      };

      updateState(newState);

      // Store session in localStorage for offline access
      if (result.isAuthenticated && result.user && result.session) {
        SessionStorage.storeSession(result.user, result.session);
      } else {
        SessionStorage.clearSession();
      }

      // Notify about auth change
      if (onAuthChange) {
        onAuthChange(result.isAuthenticated, result.user);
      }

      DevUtils.logAuthEvent('AUTH_STATUS_UPDATED', {
        isAuthenticated: result.isAuthenticated,
        user: result.user?.email
      });

    } catch (error) {
      failureCountRef.current++;
      if (failureCountRef.current >= maxFailures) {
        console.warn('Auth API consistently failing, stopping periodic checks');
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      }
      handleError(error as Error);
    }
  }, [updateState, handleError, onAuthChange]);

  // Login function
  const login = useCallback(async (returnUrl?: string) => {
    try {
      DevUtils.logAuthEvent('INITIATING_LOGIN', { returnUrl });
      updateState({ isLoading: true, error: null });
      await initiateLogin(returnUrl);
    } catch (error) {
      handleError(error as Error);
    }
  }, [updateState, handleError]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      DevUtils.logAuthEvent('INITIATING_LOGOUT');
      updateState({ isLoading: true, error: null });
      
      // Clear local storage
      SessionStorage.clearSession();
      
      // Clear timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      await initiateLogout();
    } catch (error) {
      handleError(error as Error);
    }
  }, [updateState, handleError]);

  // Refresh session function
  const refreshSessionHandler = useCallback(async () => {
    try {
      DevUtils.logAuthEvent('REFRESHING_SESSION');
      const result = await refreshSession();
      
      if (result.success) {
        // Re-check auth to get updated session
        await checkAuth();
        DevUtils.logAuthEvent('SESSION_REFRESHED');
      } else {
        throw new Error('Session refresh failed');
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [checkAuth, handleError]);

  // Clear error function
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh || !state.session || !state.isAuthenticated) {
      return;
    }

    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Handle expiresAt as either Date object, string, or number
      const expiresAt = state.session!.expiresAt;
      const expiryTime = expiresAt instanceof Date ? expiresAt.getTime() : 
                        typeof expiresAt === 'string' ? new Date(expiresAt).getTime() :
                        typeof expiresAt === 'number' ? expiresAt : Date.now();
      const timeUntilExpiry = expiryTime - Date.now();
      const refreshTime = Math.max(0, timeUntilExpiry - (refreshThreshold * 60 * 1000));

      if (refreshTime > 0) {
        refreshTimeoutRef.current = setTimeout(() => {
          DevUtils.logAuthEvent('AUTO_REFRESH_TRIGGERED');
          refreshSessionHandler();
        }, refreshTime);
      }
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshThreshold, state.session, state.isAuthenticated, refreshSessionHandler]);

  // Setup session expiry notifications
  useEffect(() => {
    if (!state.session || !state.isAuthenticated || !onSessionExpiring) {
      return;
    }

    const checkExpiry = () => {
      if (state.session && isSessionExpiringSoon(state.session)) {
        const remaining = getRemainingSessionTime(state.session);
        onSessionExpiring(remaining);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);

    return () => clearInterval(interval);
  }, [state.session, state.isAuthenticated, onSessionExpiring]);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, []); // Empty dependency array for initial check only

  // Periodic auth check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth();
    }, 5 * 60 * 1000);
    checkIntervalRef.current = interval;

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []); // Empty dependency array to avoid recreating interval

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    loading: state.isLoading, // Alias for backward compatibility
    login,
    logout,
    refreshSession: refreshSessionHandler,
    clearError,
    checkAuth
  };
}

/**
 * Hook for checking user permissions
 */
export function usePermissions(user: User | null) {
  return {
    hasPermission: useCallback((permission: string) => hasPermission(user, permission), [user]),
    hasRole: useCallback((role: string) => hasRole(user, role), [user]),
    hasAnyRole: useCallback((roles: string[]) => hasAnyRole(user, roles), [user]),
    hasAllPermissions: useCallback((permissions: string[]) => hasAllPermissions(user, permissions), [user]),
    isAdmin: useCallback(() => hasRole(user, 'admin'), [user]),
    isEditor: useCallback(() => hasRole(user, 'editor'), [user]),
    canManageUsers: useCallback(() => hasPermission(user, 'manage_users'), [user]),
    canManageContent: useCallback(() => hasPermission(user, 'manage_content'), [user]),
    canManageSettings: useCallback(() => hasPermission(user, 'manage_settings'), [user])
  };
}

/**
 * Hook for session management
 */
export function useSession(session: AuthSession | null) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);

  useEffect(() => {
    if (!session) {
      setTimeRemaining(0);
      setIsExpiringSoon(false);
      return;
    }

    const updateTime = () => {
      const remaining = getRemainingSessionTime(session);
      const expiringSoon = isSessionExpiringSoon(session);
      
      setTimeRemaining(remaining);
      setIsExpiringSoon(expiringSoon);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session]);

  return {
    timeRemaining,
    isExpiringSoon,
    isValid: session && session.expiresAt > new Date(),
    expiresAt: session?.expiresAt,
    createdAt: session?.createdAt,
    lastActivityAt: session?.lastActivityAt
  };
}

/**
 * Hook for route protection
 */
export function useRouteProtection(
  requiredPermissions?: string[],
  requiredRoles?: string[],
  shouldRedirectToLogin: boolean = true
) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasRequiredPermissions = useCallback(() => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return hasAllPermissions(user, requiredPermissions);
  }, [user, requiredPermissions]);

  const hasRequiredRoles = useCallback(() => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return hasAnyRole(user, requiredRoles);
  }, [user, requiredRoles]);

  const isAuthorized = isAuthenticated && hasRequiredPermissions() && hasRequiredRoles();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && shouldRedirectToLogin) {
      DevUtils.logAuthEvent('REDIRECTING_TO_LOGIN', { 
        reason: 'Route protection - not authenticated' 
      });
      redirectToLogin();
    }
  }, [isLoading, isAuthenticated, shouldRedirectToLogin]);

  return {
    isAuthorized,
    isAuthenticated,
    isLoading,
    hasRequiredPermissions: hasRequiredPermissions(),
    hasRequiredRoles: hasRequiredRoles()
  };
}

/**
 * Hook for development/testing
 */
export function useAuthDev() {
  const [mockMode, setMockMode] = useState(false);
  const [mockUser, setMockUser] = useState<User | null>(null);

  const enableMockMode = useCallback((user?: Partial<User>) => {
    if (process.env.NODE_ENV === 'development') {
      const mock = DevUtils.createMockUser(user);
      setMockUser(mock);
      setMockMode(true);
      SessionStorage.storeSession(mock, DevUtils.createMockSession());
      DevUtils.logAuthEvent('MOCK_MODE_ENABLED', mock);
    }
  }, []);

  const disableMockMode = useCallback(() => {
    setMockMode(false);
    setMockUser(null);
    SessionStorage.clearSession();
    DevUtils.logAuthEvent('MOCK_MODE_DISABLED');
  }, []);

  return {
    mockMode,
    mockUser,
    enableMockMode,
    disableMockMode,
    isDevMode: process.env.NODE_ENV === 'development'
  };
}