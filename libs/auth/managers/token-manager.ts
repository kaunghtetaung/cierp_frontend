// Refactored Token Manager - SOLID principles implementation
// Single Responsibility: Coordinate token strategies and provide unified API
// Open/Closed: Extensible via strategy injection
// Dependency Inversion: Depends on abstractions (interfaces), not concretions

import { getCacheInstance } from "@repo/cache";
import type {
  TokenType,
  TokenStrategy,
  TokenCache,
  OIDCClient,
} from "../types/token-types";
import { getTenantSecrets } from "@repo/tenant/wrapper";

import { StandardOIDCClient } from "../clients/oidc-client";
import { InitializerTokenStrategy } from "./initializer-token-strategy";
import { TenantTokenStrategy } from "./tenant-token-strategy";
import { UserTokenStrategy } from "./user-token-strategy";

/**
 * Token Manager using Strategy Pattern and Dependency Injection
 *
 * Responsibilities:
 * 1. Coordinate different token strategies
 * 2. Provide unified token access API
 * 3. Handle token priority logic for requests
 */
export class TokenManager {
  private static instance: TokenManager;
  private cache: TokenCache;
  private oidcClient: OIDCClient;

  // Strategy instances - following Dependency Injection principle
  private initializerStrategy: InitializerTokenStrategy;
  private tenantStrategy: TenantTokenStrategy;
  private userStrategy: UserTokenStrategy;

