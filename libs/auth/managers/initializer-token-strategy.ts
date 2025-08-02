// Initializer Token Strategy - Single Responsibility: System initialization token management
import { CacheKeys, CacheTTL } from '@repo/cache';
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

export class InitializerTokenStrategy implements TokenStrategy {
  constructor(
    private cache: TokenCache,
    private oidcClient: OIDCClient
  ) {}

  async getToken(): Promise<string | null> {
    try {
      const stored = await this.cache.get<StoredToken>(CacheKeys.initializerToken());
      if (!stored) {
        // No cached token, fetch new one
        return await this.refreshToken();
      }
      
      // Check if token is expired (with 5 min buffer)
      const now = Math.floor(Date.now() / 1000);
      if (now >= stored.expiresAt - 300) {
        await this.cache.del(CacheKeys.initializerToken());
        // Token expired, fetch new one
        return await this.refreshToken();
      }
      
      return stored.token;
    } catch (error) {
      console.error("Error obtaining initializerToken:", error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    const clientId = process.env.TENANT_API_CLIENT_ID;
    const clientSecret = process.env.TENANT_API_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "TENANT_API_CLIENT_ID and TENANT_API_CLIENT_SECRET must be configured"
      );
    }

    try {

      const apiDomain = await this.oidcClient.getApiDomain();
      const tokenData = await this.oidcClient.fetchClientCredentialsToken(
        clientId,
        clientSecret,
        "tenant:read",
        apiDomain
      );

      const accessToken = tokenData.access_token;
      if (accessToken) {
        await this.setInitializerTokenData(tokenData);
      }

      return accessToken;
    } catch (error) {
      console.error("❌ Failed to fetch initializer token:", error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    await this.cache.del(CacheKeys.initializerToken());
  }

  async setInitializerToken(token: string, expiresIn: number): Promise<void> {
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
    
    await this.cache.set(CacheKeys.initializerToken(), storedToken, expiresIn);
  }

  // New method to set token with full JWT data
  async setInitializerTokenData(tokenData: TokenData): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const storedToken: StoredToken = {
      token: tokenData.access_token,
      tokenData,
      expiresAt: now + tokenData.expires_in,
      createdAt: now
    };
    
    await this.cache.set(CacheKeys.initializerToken(), storedToken, tokenData.expires_in);
  }

  // Get full token data
  async getInitializerTokenData(): Promise<StoredToken | null> {
    const stored = await this.cache.get<StoredToken>(CacheKeys.initializerToken());
    if (!stored) return null;
    
    // Check if token is expired (with 5 min buffer)
    const now = Math.floor(Date.now() / 1000);
    if (now >= stored.expiresAt - 300) {
      await this.cache.del(CacheKeys.initializerToken());
      return null;
    }
    
    return stored;
  }

  // Get initializer token with automatic refresh using getSet pattern
  async getTokenWithRefresh(): Promise<string | null> {
    try {
      const cacheKey = CacheKeys.initializerToken();
      
      // Use cache getSet pattern for atomic refresh
      const token = await this.cache.get<string>(cacheKey);
      if (token) {
        return token;
      }

      // No cached token, fetch new one
      return await this.refreshToken();
    } catch (error) {
      console.error("Error obtaining initializer token:", error);
      return null;
    }
  }
}