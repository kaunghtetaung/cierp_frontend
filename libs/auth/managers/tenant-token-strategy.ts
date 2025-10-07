// Tenant Token Strategy - Single Responsibility: Tenant token management
import { CacheKeys } from '@repo/cache';
import { getClientCredentialsToken } from '../core/oidc';
import { getTokenConfig, shouldRefreshToken } from '../config/token-config';
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

// Stored token with full JWT data (aligned with tokens.ts)
interface StoredToken {
  token: string;
  tokenData: TokenData;
  expiresAt: number;
  type: 'initializer' | 'tenant' | 'user';
  createdAt: number;
}

export class TenantTokenStrategy implements TokenStrategy {
  private config = getTokenConfig('tenantAccessToken');

  constructor(
    private cache: TokenCache
  ) {
    console.log(`📋 TenantTokenStrategy initialized with config:`, {
      tokenLifetime: `${this.config.tokenLifetime}s`,
      redisTTL: `${this.config.redisTTL}s`,
      safetyMargin: `${this.config.safetyMargin}s`,
      refreshThreshold: `${this.config.refreshThreshold}s`
    });
  }

  async getToken(tenantId?: string): Promise<string | null> {
    if (!tenantId) {
      return null;
    }

    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    const stored = await this.cache.get<StoredToken>(cacheKey);
    if (!stored) return null;

    // Check if token is expired using configured safety margin
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = stored.expiresAt - now;

    if (timeUntilExpiry <= this.config.safetyMargin) {
      console.log(`⚠️ TenantToken (${tenantId}): Token expiring soon (${timeUntilExpiry}s remaining, safety margin: ${this.config.safetyMargin}s)`);
      await this.cache.del(cacheKey);
      return null;
    }

    console.log(`✅ TenantToken (${tenantId}): Valid cached token found (${timeUntilExpiry}s until expiry)`);
    return stored.token;
  }

  async refreshToken(tenantId: string, userId?: string): Promise<string | null> {
    // For tenant tokens, get from environment or use defaults
    const clientId = process.env.TENANT_CLIENT_ID || 'default-tenant-client';
    const clientSecret = process.env.TENANT_CLIENT_SECRET || 'default-tenant-secret';
    return this.createTenantToken(tenantId, clientId, clientSecret);
  }

  async createTenantToken(tenantId: string, clientId: string, clientSecret: string): Promise<string | null> {
    try {
      const tokenData = await getClientCredentialsToken(
        clientId,
        clientSecret,
        "api.read"
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
      return await this.createTenantToken(tenantId, clientId, clientSecret);
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

    // Use configured Redis TTL instead of token lifetime
    const redisTTL = Math.min(this.config.redisTTL, expiresIn);

    const tokenData: TokenData = {
      access_token: token,
      expires_in: expiresIn,
      token_type: 'bearer'
    };

    const storedToken: StoredToken = {
      token,
      tokenData,
      expiresAt: now + expiresIn,
      type: 'tenant',
      createdAt: now
    };

    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    console.log(`💾 TenantToken (${tenantId}): Caching token with Redis TTL: ${redisTTL}s (token lifetime: ${expiresIn}s)`);
    await this.cache.set(cacheKey, storedToken, redisTTL);
  }

  // New method to set token with full JWT data
  async setTenantAccessTokenData(
    tenantId: string,
    tokenData: TokenData
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    // Use configured Redis TTL instead of token lifetime
    const redisTTL = Math.min(this.config.redisTTL, tokenData.expires_in);

    const storedToken: StoredToken = {
      token: tokenData.access_token,
      tokenData,
      expiresAt: now + tokenData.expires_in,
      type: 'tenant',
      createdAt: now
    };

    const cacheKey = CacheKeys.tenantAccessToken(tenantId);
    console.log(`💾 TenantToken (${tenantId}): Caching token data with Redis TTL: ${redisTTL}s (token lifetime: ${tokenData.expires_in}s)`);
    await this.cache.set(cacheKey, storedToken, redisTTL);
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