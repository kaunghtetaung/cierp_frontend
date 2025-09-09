// Initializer Token Strategy - Single Responsibility: System initialization token management
import { CacheKeys, CacheTTL } from '@repo/cache';
import { getClientCredentialsToken } from '../core/oidc';
import { getAuthDomain } from '@repo/utils/server';
import type { 
  TokenStrategy, 
  TokenCache, 
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
    private cache: TokenCache
  ) {}

  async getToken(): Promise<string | null> {
    try {
      console.log("🔍 InitializerToken: Checking cache for existing token");
      const stored = await this.cache.get<StoredToken>(CacheKeys.initializerToken());
      
      if (!stored) {
        console.log("⚠️ InitializerToken: No cached token found, fetching new one");
        return await this.refreshToken();
      }
      
      // Check if token is expired (with 5 min buffer)
      const now = Math.floor(Date.now() / 1000);
      if (now >= stored.expiresAt - 300) {
        console.log("⚠️ InitializerToken: Token expired or expiring soon, refreshing");
        await this.cache.del(CacheKeys.initializerToken());
        return await this.refreshToken();
      }
      
      console.log("✅ InitializerToken: Valid cached token found");
      return stored.token;
    } catch (error) {
      console.error("❌ InitializerToken: Error in getToken:", error);
      console.log("🔄 InitializerToken: Attempting to refresh token as fallback");
      // Try to refresh as a fallback
      return await this.refreshToken();
    }
  }

  async refreshToken(): Promise<string | null> {
    const clientId = process.env.TENANT_API_CLIENT_ID;
    const clientSecret = process.env.TENANT_API_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error(
        "❌ InitializerToken: Missing credentials - TENANT_API_CLIENT_ID and TENANT_API_CLIENT_SECRET must be configured"
      );
      return null;
    }

    try {
      console.log("🔄 InitializerToken: Attempting to fetch new token from OIDC");
      console.log(`🔄 InitializerToken: Using client ID: ${clientId.substring(0, 10)}...`);
      
      const authDomain = await getAuthDomain();
      console.log(`🔄 InitializerToken: Auth domain resolved to: ${authDomain}`);

      const tokenData = await getClientCredentialsToken(
        clientId,
        clientSecret,
        "tenant:read"
      );

      const accessToken = tokenData.access_token;
      if (accessToken) {
        console.log("✅ InitializerToken: Successfully obtained new token");
        await this.setInitializerTokenData(tokenData);
        console.log(`✅ InitializerToken: Token cached with expiry: ${tokenData.expires_in}s`);
      } else {
        console.error("❌ InitializerToken: No access token in response");
      }

      return accessToken;
    } catch (error) {
      console.error("❌ InitializerToken: Failed to fetch token from OIDC");
      console.error("❌ InitializerToken: Error details:", error instanceof Error ? error.message : error);
      
      // Log more context for debugging
      if (error instanceof Error && error.message.includes('fetch')) {
        console.error("❌ InitializerToken: Network error - check if auth service is reachable");
      }
      
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