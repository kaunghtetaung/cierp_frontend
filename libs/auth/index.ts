// Main exports from auth package

// Client-side authentication components and hooks
export * from './components/auth-provider';
export * from './hooks/hooks';
export * from './components/login-page';
export * from './utils/login-utils';

// Note: Server-side functions, API routes, and TokenManager are not exported here to prevent client-side imports

// Re-export commonly used client-side utilities
export {
  AuthProvider,
  useAuthContext,
  withAuth,
  AuthGuard,
  AuthLoading,
  AuthErrorBoundary,
  AuthDevTools,
  type AuthContextValue,
  type AuthProviderProps,
  type AuthGuardProps,
  type AuthLoadingProps,
  type AuthErrorBoundaryProps
} from './components/auth-provider';

export {
  useAuth,
  usePermissions,
  useSession,
  useRouteProtection,
  useAuthDev,
  type UseAuthOptions,
  type AuthState,
  type AuthActions,
  type UseAuthReturn
} from './hooks/hooks';

export {
  LoginPage,
  LoginButton,
  LogoutButton,
  UserProfile,
  type LoginPageProps,
  type LoginButtonProps,
  type LogoutButtonProps,
  type UserProfileProps
} from './components/login-page';

export {
  initiateLogin,
  initiateLogout,
  getAuthStatus,
  refreshSession,
  hasPermission,
  hasRole,
  hasAnyRole,
  hasAllPermissions,
  isSessionExpiringSoon,
  getRemainingSessionTime,
  createLoginUrl,
  getCurrentReturnUrl,
  redirectToLogin,
  SessionStorage,
  AuthError,
  handleAuthError,
  DevUtils
} from './utils/login-utils';

// Server-side utilities are intentionally not exported here
// Import them directly from './server' in server components only

// TokenManager is intentionally not exported here (server-only)
// Import it directly from './token-manager' in server components only

// SOLID Architecture Components (server-only)
// New refactored token management following SOLID principles
// Import these directly in server components:
// - './refactored-token-manager' - Main refactored manager
// - './initializer-token-strategy' - Initializer token strategy
// - './tenant-token-strategy' - Tenant token strategy  
// - './user-token-strategy' - User token strategy
// - './oidc-client' - OIDC client implementation
// - './token-types' - Types and interfaces

// API route handlers are intentionally not exported here to prevent client-side imports
// Import them directly from './api-routes' in server components only