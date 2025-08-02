// Header Builder Strategy - Single Responsibility: HTTP header construction
import { getCookie } from "@repo/security/cookies";
import { COOKIE_NAMES } from "@repo/utils/common/constants";
import { getTokenForRequest } from "@repo/auth/core";
import type { HeaderBuilder, HttpClientConfig } from '../types/http-types';
import { HTTP_CONSTANTS } from '../types/http-types';
import type { HttpMethod, ApiRequestConfig } from "@repo/types";

export class StandardHeaderBuilder implements HeaderBuilder {
  private csrfToken: string | null = null;

  constructor(private config: HttpClientConfig) {
    this.initializeCSRFToken();
  }

  private initializeCSRFToken(): void {
    // Only initialize CSRF token from cookies (server-side rendering safe)
    if (typeof window !== "undefined") {
      this.csrfToken = getCookie(COOKIE_NAMES.CSRF_TOKEN) || null;
    }
  }

  async buildHeaders(
    method: HttpMethod,
    customHeaders: Record<string, string>,
    config: ApiRequestConfig
  ): Promise<Record<string, string>> {
    const {
      tenantId,
      userSessionId,
      withAuth = this.config.enableAuth
    } = config;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };

    // Add tenant ID header (server-side operations should pass tenantId explicitly)
    if (tenantId) {
      headers["x-tenant-id"] = tenantId;
    }

    // Add CSRF token for unsafe methods
    if (
      this.config.enableCSRF &&
      (HTTP_CONSTANTS.UNSAFE_HTTP_METHODS as readonly string[]).includes(method)
    ) {
      await this.ensureCSRFToken();
      if (this.csrfToken) {
        headers["X-CSRF-Token"] = this.csrfToken;
      }
    }

    // Add auth token using TokenManager (server-side only)
    if (withAuth) {
      const token = await this.getAuthToken(tenantId, config.userId);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Get authentication token using simplified auth functions (server-side only)
   */
  private async getAuthToken(tenantId?: string, userId?: string): Promise<string | null> {
    if (!this.config.enableAuth) {
      return null;
    }

    try {
      // Get appropriate token using simplified function
      // All tokens are managed server-side with Redis caching
      const token = await getTokenForRequest(
        tenantId,
        userId
      );
      return token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }

  /**
   * Ensure CSRF token is available
   */
  private async ensureCSRFToken(): Promise<void> {
    if (this.csrfToken) return;

    try {
      // Get CSRF token from API
      const response = await fetch(`${this.config.baseURL}/csrf-token`, {
        credentials: this.config.withCredentials ? "include" : "omit",
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.token;
      }
    } catch (error) {
      console.warn("Failed to get CSRF token:", error);
    }
  }

  /**
   * Update CSRF token
   */
  setCSRFToken(token: string | null): void {
    this.csrfToken = token;
  }

  /**
   * Clear CSRF token
   */
  clearCSRFToken(): void {
    this.csrfToken = null;
  }
}