// Auth Interceptor - Single Responsibility: Authentication token refresh
import { HTTP_STATUS } from "@repo/utils/common/constants";
import { TokenManager } from "@repo/auth/token-manager";
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