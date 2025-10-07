// User Token Strategy - Single Responsibility: User token management
import { CacheKeys, CacheTTL } from '@repo/cache';
import { refreshAccessToken } from '../core/oidc';
import { getTokenConfig, shouldRefreshToken } from '../config/token-config';
import type {
  TokenStrategy,
  TokenCache,
  TokenValidationResult
} from '../types/token-types';
import { TOKEN_CONSTANTS } from '../types/token-types';

// JWT Token data structure
interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

// Stored token with full JWT data (aligned with tokens.ts)
interface StoredToken {
  token: string;
  tokenData: TokenData;
  expiresAt: number;
  type: 'initializer' | 'tenant' | 'user';
  createdAt: number;
}

export class UserTokenStrategy implements TokenStrategy {
  private accessTokenConfig = getTokenConfig('userAccessToken');
  private refreshTokenConfig = getTokenConfig('userRefreshToken');

  constructor(
    private cache: TokenCache
  ) {
    console.log(`📋 UserTokenStrategy initialized with configs:`, {
      accessToken: {
        tokenLifetime: `${this.accessTokenConfig.tokenLifetime}s`,
        redisTTL: `${this.accessTokenConfig.redisTTL}s`,
        safetyMargin: `${this.accessTokenConfig.safetyMargin}s`
      },
      refreshToken: {
        tokenLifetime: `${this.refreshTokenConfig.tokenLifetime}s`,
        redisTTL: `${this.refreshTokenConfig.redisTTL}s`
      }
    });
  }

  async getToken(tenantId?: string, userId?: string): Promise<string | null> {
    if (!tenantId || !userId) {
      return null;
    }

    // Try cached token first - with expiry validation
    const cachedToken = await this.getValidUserAccessToken(tenantId, userId);
    if (cachedToken) {
      return cachedToken;
    }

    // Try refresh token if cached token is expired/invalid
    const refreshToken = await this.getUserRefreshToken(tenantId, userId);
    if (refreshToken) {
      return await this.refreshToken(tenantId, userId);
    }
    return null;
  }

  async refreshToken(tenantId: string, userId: string): Promise<string | null> {
    const refreshToken = await this.getUserRefreshToken(tenantId, userId);
    if (!refreshToken) {
      return null;
    }

    try {
      // Get tenant settings from cache to retrieve logInFlow credentials
      const tenantSettingsKey = CacheKeys.tenantSettings(tenantId);
      const tenantSettings = await this.cache.get<any>(tenantSettingsKey);

      if (!tenantSettings?.secret?.logInFlow) {
        console.error(`❌ [UserTokenStrategy] No cached tenant settings with logInFlow for tenant ${tenantId}`);
        return null;
      }

      const { clientId, clientSecret } = tenantSettings.secret.logInFlow;

      if (!clientId || !clientSecret) {
        console.error(`❌ [UserTokenStrategy] Missing logInFlow credentials for tenant ${tenantId}`);
        return null;
      }

      console.log(`🔄 [UserTokenStrategy] Refreshing user token with logInFlow clientId: ${clientId.substring(0, 10)}...`);
      const tokenData = await refreshAccessToken(refreshToken, clientId, clientSecret);
      

      const accessToken = tokenData.access_token;

      if (accessToken) {
        // Cache the new access token as simple JWT string
        await this.setUserAccessToken(
          tenantId,
          userId,
          accessToken,
          tokenData.expires_in || TOKEN_CONSTANTS.DEFAULT_TOKEN_TTL
        );

        // Update refresh token if provided (token rotation)
        if (tokenData.refresh_token) {
          await this.setUserRefreshToken(
            tenantId,
            userId,
            tokenData.refresh_token,
            TOKEN_CONSTANTS.REFRESH_TOKEN_TTL
          );
        }
        
      }

      return accessToken;
    } catch (error) {
      console.error("Failed to refresh user access token:", error);
      
      // If refresh token is invalid, clear it
      if (error instanceof Error && error.message.includes("400")) {
        await this.cache.del(CacheKeys.userRefreshToken(tenantId, userId));
      }
      
      return null;
    }
  }

  async clearToken(tenantId?: string, userId?: string): Promise<void> {
    if (!tenantId || !userId) {
      return;
    }

    await Promise.all([
      this.cache.del(CacheKeys.userAccessToken(tenantId, userId)),
      this.cache.del(CacheKeys.userRefreshToken(tenantId, userId))
    ]);
  }

  // Proactive token validation
  async ensureValidToken(
    tenantId: string, 
    userId: string, 
    refreshThresholdMinutes: number = TOKEN_CONSTANTS.DEFAULT_REFRESH_THRESHOLD_MINUTES
  ): Promise<string | null> {
    try {
      
      const tokenKey = CacheKeys.userAccessToken(tenantId, userId);
      const currentToken = await this.cache.get<string>(tokenKey);
      
      if (currentToken) {
        const ttl = await this.cache.ttl(tokenKey);
        
        if (ttl > refreshThresholdMinutes * 60) {
          return currentToken;
        }
        
      }
      
      // Token is expired, missing, or will expire soon - refresh it
      return await this.getToken(tenantId, userId);
    } catch (error) {
      console.error("Error ensuring valid user token:", error);
      return await this.getUserAccessToken(tenantId, userId); // Fallback to current token
    }
  }

