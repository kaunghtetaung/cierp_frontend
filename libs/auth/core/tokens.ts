// Simplified Token Management - Following your established patterns
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import { getTenantSecrets } from "@repo/tenant/wrapper";

// Simple types (much cleaner than before)
export interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

export interface StoredToken {
  token: string;
  tokenData: TokenData; // Store full JWT token data
  expiresAt: number;
  type: 'initializer' | 'tenant' | 'user';
  createdAt: number;
}

// Constants
const TOKEN_EXPIRY_BUFFER = 300; // 5 minutes buffer
const DEFAULT_TOKEN_TTL = 3600; // 1 hour

// ===== INITIALIZER TOKEN FUNCTIONS =====

export async function getInitializerToken(): Promise<string | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.initializerToken();
  
  const stored = await cache.get<StoredToken>(key);
  
  // If token exists and is valid, return it
  if (stored && Date.now() < (stored.expiresAt - TOKEN_EXPIRY_BUFFER) * 1000) {
    console.log("✅ InitializerToken: Valid cached token found");
    return stored.token;
  }
  
  // Token doesn't exist or is expired, try to refresh
  console.log("🔄 InitializerToken: No valid cached token, attempting to refresh");
  
  // Clear expired token if it exists
  if (stored) {
    await cache.del(key);
  }
  
  try {
    const clientId = process.env.TENANT_API_CLIENT_ID;
    const clientSecret = process.env.TENANT_API_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error("❌ InitializerToken: Missing TENANT_API_CLIENT_ID or TENANT_API_CLIENT_SECRET");
      return null;
    }
    
    console.log(`🔄 InitializerToken: Using client ID: ${clientId.substring(0, 10)}...`);
    
    // Get new token from OIDC
    const { getClientCredentialsToken } = await import('./oidc');
    const tokenData = await getClientCredentialsToken(
      clientId,
      clientSecret,
      "tenant:read"
    );
    
    // Store the new token
    await setInitializerToken(tokenData);
    console.log(`✅ InitializerToken: Successfully refreshed and cached token (expires in ${tokenData.expires_in}s)`);
    
    return tokenData.access_token;
  } catch (error) {
    console.error("❌ InitializerToken: Failed to refresh token:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function setInitializerToken(tokenData: TokenData): Promise<void> {
  const cache = getCacheInstance();
  const key = CacheKeys.initializerToken();
  
  const now = Math.floor(Date.now() / 1000);
  const storedToken: StoredToken = {
    token: tokenData.access_token,
    tokenData,
    expiresAt: now + tokenData.expires_in,
    type: 'initializer',
    createdAt: now
  };
  
  await cache.set(key, storedToken, tokenData.expires_in);
}


export async function getInitializerTokenData(): Promise<StoredToken | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.initializerToken();
  
  const stored = await cache.get<StoredToken>(key);
  if (!stored) return null;
  
  // Check if token is expired (with buffer)
  if (Date.now() >= (stored.expiresAt - TOKEN_EXPIRY_BUFFER) * 1000) {
    await cache.del(key);
    return null;
  }
  
  return stored;
}

export async function clearInitializerToken(): Promise<void> {
  const cache = getCacheInstance();
  await cache.del(CacheKeys.initializerToken());
}

// ===== TENANT TOKEN FUNCTIONS =====

