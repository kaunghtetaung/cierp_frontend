// Auth Interceptor - Single Responsibility: Authentication token refresh
import { HTTP_STATUS } from "@repo/utils/common/constants";
import type { ResponseInterceptor, HttpResponseContext } from '../types/http-types';

// Lazy import to avoid circular dependencies
let TokenManager: any;
let handleTokenRefreshFailure: any;

export class AuthResponseInterceptor implements ResponseInterceptor {
  private refreshPromise: Promise<string> | null = null;
  private tokenManager: any = null;
  private enableAuth: boolean;

  constructor(enableAuth: boolean = true) {
    this.enableAuth = enableAuth;
    // Don't initialize TokenManager immediately to avoid circular dependency
    // Initialize it lazily when needed
  }

  /**
   * Lazy initialization of TokenManager to avoid circular dependencies
   */
  private getTokenManager(): any {
    if (!this.enableAuth) {
      return null;
    }

    if (!this.tokenManager) {
      try {
        // Lazy load TokenManager on first use
        if (!TokenManager) {
          TokenManager = require("../../auth/managers/token-manager").TokenManager;
        }
        if (!handleTokenRefreshFailure) {
          handleTokenRefreshFailure = require("../../auth/auth-error-handler").handleTokenRefreshFailure;
        }
        this.tokenManager = TokenManager.getInstance();
      } catch (error) {
        console.warn("Failed to initialize TokenManager:", error);
        return null;
      }
    }

    return this.tokenManager;
  }

  async intercept<T>(context: HttpResponseContext<T>): Promise<HttpResponseContext<T>> {
    // Handle 401 (unauthorized) - attempt token refresh
    const tokenManager = this.getTokenManager();
    if (
      context.response.status === HTTP_STATUS.UNAUTHORIZED &&
      tokenManager
    ) {
      const refreshedToken = await this.refreshAuthToken(context);
      if (refreshedToken) {
        // Retry request with new token
        const newHeaders = { ...context.request.headers };
        newHeaders["Authorization"] = `Bearer ${refreshedToken}`;

        const retryOptions = {
          ...context.request.options,
          headers: newHeaders,
        };

        try {
          const retryResponse = await fetch(context.request.url, retryOptions);
          return {
            ...context,
            response: retryResponse
          };
        } catch (error) {
          return {
            ...context,
            error: error instanceof Error ? error : new Error('Retry failed')
          };
        }
      } else {
        // Token refresh failed - delegate to centralized auth error handler
        console.log("🔐 AuthResponseInterceptor: Token refresh failed, delegating to AuthErrorHandler");
        
        // Ensure handleTokenRefreshFailure is loaded
        if (!handleTokenRefreshFailure) {
          try {
            handleTokenRefreshFailure = require("../../auth/auth-error-handler").handleTokenRefreshFailure;
          } catch (error) {
            console.error("Failed to load handleTokenRefreshFailure:", error);
          }
        }
        
        if (handleTokenRefreshFailure) {
          handleTokenRefreshFailure({
            url: context.request.url,
            userLanguage: this.getCurrentLanguage()
          }).catch((authError: any) => {
            console.error('🔐 AuthResponseInterceptor: Auth error handling failed:', authError);
          });
        }
      }
    }

    return context;
  }

  /**
   * Refresh authentication token using TokenManager's Client Credentials logic
   */
  private async refreshAuthToken<T>(context: HttpResponseContext<T>): Promise<string | null> {
    const tokenManager = this.getTokenManager();
    if (!tokenManager) {
      console.warn("TokenManager not initialized - cannot refresh token");
      return null;
    }

    if (this.refreshPromise) {
      try {
        const token = await this.refreshPromise;
        return token;
      } catch {
        return null;
      }
    }

    this.refreshPromise = this.performTokenRefresh(context);

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } catch {
      return null;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Get current language from various sources
   */
  private getCurrentLanguage(): 'en' | 'mm' {
    try {
      if (typeof window !== 'undefined') {
        // Try URL path first
        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang === 'en' || pathLang === 'mm') {
          return pathLang;
        }
        
        // Try localStorage
        const storedLang = localStorage.getItem('language');
        if (storedLang === 'en' || storedLang === 'mm') {
          return storedLang;
        }
        
        // Try cookie
        const cookieLang = document.cookie.split(';')
          .find(c => c.trim().startsWith('x-lang='))
          ?.split('=')[1];
        if (cookieLang === 'en' || cookieLang === 'mm') {
          return cookieLang;
        }
      }
    } catch (error) {
      // Ignore errors in language detection
    }
    
    return 'en'; // Default fallback
  }

