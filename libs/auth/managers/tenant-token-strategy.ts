// Tenant Token Strategy - Single Responsibility: Tenant token management
import { CacheKeys } from '@repo/cache';
import type { 
  TokenStrategy, 
  TokenCache, 
  OIDCClient, 
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

export class TenantTokenStrategy implements TokenStrategy {
  constructor(
    private cache: TokenCache,
    private oidcClient: OIDCClient
  ) {}

  async getToken(tenantId?: string): Promise<string | null> {
    if (!tenantId) {
      return null;
    }

    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    const stored = await this.cache.get<StoredToken>(cacheKey);
    if (!stored) return null;
    
    // Check if token is expired (with 5 min buffer)
    const now = Math.floor(Date.now() / 1000);
    if (now >= stored.expiresAt - 300) {
      await this.cache.del(cacheKey);
      return null;
    }
    
    return stored.token;
  }

  async refreshToken(tenantId: string, clientId: string, clientSecret: string): Promise<string | null> {
    try {
      
      const apiDomain = await this.oidcClient.getApiDomain();
      const tokenData = await this.oidcClient.fetchClientCredentialsToken(
        clientId,
        clientSecret,
        "api.read",
        apiDomain
      );

      const accessToken = tokenData.access_token;
      if (accessToken) {
        await this.setTenantAccessTokenData(tenantId, tokenData);
      }

      return accessToken;
    } catch (error) {
      console.error(`❌ Failed to refresh tenant access token for ${tenantId}:`, error);
      return null;
    }
  }

  async clearToken(tenantId?: string): Promise<void> {
    if (!tenantId) {
      return;
    }
    await this.cache.del(CacheKeys.tenantAccessToken(tenantId));
  }

  async clearAllTenantTokens(tenantId: string): Promise<void> {
    await this.cache.deletePattern(`ciApp:${tenantId}:Token:*`);
  }

  // Get tenant token with automatic refresh using getSet pattern
  async getTokenWithRefresh(
    tenantId: string,
    clientId: string,
    clientSecret: string
  ): Promise<string | null> {
    try {
      // First try to get existing valid token
      const existingToken = await this.getToken(tenantId);
      if (existingToken) {
        return existingToken;
      }

      // No cached token, fetch new one
      return await this.refreshToken(tenantId, clientId, clientSecret);
    } catch (error) {
      console.error("Error obtaining tenant access token:", error);
      return null;
    }
  }

  async setTenantAccessToken(
    tenantId: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const tokenData: TokenData = {
      access_token: token,
      expires_in: expiresIn,
      token_type: 'bearer'
    };
    
    const storedToken: StoredToken = {
      token,
      tokenData,
      expiresAt: now + expiresIn,
      createdAt: now
    };
    
    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    await this.cache.set(cacheKey, storedToken, expiresIn);
  }

  // New method to set token with full JWT data
  async setTenantAccessTokenData(
    tenantId: string,
    tokenData: TokenData
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const storedToken: StoredToken = {
      token: tokenData.access_token,
      tokenData,
      expiresAt: now + tokenData.expires_in,
      createdAt: now
    };
    
    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    await this.cache.set(cacheKey, storedToken, tokenData.expires_in);
  }

  // Get full token data
  async getTenantAccessTokenData(tenantId: string): Promise<StoredToken | null> {
    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    const stored = await this.cache.get<StoredToken>(cacheKey);
    if (!stored) return null;
    
    // Check if token is expired (with 5 min buffer)
    const now = Math.floor(Date.now() / 1000);
    if (now >= stored.expiresAt - 300) {
      await this.cache.del(cacheKey);
      return null;
    }
    
    return stored;
  }
}