export async function getTenantToken(tenantId: string): Promise<string | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.tenantAccessToken(tenantId);

  const stored = await cache.get<StoredToken>(key);

  // If token exists and is valid, return it
  if (stored && Date.now() < (stored.expiresAt - TOKEN_EXPIRY_BUFFER) * 1000) {
    console.log("✅ TenantToken: Valid cached token found for", tenantId);
    return stored.token;
  }

  // Token doesn't exist or is expired, try to refresh
  console.log("🔄 TenantToken: No valid cached token for", tenantId, "attempting to refresh");

  // Clear expired token if it exists
  if (stored) {
    await cache.del(key);
  }

  try {
    // Get tenant settings from CACHE (doesn't need token because backend caches it after first fetch)
    const tenantSettingsKey = CacheKeys.tenantSettings(tenantId);
    const cachedTenantSettings = await cache.get<any>(tenantSettingsKey);

    if (!cachedTenantSettings?.secret?.apiAccess) {
      console.log("⚠️ TenantToken: No cached tenant settings with secrets found, cannot auto-renew");
      return null;
    }

    const { clientId, clientSecret } = cachedTenantSettings.secret.apiAccess;

    if (!clientId || !clientSecret) {
      console.error("❌ TenantToken: Missing API credentials in cached settings for tenant", tenantId);
      return null;
    }

    console.log(`🔄 TenantToken: Using cached credentials, client ID: ${clientId.substring(0, 10)}...`);

    // Get new token from OIDC
    const { getClientCredentialsToken } = await import('./oidc');
    const tokenData = await getClientCredentialsToken(
      clientId,
      clientSecret,
      "api.read"
    );

    // Store the new token
    await setTenantToken(tenantId, tokenData);
    console.log(`✅ TenantToken: Successfully refreshed and cached token for ${tenantId} (expires in ${tokenData.expires_in}s)`);

    return tokenData.access_token;
  } catch (error) {
    console.error("❌ TenantToken: Failed to refresh token for", tenantId, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function setTenantToken(tenantId: string, tokenData: TokenData): Promise<void> {
  const cache = getCacheInstance();
  const key = CacheKeys.tenantAccessToken(tenantId);
  
  const now = Math.floor(Date.now() / 1000);
  const storedToken: StoredToken = {
    token: tokenData.access_token,
    tokenData,
    expiresAt: now + tokenData.expires_in,
    type: 'tenant',
    createdAt: now
  };
  
  await cache.set(key, storedToken, tokenData.expires_in);
}


export async function getTenantTokenData(tenantId: string): Promise<StoredToken | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.tenantAccessToken(tenantId);
  
  const stored = await cache.get<StoredToken>(key);
  if (!stored) return null;
  
  // Check if token is expired (with buffer)
  if (Date.now() >= (stored.expiresAt - TOKEN_EXPIRY_BUFFER) * 1000) {
    await cache.del(key);
    return null;
  }
  
  return stored;
}

export async function clearTenantToken(tenantId: string): Promise<void> {
  const cache = getCacheInstance();
  await cache.del(CacheKeys.tenantAccessToken(tenantId));
}

// ===== USER TOKEN FUNCTIONS =====

export async function getUserAccessToken(tenantId: string, userId: string): Promise<string | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.userAccessToken(tenantId, userId);

  console.log(`✅ [getUserAccessToken] Checking user access token for tenant=${tenantId}, user=${userId}`);
  const token = await cache.get<string>(key);

  // If we have a valid token, check if it's expired
  if (token) {
    // Parse JWT to check expiration
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        let base64Payload = parts[1];
        base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
        while (base64Payload.length % 4) {
          base64Payload += '=';
        }

        const payload = JSON.parse(atob(base64Payload));
        const expiresAt = payload.exp; // JWT exp is in seconds since epoch

        // Check if token is still valid (with 5-minute buffer)
        if (expiresAt && Date.now() < (expiresAt - TOKEN_EXPIRY_BUFFER) * 1000) {
          console.log(`✅ [getUserAccessToken] Valid token found (expires in ${expiresAt - Math.floor(Date.now() / 1000)}s)`);
          return token;
        }

        console.log(`⚠️ [getUserAccessToken] Token expired or expiring soon, attempting refresh`);
      }
    } catch (error) {
      console.error(`❌ [getUserAccessToken] Failed to parse JWT:`, error);
    }
  } else {
    console.log(`❌ [getUserAccessToken] No cached token found`);
  }

  // Token is expired or missing - try to refresh using refresh token
  console.log(`🔄 [getUserAccessToken] Attempting to refresh user access token`);
  return await refreshUserAccessTokenWithRefreshToken(tenantId, userId);
}

/**
 * Refresh user access token using refresh token
 */
