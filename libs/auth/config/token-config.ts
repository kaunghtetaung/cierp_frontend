/**
 * Token Configuration
 *
 * This file defines the lifetime and Redis TTL for each token type.
 *
 * Key Concepts:
 * - Token Lifetime (expires_in): The actual JWT token validity period from OIDC
 * - Redis TTL: How long the token is cached in Redis before being removed
 * - Safety Margin: Buffer time before token expiry to trigger refresh
 *
 * Best Practices:
 * - Redis TTL should be <= Token Lifetime to prevent caching expired tokens
 * - Safety Margin ensures tokens are refreshed before they expire
 * - Longer Redis TTL = fewer token refreshes = better performance
 * - Shorter Redis TTL = more security (forced re-authentication)
 */

export interface TokenLifetimeConfig {
  /**
   * Token lifetime from OIDC (in seconds)
   * This is the actual validity period of the JWT token
   */
  tokenLifetime: number;

  /**
   * Redis cache TTL (in seconds)
   * How long the token is stored in Redis
   * Should be <= tokenLifetime
   */
  redisTTL: number;

  /**
   * Safety margin (in seconds)
   * Time before expiry to trigger refresh
   * E.g., if 300s, token will refresh 5 minutes before expiry
   */
  safetyMargin: number;

  /**
   * Refresh threshold (in seconds)
   * If token TTL is below this, trigger proactive refresh
   */
  refreshThreshold: number;
}

/**
 * Token Configuration Map
 * Define lifetime and caching behavior for each token type
 */
export const TOKEN_LIFETIME_CONFIG: Record<string, TokenLifetimeConfig> = {
  /**
   * Initializer Token (Client Credentials)
   * Used for: Fetching tenant settings, system initialization
   * Grant Type: client_credentials
   * Scope: tenant:read
   */
  initializerToken: {
    tokenLifetime: 600,      // 10 minutes (from OIDC)
    redisTTL: 600,           // 10 minutes (cache full lifetime)
    safetyMargin: 120,       // 2 minutes before expiry
    refreshThreshold: 300,   // Refresh if < 5 minutes remaining
  },

  /**
   * Tenant Access Token (Client Credentials)
   * Used for: Accessing tenant-specific resources, content, pages
   * Grant Type: client_credentials
   * Scope: api.read
   * Credentials: secret.apiAccess.clientId/clientSecret
   */
  tenantAccessToken: {
    tokenLifetime: 86400,    // 24 hours (from OIDC)
    redisTTL: 86400,         // 24 hours (cache full lifetime)
    safetyMargin: 3600,      // 1 hour before expiry
    refreshThreshold: 7200,  // Refresh if < 2 hours remaining
  },

  /**
   * User Access Token (Authorization Code / Refresh Token)
   * Used for: User-authenticated API calls, user-specific operations
   * Grant Type: authorization_code, refresh_token
   * Scope: openid profile email
   * Credentials: secret.logInFlow.clientId/clientSecret
   */
  userAccessToken: {
    tokenLifetime: 3600,     // 1 hour (from OIDC)
    redisTTL: 3600,          // 1 hour (cache full lifetime)
    safetyMargin: 300,       // 5 minutes before expiry
    refreshThreshold: 600,   // Refresh if < 10 minutes remaining
  },

  /**
   * User Refresh Token
   * Used for: Obtaining new user access tokens
   * Grant Type: refresh_token
   * Lifetime: Long-lived token (7 days typical)
   */
  userRefreshToken: {
    tokenLifetime: 7 * 24 * 3600,    // 7 days (from OIDC)
    redisTTL: 7 * 24 * 3600,         // 7 days (cache full lifetime)
    safetyMargin: 24 * 3600,         // 1 day before expiry
    refreshThreshold: 2 * 24 * 3600, // Refresh if < 2 days remaining
  },
};

/**
 * Get token configuration for a specific token type
 */
export function getTokenConfig(tokenType: string): TokenLifetimeConfig {
  const config = TOKEN_LIFETIME_CONFIG[tokenType];
  if (!config) {
    console.warn(`⚠️ No configuration found for token type: ${tokenType}, using default config`);
    return {
      tokenLifetime: 3600,
      redisTTL: 3600,
      safetyMargin: 300,
      refreshThreshold: 600,
    };
  }
  return config;
}

/**
 * Validate token configuration
 * Ensures Redis TTL doesn't exceed token lifetime
 */
export function validateTokenConfig(config: TokenLifetimeConfig): boolean {
  if (config.redisTTL > config.tokenLifetime) {
    console.error(
      `❌ Invalid token config: Redis TTL (${config.redisTTL}s) exceeds token lifetime (${config.tokenLifetime}s)`
    );
    return false;
  }

  if (config.safetyMargin >= config.tokenLifetime) {
    console.error(
      `❌ Invalid token config: Safety margin (${config.safetyMargin}s) exceeds token lifetime (${config.tokenLifetime}s)`
    );
    return false;
  }

  if (config.refreshThreshold >= config.tokenLifetime) {
    console.error(
      `❌ Invalid token config: Refresh threshold (${config.refreshThreshold}s) exceeds token lifetime (${config.tokenLifetime}s)`
    );
    return false;
  }

  return true;
}

/**
 * Calculate effective TTL considering safety margin
 * This is the actual time the token should be considered valid
 */
export function getEffectiveTTL(config: TokenLifetimeConfig): number {
  return config.tokenLifetime - config.safetyMargin;
}

/**
 * Check if token should be refreshed based on remaining TTL
 */
export function shouldRefreshToken(
  remainingTTL: number,
  config: TokenLifetimeConfig
): boolean {
  return remainingTTL <= config.refreshThreshold;
}

/**
 * Get human-readable description of token config
 */
export function describeTokenConfig(tokenType: string): string {
  const config = getTokenConfig(tokenType);
  return `
Token Type: ${tokenType}
- Token Lifetime: ${config.tokenLifetime}s (${Math.floor(config.tokenLifetime / 60)} minutes)
- Redis TTL: ${config.redisTTL}s (${Math.floor(config.redisTTL / 60)} minutes)
- Safety Margin: ${config.safetyMargin}s (${Math.floor(config.safetyMargin / 60)} minutes)
- Refresh Threshold: ${config.refreshThreshold}s (${Math.floor(config.refreshThreshold / 60)} minutes)
- Effective Valid Time: ${getEffectiveTTL(config)}s (${Math.floor(getEffectiveTTL(config) / 60)} minutes)
  `.trim();
}

/**
 * Log all token configurations
 */
export function logAllTokenConfigs(): void {
  console.log('\n📋 Token Lifetime Configuration:');
  console.log('================================\n');

  Object.keys(TOKEN_LIFETIME_CONFIG).forEach(tokenType => {
    console.log(describeTokenConfig(tokenType));
    console.log('');
  });
}
