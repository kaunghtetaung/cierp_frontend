// User Token Strategy - Single Responsibility: User token management
import { CacheKeys, CacheTTL } from '@repo/cache';
import type { 
  TokenStrategy, 
  TokenCache, 
  OIDCClient, 
  TokenValidationResult,
  TOKEN_CONSTANTS 
} from '../types/token-types';

// JWT Token data structure
interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

// Stored token with full JWT data
interface StoredToken {
  token: string;
  tokenData: TokenData;
  expiresAt: number;
  createdAt: number;
}

export class UserTokenStrategy implements TokenStrategy {
  constructor(
    private cache: TokenCache,
    private oidcClient: OIDCClient
  ) {}

  async getToken(tenantId?: string, userId?: string): Promise<string | null> {
    if (!tenantId || !userId) {
      return null;
    }

    // Try cached token first
    const cachedToken = await this.getUserAccessToken(tenantId, userId);
    if (cachedToken) {
      return cachedToken;
    }

    // Try refresh token
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
      
      const tokenData = await this.oidcClient.refreshUserToken(refreshToken);
      

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

  async setUserAccessToken(
    tenantId: string,
    userId: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    // Store only the JWT token string for backend offline verification
    await this.cache.set(CacheKeys.userAccessToken(tenantId, userId), token, expiresIn);
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
      createdAt: now
    };
    
    await this.cache.set(CacheKeys.userAccessToken(tenantId, userId), storedToken, tokenData.expires_in);
  }

  async getUserRefreshToken(tenantId: string, userId: string): Promise<string | null> {
    const stored = await this.cache.get<StoredToken>(CacheKeys.userRefreshToken(tenantId, userId));
    if (!stored) return null;
    
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
    const tokenData: TokenData = {
      access_token: refreshToken, // For refresh tokens, store as access_token
      expires_in: expiresIn,
      token_type: 'refresh'
    };
    
    const storedToken: StoredToken = {
      token: refreshToken,
      tokenData,
      expiresAt: now + expiresIn,
      createdAt: now
    };
    
    await this.cache.set(CacheKeys.userRefreshToken(tenantId, userId), storedToken, expiresIn);
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