async function refreshUserAccessTokenWithRefreshToken(
  tenantId: string,
  userId: string
): Promise<string | null> {
  try {
    // Get refresh token
    const refreshToken = await getUserRefreshToken(tenantId, userId);

    if (!refreshToken) {
      console.log(`❌ [refreshUserAccessToken] No refresh token found for user=${userId}`);
      return null;
    }

    console.log(`🔄 [refreshUserAccessToken] Found refresh token, calling OIDC to refresh`);

    // Use OIDC client to refresh the token
    const { refreshAccessToken } = await import('./oidc');
    const newTokenData = await refreshAccessToken(refreshToken);

    if (!newTokenData || !newTokenData.access_token) {
      console.error(`❌ [refreshUserAccessToken] Failed to get new token from OIDC`);
      // Clear invalid refresh token
      await clearUserTokens(tenantId, userId);
      return null;
    }

    console.log(`✅ [refreshUserAccessToken] Successfully refreshed token (expires in ${newTokenData.expires_in}s)`);

    // Store new access token
    await setUserAccessToken(tenantId, userId, newTokenData.access_token, newTokenData.expires_in);

    // Store new refresh token if provided
    if (newTokenData.refresh_token) {
      await setUserRefreshToken(tenantId, userId, newTokenData.refresh_token);
    }

    return newTokenData.access_token;
  } catch (error) {
    console.error(`❌ [refreshUserAccessToken] Error refreshing user token:`, error instanceof Error ? error.message : error);
    // Clear tokens on refresh failure
    await clearUserTokens(tenantId, userId);
    return null;
  }
}

export async function setUserAccessToken(
  tenantId: string, 
  userId: string, 
  token: string,
  expiresIn: number
): Promise<void> {
  const cache = getCacheInstance();
  const key = CacheKeys.userAccessToken(tenantId, userId);
  
  console.log(`[setUserAccessToken] key: ${key}, expiresIn: ${expiresIn}`);
  console.log(`[setUserAccessToken] token length: ${token?.length || 0}`);
  
  // Store only JWT token string for backend offline verification
  await cache.set(key, token, expiresIn);
}


export async function getUserAccessTokenData(tenantId: string, userId: string): Promise<StoredToken | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.userAccessToken(tenantId, userId);
  
  // User access tokens are stored as raw JWT strings (not StoredToken objects)
  const rawJwtToken = await cache.get<string>(key);
  if (!rawJwtToken) return null;
  
  try {
    // Extract expiry from JWT's exp claim
    const parts = rawJwtToken.split('.');
    if (parts.length !== 3) {
      await cache.del(key);
      return null;
    }
    
    let base64Payload = parts[1];
    base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }
    
    const payload = JSON.parse(atob(base64Payload));
    const expiresAt = payload.exp; // JWT exp is in seconds since epoch
    const issuedAt = payload.iat || Math.floor(Date.now() / 1000); // Fallback to now if iat missing
    
    if (!expiresAt) {
      await cache.del(key);
      return null;
    }
    
    // Check if token is expired (with buffer)
    if (Date.now() >= (expiresAt - TOKEN_EXPIRY_BUFFER) * 1000) {
      await cache.del(key);
      return null;
    }
    
    // Create a StoredToken-compatible object from the raw JWT
    const tokenData: TokenData = {
      access_token: rawJwtToken,
      expires_in: expiresAt - issuedAt,
      token_type: 'Bearer'
    };
    
    const storedToken: StoredToken = {
      token: rawJwtToken,
      tokenData,
      expiresAt: expiresAt,
      type: 'user',
      createdAt: issuedAt
    };
    
    return storedToken;
  } catch (error) {
    console.error('Failed to parse user access token JWT:', error);
    await cache.del(key);
    return null;
  }
}

export async function getUserRefreshToken(tenantId: string, userId: string): Promise<string | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.userRefreshToken(tenantId, userId);
  
  const stored = await cache.get<StoredToken>(key);
  if (!stored) return null;
  
  // Refresh tokens don't need expiry buffer check - they're long-lived
  return stored.token;
}

