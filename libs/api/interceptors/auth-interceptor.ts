// Auth Interceptor - Single Responsibility: Authentication token refresh
import { HTTP_STATUS } from "@repo/utils/common/constants";
import { TokenManager } from "../../auth/managers/token-manager";
import { handleTokenRefreshFailure } from "../../auth/auth-error-handler";
import type { ResponseInterceptor, HttpResponseContext } from '../types/http-types';

export class AuthResponseInterceptor implements ResponseInterceptor {
  private refreshPromise: Promise<string> | null = null;
  private tokenManager: TokenManager | null = null;
  private enableAuth: boolean;

  constructor(enableAuth: boolean = true) {
    this.enableAuth = enableAuth;
    // Don't initialize TokenManager immediately to avoid circular dependency
    // Initialize it lazily when needed
  }

  /**
   * Lazy initialization of TokenManager to avoid circular dependencies
   */
  private getTokenManager(): TokenManager | null {
    if (!this.enableAuth) {
      return null;
    }

    if (!this.tokenManager) {
      try {
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
        
        handleTokenRefreshFailure({
          url: context.request.url,
          userLanguage: this.getCurrentLanguage()
        }).catch(authError => {
          console.error('🔐 AuthResponseInterceptor: Auth error handling failed:', authError);
        });
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
      // Extract tenantId from the current request context if available
      const tenantId = context.request.config.tenantId;
      
      // Use TokenManager's proper Client Credentials refresh logic
      // This will handle the priority: User -> Tenant -> Initializer tokens
      const newToken = await tokenManager.getTokenForRequest(tenantId, undefined);
      
      if (!newToken) {
        throw new Error("Failed to refresh token using TokenManager");
      }

      console.log("🔄 Auth Interceptor - Token refreshed successfully using TokenManager");
      return newToken;
    } catch (error) {
      console.error("🔄 Auth Interceptor - Token refresh failed:", error);
      throw error;
    }
  }
}