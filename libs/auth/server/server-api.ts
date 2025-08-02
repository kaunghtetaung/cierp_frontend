// Server-only functions - should only be imported in server components and API routes
// This file should never be imported in client components

// API route handlers
export {
  handleLoginRequest,
  handleAuthCallback,
  handleLogout,
  handleSessionStatus,
  handleRefreshSession
} from '../routes/api-routes';

// Server-side authentication utilities
export {
  getAuthenticationStatus,
  getCurrentUser,
  getCurrentSession,
  hasPermission as serverHasPermission,
  hasRole as serverHasRole,
  requireAuth,
  requirePermission,
  requireRole,
  createAuthSession,
  destroyAuthSession,
  cleanExpiredSessions
} from './server';

// Token management (server-only)
export {
  TokenManager,
  type TokenType,
  type TokenData,
  type TokenMetadata,
  type OIDCConfig
} from '../managers/token-manager';