  // Public helper methods for external access
  async getUserAccessToken(tenantId: string, userId: string): Promise<string | null> {
    return await this.cache.get<string>(CacheKeys.userAccessToken(tenantId, userId));
  }

  // Enhanced method that validates token expiry before returning
  async getValidUserAccessToken(tenantId: string, userId: string): Promise<string | null> {
    const tokenKey = CacheKeys.userAccessToken(tenantId, userId);
    const currentToken = await this.cache.get<string>(tokenKey);

    if (!currentToken) {
      return null;
    }

    // Check if token will expire within the configured safety margin
    const ttl = await this.cache.ttl(tokenKey);

    if (ttl <= this.accessTokenConfig.safetyMargin) {
      console.log(`⏰ UserToken (${userId}): Token expiring soon (${ttl}s remaining, safety margin: ${this.accessTokenConfig.safetyMargin}s), clearing`);
      await this.cache.del(tokenKey);
      return null;
    }

    console.log(`✅ UserToken (${userId}): Valid cached token found (${ttl}s until expiry)`);
    return currentToken;
  }

  // Method to check if a token is valid without returning it
  async isUserTokenValid(tenantId: string, userId: string): Promise<boolean> {
    const validToken = await this.getValidUserAccessToken(tenantId, userId);
    return validToken !== null;
  }

  async setUserAccessToken(
    tenantId: string,
    userId: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    // Use configured Redis TTL instead of token lifetime
    const redisTTL = Math.min(this.accessTokenConfig.redisTTL, expiresIn);

    console.log(`💾 UserAccessToken (${userId}): Caching token with Redis TTL: ${redisTTL}s (token lifetime: ${expiresIn}s)`);
    // Store only the JWT token string for backend offline verification
    await this.cache.set(CacheKeys.userAccessToken(tenantId, userId), token, redisTTL);
  }

  // New method to set token with full JWT data
  async setUserAccessTokenData(
    tenantId: string,
    userId: string,
    tokenData: TokenData
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const storedToken: StoredToken = {
      token: tokenData.access_token,
      tokenData,
      expiresAt: now + tokenData.expires_in,
      type: 'user',
      createdAt: now
    };

    await this.cache.set(CacheKeys.userAccessToken(tenantId, userId), storedToken, tokenData.expires_in);
  }

  async getUserRefreshToken(tenantId: string, userId: string): Promise<string | null> {
    const stored = await this.cache.get<StoredToken>(CacheKeys.userRefreshToken(tenantId, userId));
    if (!stored) {
      console.log(`❌ [getUserRefreshToken] No refresh token found for user=${userId}`);
      return null;
    }

    console.log(`✅ [getUserRefreshToken] Found refresh token for user=${userId}, type=${typeof stored}`);

    // Refresh tokens don't need expiry buffer check - they're long-lived
    return stored.token;
  }

  async setUserRefreshToken(
    tenantId: string,
    userId: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    // Use configured Redis TTL instead of token lifetime
    const redisTTL = Math.min(this.refreshTokenConfig.redisTTL, expiresIn);

    const tokenData: TokenData = {
      access_token: refreshToken, // For refresh tokens, store as access_token
      expires_in: expiresIn,
      token_type: 'refresh'
    };

    const storedToken: StoredToken = {
      token: refreshToken,
      tokenData,
      expiresAt: now + expiresIn,
      type: 'user',
      createdAt: now
    };

    console.log(`💾 UserRefreshToken (${userId}): Caching token with Redis TTL: ${redisTTL}s (token lifetime: ${expiresIn}s)`);
    await this.cache.set(CacheKeys.userRefreshToken(tenantId, userId), storedToken, redisTTL);
  }

  // New method to get full token data
  async getUserAccessTokenData(tenantId: string, userId: string): Promise<StoredToken | null> {
    const stored = await this.cache.get<StoredToken>(CacheKeys.userAccessToken(tenantId, userId));
    if (!stored) return null;
    
    // Check if token is expired (with 5 min buffer)
    const now = Math.floor(Date.now() / 1000);
    if (now >= stored.expiresAt - 300) {
      await this.cache.del(CacheKeys.userAccessToken(tenantId, userId));
      return null;
    }
    
    return stored;
  }

  // Get full refresh token data
  async getUserRefreshTokenData(tenantId: string, userId: string): Promise<StoredToken | null> {
    const stored = await this.cache.get<StoredToken>(CacheKeys.userRefreshToken(tenantId, userId));
    if (!stored) return null;
    
    // Refresh tokens don't need expiry buffer check - they're long-lived
    return stored;
  }
}