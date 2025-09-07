// Authentication provider component
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  useAuth,
  type UseAuthReturn,
  type UseAuthOptions,
} from "../hooks/hooks";
import { DevUtils } from "../utils/login-utils";
import {
  getPublicUrlClient,
  getCurrentUrlClient,
} from "@repo/utils/client/domain";
import { getAuthErrorHandler } from "../auth-error-handler";
import { toastWarning, toastInfo, toastSuccess, toastError } from "@repo/utils";
import type { User, AuthSession } from "@repo/types";

export interface AuthContextValue extends UseAuthReturn {
  // Additional context-specific properties
  initializing: boolean;
  sessionExpiringInMinutes: number | null;
  extendSession: () => Promise<boolean>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
  options?: UseAuthOptions;
  initialUser?: User | null;
  initialSession?: AuthSession | null;
  fallback?: React.ReactNode;
  onInitialized?: (isAuthenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider component
 */
export function AuthProvider({
  children,
  options = {},
  initialUser,
  initialSession,
  fallback,
  onInitialized,
}: AuthProviderProps) {
  const [initializing, setInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sessionExpiringInMinutes, setSessionExpiringInMinutes] = useState<number | null>(null);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Initialize auth hook first
  const auth = useAuth({
    autoRefresh: true,
    refreshThreshold: 5,
    ...options,
  });

  // Function to extend session
  const extendSession = async (): Promise<boolean> => {
    try {
      DevUtils.logAuthEvent("SESSION_EXTEND_REQUESTED", {});
      
      // Try to refresh the session (refreshSession throws on error, doesn't return boolean)
      if (auth.refreshSession) {
        await auth.refreshSession();
        
        // If we reach here, the refresh was successful
        setHasShownWarning(false);
        setSessionExpiringInMinutes(null);
        
        // Enhanced success feedback with prominent styling
        const language = getCurrentLanguage();
        toastSuccess(
          language === 'mm'
            ? '🎉 အကောင့်ဝင်ခွင့် သက်တမ်းတိုးပြီးပါပြီ'
            : '🎉 Session extended successfully',
          {
            duration: 5000
          }
        );
        
        DevUtils.logAuthEvent("SESSION_EXTENDED", { success: true });
        return true;
      }
      
      // Enhanced error handling for extension failure
      const language = getCurrentLanguage();
      toastError(
        language === 'mm'
          ? 'အကောင့်ဝင်ခွင့် သက်တမ်းတိုးမှု မအောင်မြင်ပါ'
          : 'Failed to extend session',
        {
          duration: 8000,
          action: {
            label: language === 'mm' ? 'လော့ဂ်အင်' : 'Login',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          }
        }
      );
      
      DevUtils.logAuthEvent("SESSION_EXTEND_FAILED", {});
      return false;
    } catch (error) {
      console.error("Failed to extend session:", error);
      
      // Enhanced error handling with better user guidance
      const language = getCurrentLanguage();
      toastError(
        language === 'mm'
          ? '⚠️ အကောင့်ဝင်ခွင့် သက်တမ်းတိုးရာတွင် ပြဿနာတွေ့ရှိပါသည်'
          : '⚠️ Session extension failed',
        {
          duration: 10000,
          action: {
            label: language === 'mm' ? 'ထပ်စမ်း' : 'Retry',
            onClick: extendSession
          }
        }
      );
      
      DevUtils.logAuthEvent("SESSION_EXTEND_ERROR", error);
      return false;
    }
  };

  // Get current language for notifications
  const getCurrentLanguage = (): 'en' | 'mm' => {
    try {
      if (typeof window !== 'undefined') {
        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang === 'en' || pathLang === 'mm') {
          return pathLang;
        }
        const storedLang = localStorage.getItem('language');
        if (storedLang === 'en' || storedLang === 'mm') {
          return storedLang;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return 'en';
  };

  // Use effects to handle auth state changes and session monitoring
  useEffect(() => {
    // Handle auth state changes
    DevUtils.logAuthEvent("AUTH_CONTEXT_CHANGED", {
      isAuthenticated: auth.isAuthenticated,
      user: auth.user?.email,
    });
    
    // Reset warning state when authentication state changes
    if (!auth.isAuthenticated) {
      setHasShownWarning(false);
      setSessionExpiringInMinutes(null);
    }
    
    options.onAuthChange?.(auth.isAuthenticated, auth.user);
  }, [auth.isAuthenticated, auth.user]);

  // Session expiring monitoring
  useEffect(() => {
    if (auth.session?.expiresAt) {
      const checkSessionExpiration = () => {
        const expiresAt = new Date(auth.session!.expiresAt).getTime();
        const now = Date.now();
        const minutesRemaining = Math.floor((expiresAt - now) / (1000 * 60));
        
        if (minutesRemaining > 0 && minutesRemaining <= 5) {
          DevUtils.logAuthEvent("SESSION_EXPIRING", { minutesRemaining });
          setSessionExpiringInMinutes(minutesRemaining);
          
          // Show warning notification at 5 minutes and 1 minute
          if ((minutesRemaining === 5 || minutesRemaining === 1) && !hasShownWarning) {
            setHasShownWarning(true);
            const language = getCurrentLanguage();
            
            toastWarning(
              language === 'mm'
                ? `⚠️ သင့်အကောင့်ဝင်ခွင့် ${minutesRemaining} မိနစ်အတွင်း သက်တမ်းကုန်မည်`
                : `⚠️ Your session will expire in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`,
              {
                duration: minutesRemaining === 1 ? 15000 : 10000, // Longer duration for critical 1-minute warning
                action: {
                  label: language === 'mm' ? '🔄 သက်တမ်းတိုး' : '🔄 Extend',
                  onClick: extendSession
                }
              }
            );
            
            // Reset warning flag after some time so we can show it again
            setTimeout(() => setHasShownWarning(false), 30000);
          }
          
          options.onSessionExpiring?.(minutesRemaining);
        }
      };
      
      // Check immediately and then every minute
      checkSessionExpiration();
      const interval = setInterval(checkSessionExpiration, 60000);
      
      return () => clearInterval(interval);
    }
  }, [auth.session?.expiresAt, hasShownWarning]);

  // Error handling
  useEffect(() => {
    if (auth.error) {
      DevUtils.logAuthEvent("AUTH_CONTEXT_ERROR", auth.error);
      
      // Use centralized auth error handler for authentication errors
      const errorHandler = getAuthErrorHandler();
      if (!errorHandler.isHandling()) {
        errorHandler.handleAuthError(auth.error, {
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userLanguage: getCurrentLanguage()
        }).catch(authError => {
          console.error('AuthProvider: Auth error handling failed:', authError);
        });
      }
      
      options.onError?.(new Error(auth.error));
    }
  }, [auth.error]);

  // Handle initialization
  useEffect(() => {
    if (!hasInitialized && !auth.isLoading) {
      setInitializing(false);
      setHasInitialized(true);
      onInitialized?.(auth.isAuthenticated);
      DevUtils.logAuthEvent("AUTH_PROVIDER_INITIALIZED", {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user?.email,
      });
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.user,
    hasInitialized,
    onInitialized,
  ]);

  // Set initial data if provided
  useEffect(() => {
    if (initialUser && initialSession && !auth.user) {
      DevUtils.logAuthEvent("SETTING_INITIAL_AUTH_DATA", {
        user: initialUser.email,
        sessionId: initialSession.id,
      });
      // Note: This would require extending the auth hook to accept initial data
      // For now, we'll just log it
    }
  }, [initialUser, initialSession, auth.user]);

  const contextValue: AuthContextValue = {
    ...auth,
    initializing,
    sessionExpiringInMinutes,
    extendSession,
  };

  // Show fallback during initialization
  if (initializing && fallback) {
    return <>{fallback}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}

/**
 * Higher-order component for authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredPermissions?: string[];
    requiredRoles?: string[];
    fallback?: React.ComponentType;
    redirect?: boolean;
  } = {}
) {
  const {
    requiredPermissions = [],
    requiredRoles = [],
    fallback: Fallback,
    redirect = true,
  } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuthContext();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      if (isLoading) return;

      if (!isAuthenticated) {
        setIsAuthorized(false);
        if (redirect) {
          // Check if already on login page to prevent infinite redirect loop
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login')) {
            window.location.href = "/login";
          }
        }
        return;
      }

      // Check permissions
      const hasPermissions =
        requiredPermissions.length === 0 ||
        requiredPermissions.every((permission) =>
          user?.permissions.includes(permission as any)
        );

      // Check roles
      const hasRoles =
        requiredRoles.length === 0 ||
        requiredRoles.some((role) => user?.roles.includes(role as any));

      setIsAuthorized(hasPermissions && hasRoles);
    }, [isAuthenticated, isLoading, user]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return Fallback ? <Fallback /> : <div>Please log in</div>;
    }

    if (!isAuthorized) {
      return Fallback ? <Fallback /> : <div>Access denied</div>;
    }

    return <Component {...props} />;
  };
}

/**
 * Authentication guard component
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  loginFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  redirect?: boolean;
}

export function AuthGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
  loginFallback,
  loadingFallback,
  redirect = true,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <>{loadingFallback || <div>Loading...</div>}</>;
  }

  if (!isAuthenticated) {
    if (redirect) {
      useEffect(() => {
        const publicWebUrl = getPublicUrlClient();
        const currentUrl = getCurrentUrlClient();
        
        // Check if already on login page to prevent infinite redirect loop
        const isLoginPage = currentUrl.includes('/login');
        
        if (!isLoginPage) {
          const redirectUrl = encodeURIComponent(currentUrl);
          // Redirect to publicWeb login page
          window.location.href = `${publicWebUrl}/login?redirect_url=${redirectUrl}`;
        }
      }, []);
      
      // Check if we're on login page
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      if (!currentUrl.includes('/login')) {
        return null;
      }
    }
    return <>{loginFallback || <div>Please log in</div>}</>;
  }

  // Check permissions
  const hasPermissions =
    requiredPermissions.length === 0 ||
    requiredPermissions.every((permission) =>
      user?.permissions.includes(permission as any)
    );

  // Check roles
  const hasRoles =
    requiredRoles.length === 0 ||
    requiredRoles.some((role) => user?.roles.includes(role as any));

  if (!hasPermissions || !hasRoles) {
    return <>{fallback || <div>Access denied</div>}</>;
  }

  return <>{children}</>;
}

/**
 * Loading component for authentication
 */
export interface AuthLoadingProps {
  fallback?: React.ReactNode;
  className?: string;
}

export function AuthLoading({ fallback, className }: AuthLoadingProps) {
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={className || "flex items-center justify-center p-8"}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );
}

/**
 * Error boundary for authentication errors
 */
export interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error) => void;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    DevUtils.logAuthEvent("AUTH_ERROR_BOUNDARY_CAUGHT", { error, errorInfo });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error!}
            reset={() => this.setState({ hasError: false, error: undefined })}
          />
        );
      }

      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || "Something went wrong"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Development component for testing authentication
 */
export function AuthDevTools() {
  const { user, isAuthenticated, login, logout } = useAuthContext();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm">
      <h3 className="font-semibold mb-2">Auth Dev Tools</h3>
      <div className="mb-2">
        <strong>Status:</strong>{" "}
        {isAuthenticated ? "Authenticated" : "Not authenticated"}
      </div>
      {user && (
        <div className="mb-2">
          <strong>User:</strong> {user.email}
        </div>
      )}
      <div className="space-x-2">
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={() => login()}
            className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
          >
            Login
          </button>
        ) : (
          <button
            type="button"
            onClick={() => logout()}
            className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