  /**
   * Perform actual token refresh using TokenManager's Client Credentials flow
   * This delegates to TokenManager which handles the proper OIDC Client Credentials refresh
   */
  private async performTokenRefresh<T>(context: HttpResponseContext<T>): Promise<string> {
    const tokenManager = this.getTokenManager();
    if (!tokenManager) {
      throw new Error("TokenManager not initialized");
    }

    try {
      // Extract tenantId and userId from the current request context if available
      const tenantId = context.request.config.tenantId;
      const userId = context.request.config.userId;
      
      console.log("🔄 Auth Interceptor - Starting token refresh", { tenantId, userId });
      
      // Don't preemptively clear tokens - only clear if refresh actually fails
      // The 401 might be due to missing Authorization header, not expired tokens
      
      // Force token refresh instead of getting potentially cached expired token
      let newToken: string | null = null;
      
      if (userId && tenantId) {
        // Attempt user token refresh first
        console.log("🔄 Auth Interceptor - Attempting user token refresh");
        newToken = await tokenManager.refreshUserAccessToken(tenantId, userId);
      }
      
      if (!newToken && tenantId) {
        // Fallback to tenant token refresh
        console.log("🔄 Auth Interceptor - Falling back to tenant token refresh");
        // Get tenant secrets for refresh
        try {
          // const { getTenantSecrets } = await import("@repo/tenant/wrapper"); // Circular dependency - temporarily disabled
          // const tenantSecrets = await getTenantSecrets(tenantId);
          console.warn('getTenantSecrets temporarily disabled due to circular dependency');
          const tenantSecrets = null; // Fallback
          
          let clientId: string | undefined;
          let clientSecret: string | undefined;

          if ((tenantSecrets as any)?.clientId && (tenantSecrets as any)?.clientSecret) {
            clientId = (tenantSecrets as any).clientId;
            clientSecret = (tenantSecrets as any).clientSecret;
          } else if (
            (tenantSecrets as any)?.apiAccess?.clientId &&
            (tenantSecrets as any)?.apiAccess?.clientSecret
          ) {
            clientId = (tenantSecrets as any).apiAccess.clientId;
            clientSecret = (tenantSecrets as any).apiAccess.clientSecret;
          }

          if (clientId && clientSecret) {
            newToken = await tokenManager.refreshTenantAccessToken(tenantId, clientId, clientSecret);
          }
        } catch (secretError) {
          console.warn("🔄 Auth Interceptor - Failed to get tenant secrets for refresh:", secretError);
        }
      }
      
      if (!newToken) {
        // Final fallback - get initializer token
        console.log("🔄 Auth Interceptor - Final fallback to initializer token");
        newToken = await tokenManager.getInitializerToken();
      }
      
      if (!newToken) {
        // Clear tokens only after refresh fails - they are confirmed invalid
        if (userId && tenantId) {
          console.log("🧹 Auth Interceptor - Clearing confirmed invalid user tokens after refresh failure");
          await tokenManager.clearUserAccessToken(tenantId, userId);
        } else if (tenantId) {
          console.log("🧹 Auth Interceptor - Clearing confirmed invalid tenant tokens after refresh failure");
          await tokenManager.clearTenantTokens(tenantId);
        }
        throw new Error("Failed to refresh token - all strategies exhausted");
      }

      console.log("✅ Auth Interceptor - Token refreshed successfully using TokenManager");
      return newToken;
    } catch (error) {
      console.error("❌ Auth Interceptor - Token refresh failed:", error);
      throw error;
    }
  }
}