export async function setUserRefreshToken(
  tenantId: string, 
  userId: string, 
  refreshToken: string, 
  expiresIn: number = 7 * 24 * 3600 // 7 days
): Promise<void> {
  const cache = getCacheInstance();
  const key = CacheKeys.userRefreshToken(tenantId, userId);
  
  const now = Math.floor(Date.now() / 1000);
  const tokenData: TokenData = {
    access_token: refreshToken, // For refresh tokens, we store the refresh token as access_token
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
  
  await cache.set(key, storedToken, expiresIn);
}

export async function getUserRefreshTokenData(tenantId: string, userId: string): Promise<StoredToken | null> {
  const cache = getCacheInstance();
  const key = CacheKeys.userRefreshToken(tenantId, userId);
  
  const stored = await cache.get<StoredToken>(key);
  if (!stored) return null;
  
  // Refresh tokens don't need expiry buffer check - they're long-lived
  return stored;
}

export async function clearUserTokens(tenantId: string, userId: string): Promise<void> {
  const cache = getCacheInstance();
  await Promise.all([
    cache.del(CacheKeys.userAccessToken(tenantId, userId)),
    cache.del(CacheKeys.userRefreshToken(tenantId, userId))
  ]);
}

// ===== TOKEN PRIORITY LOGIC (Simplified) =====

/**
 * Get the best available token for a request
 * Priority: User token > Tenant token > Initializer token
 */
export async function getTokenForRequest(tenantId?: string, userId?: string): Promise<string | null> {
  console.log(`[TokenManager] Getting token for request: tenantId=${tenantId}, userId=${userId}`);
  
  // Try user token if we have both tenantId and userId
  if (tenantId && userId) {
    const userToken = await getUserAccessToken(tenantId, userId);
    if (userToken) {
      console.log(`[TokenManager] ✅ Using userAccessToken for tenant=${tenantId}, user=${userId}`);
      return userToken;
    }
    console.log(`[TokenManager] ❌ No userAccessToken found for tenant=${tenantId}, user=${userId}`);
  }
  
  // Try tenant token if we have tenantId
  if (tenantId) {
    const tenantToken = await getTenantToken(tenantId);
    if (tenantToken) {
      console.log(`[TokenManager] ⚠️  Using tenantAccessToken for tenant=${tenantId}`);
      return tenantToken;
    }
    console.log(`[TokenManager] ❌ No tenantAccessToken found for tenant=${tenantId}`);
  }
  
  // Fallback to initializer token
  const initToken = await getInitializerToken();
  if (initToken) {
    console.log(`[TokenManager] ⚠️  Using initializerToken as fallback`);
  } else {
    console.log(`[TokenManager] ❌ No tokens available!`);
  }
  return initToken;
}

// ===== TOKEN REFRESH LOGIC =====

export async function refreshUserTokenIfNeeded(
  tenantId: string, 
  userId: string, 
  refreshTokenFn: (refreshToken: string) => Promise<TokenData>
): Promise<string | null> {
  // Check if access token is expired
  const accessToken = await getUserAccessToken(tenantId, userId);
  if (accessToken) return accessToken; // Still valid
  
  // Get refresh token
  const refreshToken = await getUserRefreshToken(tenantId, userId);
  if (!refreshToken) return null;
  
  try {
    // Use the provided refresh function
    const tokenData = await refreshTokenFn(refreshToken);
    
    // Store new tokens with correct parameters
    await setUserAccessToken(tenantId, userId, tokenData.access_token, tokenData.expires_in);
    if (tokenData.refresh_token) {
      await setUserRefreshToken(tenantId, userId, tokenData.refresh_token);
    }
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear invalid refresh token
    await clearUserTokens(tenantId, userId);
    return null;
  }
}

// New function to get full token data for API requests
export async function getTokenDataForRequest(tenantId?: string, userId?: string): Promise<StoredToken | null> {
  // Try user token if we have both tenantId and userId
  if (tenantId && userId) {
    const userTokenData = await getUserAccessTokenData(tenantId, userId);
    if (userTokenData) return userTokenData;
  }
  
  // Try tenant token if we have tenantId
  if (tenantId) {
    const tenantTokenData = await getTenantTokenData(tenantId);
    if (tenantTokenData) return tenantTokenData;
  }
  
  // Fallback to initializer token
  return await getInitializerTokenData();
}

// ===== UTILITY FUNCTIONS =====

export async function clearAllTokens(): Promise<void> {
  const cache = getCacheInstance();
  // Clear all token patterns following your established cache key structure
  try {
    await cache.deletePattern('ciApp:*:Token:*');
    await cache.del(CacheKeys.initializerToken());
  } catch (error) {
    console.warn('Failed to clear all tokens:', error);
  }
}

export async function getTokenMetadata(tenantId?: string, userId?: string): Promise<{
  hasInitializer: boolean;
  hasTenant: boolean;
  hasUser: boolean;
  initializerData?: StoredToken;
  tenantData?: StoredToken;
  userData?: StoredToken;
}> {
  const [initializer, tenant, user] = await Promise.all([
    getInitializerTokenData(),
    tenantId ? getTenantTokenData(tenantId) : null,
    tenantId && userId ? getUserAccessTokenData(tenantId, userId) : null
  ]);
  
  return {
    hasInitializer: !!initializer,
    hasTenant: !!tenant,
    hasUser: !!user,
    initializerData: initializer || undefined,
    tenantData: tenant || undefined,
    userData: user || undefined
  };
}