  private constructor() {
    // Dependency injection setup
    this.cache = getCacheInstance() as unknown as TokenCache;
    this.oidcClient = new StandardOIDCClient();

    // Initialize strategies with injected dependencies
    this.initializerStrategy = new InitializerTokenStrategy(
      this.cache,
      this.oidcClient
    );
    this.tenantStrategy = new TenantTokenStrategy(this.cache, this.oidcClient);
    this.userStrategy = new UserTokenStrategy(this.cache, this.oidcClient);
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // ===== INITIALIZER TOKEN METHODS =====
  async getInitializerToken(): Promise<string | null> {
    return await this.initializerStrategy.getToken();
  }

  async setInitializerToken(token: string, expiresIn: number): Promise<void> {
    return await this.initializerStrategy.setInitializerToken(token, expiresIn);
  }

  // ===== TENANT TOKEN METHODS =====
  async getTenantAccessToken(tenantId: string): Promise<string | null> {
    return await this.tenantStrategy.getToken(tenantId);
  }

  async getTenantAccessTokenWithRefresh(
    tenantId: string,
    clientId: string,
    clientSecret: string
  ): Promise<string | null> {
    return await this.tenantStrategy.getTokenWithRefresh(
      tenantId,
      clientId,
      clientSecret
    );
  }

  async refreshTenantAccessToken(
    tenantId: string,
    clientId: string,
    clientSecret: string
  ): Promise<string | null> {
    return await this.tenantStrategy.refreshToken(
      tenantId,
      clientId,
      clientSecret
    );
  }

  async setTenantAccessToken(
    tenantId: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    return await this.tenantStrategy.setTenantAccessToken(
      tenantId,
      token,
      expiresIn
    );
  }

  // ===== USER TOKEN METHODS =====
  async getUserAccessToken(
    tenantId: string,
    userId: string
  ): Promise<string | null> {
    return await this.userStrategy.getUserAccessToken(tenantId, userId);
  }

  async getUserAccessTokenWithRefresh(
    tenantId: string,
    userId: string
  ): Promise<string | null> {
    return await this.userStrategy.getToken(tenantId, userId);
  }

  async refreshUserAccessToken(
    tenantId: string,
    userId: string
  ): Promise<string | null> {
    return await this.userStrategy.refreshToken(tenantId, userId);
  }

  async setUserAccessToken(
    tenantId: string,
    userId: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    return await this.userStrategy.setUserAccessToken(
      tenantId,
      userId,
      token,
      expiresIn
    );
  }

  async setUserRefreshToken(
    tenantId: string,
    userId: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    return await this.userStrategy.setUserRefreshToken(
      tenantId,
      userId,
      refreshToken,
      expiresIn
    );
  }

  async getUserRefreshToken(
    tenantId: string,
    userId: string
  ): Promise<string | null> {
    return await this.userStrategy.getUserRefreshToken(tenantId, userId);
  }

  async ensureValidUserToken(
    tenantId: string,
    userId: string,
    refreshThresholdMinutes: number = 5
  ): Promise<string | null> {
    return await this.userStrategy.ensureValidToken(
      tenantId,
      userId,
      refreshThresholdMinutes
    );
  }

  // ===== TOKEN INVALIDATION METHODS =====
  async invalidateToken(
    type: TokenType,
    tenantId?: string,
    userId?: string
  ): Promise<void> {
    switch (type) {
      case "initializerToken":
        return await this.initializerStrategy.clearToken();
      case "tenantAccessToken":
        if (!tenantId)
          throw new Error("tenantId required for tenant access token");
        return await this.tenantStrategy.clearToken(tenantId);
      case "userAccessToken":
      case "userRefreshToken":
        if (!tenantId || !userId)
          throw new Error("tenantId and userId required for user tokens");
        return await this.userStrategy.clearToken(tenantId, userId);
    }
  }

  async clearTenantTokens(tenantId: string): Promise<void> {
    return await this.tenantStrategy.clearAllTenantTokens(tenantId);
  }

  async clearUserAccessToken(tenantId: string, userId: string): Promise<void> {
    return await this.userStrategy.clearToken(tenantId, userId);
  }

  async clearGlobalTokens(): Promise<void> {
    return await this.initializerStrategy.clearToken();
  }

  // ===== UNIFIED TOKEN REQUEST METHOD =====
  /**
   * Get token for API requests with priority logic
   *
   * Token Priority & Use Cases:
   * 1. User token (with automatic refresh) - FOR USER AUTHENTICATION
   * 2. Tenant token (Client Credentials) - FOR CONTENT/PAGE/POST DATA
   * 3. Initializer token (Client Credentials) - FOR TENANT SETTINGS
   */
  async getTokenForRequest(
    tenantId?: string,
    userId?: string
  ): Promise<string | null> {
    // PRIORITY 1: User token with refresh token support
    if (userId && tenantId) {
      console.log(
        `🔄 Attempting to get user token for userId: ${userId}, tenantId: ${tenantId}`
      );
      const userToken = await this.userStrategy.getToken(tenantId, userId);
      if (userToken) {
        console.log(
          `🎯 Using USER ACCESS TOKEN for ${userId} (with automatic refresh)`
        );
        return userToken;
      }
      console.log(
        `⚠️ No user token available for ${userId}, falling back to tenant token`
      );
    }

    // PRIORITY 2: Tenant token (Client Credentials) - FOR CONTENT/PAGE/POST DATA
    if (tenantId) {
      const tenantToken = await this.tenantStrategy.getToken(tenantId);
      if (tenantToken) {
        console.log(
          `🎯 Using TENANT ACCESS TOKEN for ${tenantId} (for Content/Page/Post)`
        );
        return tenantToken;
      }

      // If no tenant token exists, try to get tenant secrets and refresh
      console.log(
        `🔍 No tenant access token found for ${tenantId}, attempting to refresh from tenant secrets`
      );
      try {
        const tenantSecrets = await getTenantSecrets(tenantId);

        let clientId: string | undefined;
        let clientSecret: string | undefined;

        if (tenantSecrets?.clientId && tenantSecrets?.clientSecret) {
          clientId = tenantSecrets.clientId;
          clientSecret = tenantSecrets.clientSecret;
        } else if (
          tenantSecrets?.apiAccess?.clientId &&
          tenantSecrets?.apiAccess?.clientSecret
        ) {
          clientId = tenantSecrets.apiAccess.clientId;
          clientSecret = tenantSecrets.apiAccess.clientSecret;
        }

        if (clientId && clientSecret) {
          console.log(
            `🔄 Using tenant credentials for ${tenantId}, refreshing token via Client Credentials flow`
          );
          const refreshedToken = await this.tenantStrategy.getTokenWithRefresh(
            tenantId,
            clientId,
            clientSecret
          );
          if (refreshedToken) {
            console.log(
              `✅ Successfully refreshed TENANT ACCESS TOKEN for ${tenantId} - FOR CONTENT/PAGE/POST DATA`
            );
            return refreshedToken;
          }
        } else {
          console.log(
            `⚠️ No client credentials found for tenant ${tenantId}, falling back to initializer token`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error getting tenant secrets for ${tenantId}:`,
          error
        );
      }
    }

    // PRIORITY 3: Initializer token (Client Credentials) - FOR TENANT SETTINGS
    const initializerToken = await this.initializerStrategy.getToken();
    console.log(
      `🔑 Using INITIALIZER TOKEN for request ${
        tenantId ? `(tenant: ${tenantId})` : "(no tenant)"
      } - FOR TENANT SETTINGS: ${initializerToken ? "FOUND" : "NOT FOUND"}`
    );
    return initializerToken;
  }
}
