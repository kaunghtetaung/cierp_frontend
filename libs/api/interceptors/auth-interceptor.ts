// Auth Interceptor - Single Responsibility: Authentication token refresh
import { HTTP_STATUS } from "@repo/utils/common/constants";
import { TokenManager } from "@repo/auth/token-manager";
import type { ResponseInterceptor, HttpResponseContext } from '../types/http-types';

export class AuthResponseInterceptor implements ResponseInterceptor {
  private refreshPromise: Promise<string> | null = null;
  private tokenManager: TokenManager | null = null;

  constructor(enableAuth: boolean = true) {
    if (enableAuth) {
      this.tokenManager = TokenManager.getInstance();
    }
  }

  async intercept<T>(context: HttpResponseContext<T>): Promise<HttpResponseContext<T>> {
    // Handle 401 (unauthorized) - attempt token refresh
    if (
      context.response.status === HTTP_STATUS.UNAUTHORIZED &&
      this.tokenManager
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
    if (!this.tokenManager) {
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
    if (!this.tokenManager) {
      throw new Error("TokenManager not initialized");
    }

    try {
      // Extract tenantId from the current request context if available
      const tenantId = context.request.config.tenantId;
      
      // Use TokenManager's proper Client Credentials refresh logic
      // This will handle the priority: User -> Tenant -> Initializer tokens
      const newToken = await this.tokenManager.getTokenForRequest(tenantId, undefined);
      
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