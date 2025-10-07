// Simplified OIDC Client - No more complex abstractions!
import { getAuthDomain } from "@repo/utils/server";
import { TokenData } from "./tokens";

// Simple types
export interface OIDCConfig {
  authDomain: string;
  clientId: string;
  clientSecret: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

// ===== OIDC TOKEN FUNCTIONS =====

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  codeVerifier?: string
): Promise<TokenData> {
  const authDomain = await getAuthDomain();
  const tokenEndpoint = `${authDomain}/oidc/token`;
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  // Add PKCE code verifier if provided
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json() as TokenResponse;

  // Log token format for debugging
  const isJWT = tokenData.access_token.includes('.');
  const tokenPreview = tokenData.access_token.substring(0, 50);
  console.log(`🔐 OIDC login response - Token format: ${isJWT ? 'JWT' : 'OPAQUE'}, preview: ${tokenPreview}...`);

  return {
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
    scope: tokenData.scope,
    refresh_token: tokenData.refresh_token,
  };
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenData> {
  const authDomain = await getAuthDomain();
  const tokenEndpoint = `${authDomain}/oidc/token`;
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json() as TokenResponse;

  // Log token format for debugging
  const isJWT = tokenData.access_token.includes('.');
  const tokenPreview = tokenData.access_token.substring(0, 50);
  console.log(`🔐 OIDC refresh response - Token format: ${isJWT ? 'JWT' : 'OPAQUE'}, preview: ${tokenPreview}...`);

  return {
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
    scope: tokenData.scope,
    refresh_token: tokenData.refresh_token,
  };
}

/**
 * Get tokens using client credentials flow (for initializer/tenant tokens)
 */
export async function getClientCredentialsToken(
  clientId: string,
  clientSecret: string,
  scope?: string
): Promise<TokenData> {
  const authDomain = await getAuthDomain();
  const tokenEndpoint = `${authDomain}/oidc/token`;
  
  console.log(`🔐 OIDC: Requesting client credentials token from: ${tokenEndpoint}`);
  
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  if (scope) {
    body.append('scope', scope);
    console.log(`🔐 OIDC: Requesting scope: ${scope}`);
  }
  
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OIDC: Token request failed - Status: ${response.status}`);
      console.error(`❌ OIDC: Error response: ${errorText}`);
      throw new Error(`Client credentials token failed: ${response.status} ${errorText}`);
    }
    
    const tokenData = await response.json() as TokenResponse;
    
    console.log(`✅ OIDC: Successfully obtained token, expires in: ${tokenData.expires_in}s`);
    
    return {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    };
  } catch (error) {
    console.error('❌ OIDC: Failed to get client credentials token');
    if (error instanceof Error) {
      console.error('❌ OIDC: Error details:', error.message);
      if (error.message.includes('fetch failed')) {
        console.error(`❌ OIDC: Cannot reach auth service at: ${tokenEndpoint}`);
      }
    }
    throw error;
  }
}

/**
 * Validate a token by introspecting it
 */
export async function introspectToken(
  token: string,
  clientId: string,
  clientSecret: string
): Promise<{
  active: boolean;
  exp?: number;
  iat?: number;
  sub?: string;
  client_id?: string;
  scope?: string;
}> {
  const authDomain = await getAuthDomain();
  const introspectEndpoint = `${authDomain}/oidc/introspect`;
  
  const body = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  const response = await fetch(introspectEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Token introspection failed: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Revoke a token (logout)
 */
export async function revokeToken(
  token: string,
  clientId: string,
  clientSecret: string,
  tokenTypeHint?: 'access_token' | 'refresh_token'
): Promise<void> {
  const authDomain = await getAuthDomain();
  const revokeEndpoint = `${authDomain}/oidc/revoke`;
  
  const body = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  if (tokenTypeHint) {
    body.append('token_type_hint', tokenTypeHint);
  }
  
  const response = await fetch(revokeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Token revocation failed: ${response.status}`);
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Extract user info from JWT ID token
 */
export function extractUserInfoFromJWT(idToken: string): {
  sub?: string;
  email?: string;
  username?: string;
  preferred_username?: string;
  roles?: any[];
  permissions?: string[];
  tenant_id?: string;
  aud?: string;
  iat?: number;
  exp?: number;
} {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return {};

    let base64Payload = parts[1];
    base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }

    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch (error) {
    console.error('Failed to extract user info from JWT:', error);
    return {};
  }
}

/**
 * Check if a JWT token is expired
 */
export function isJWTExpired(token: string, bufferSeconds: number = 300): boolean {
  const payload = extractUserInfoFromJWT(token);
  if (!payload.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return now >= (payload.exp - bufferSeconds);
}

/**
 * Get remaining time for a JWT token in seconds
 */
export function getJWTRemainingTime(token: string): number {
  const payload = extractUserInfoFromJWT(token);
  if (!payload.exp) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

// ===== OIDC URL BUILDERS =====

/**
 * Build authorization URL for OIDC login
 */
export async function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge?: string,
  scope: string = 'openid profile email',
  tenantId?: string
): Promise<string> {
  const authDomain = await getAuthDomain();
  const authUrl = new URL(`${authDomain}/oidc/auth`);
  
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  
  if (codeChallenge) {
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
  }
  
  if (tenantId) {
    authUrl.searchParams.set('tenant_id', tenantId);
  }
  
  return authUrl.toString();
}

/**
 * Build logout URL for OIDC logout
 */
export async function buildLogoutUrl(
  postLogoutRedirectUri?: string,
  idTokenHint?: string
): Promise<string> {
  const authDomain = await getAuthDomain();
  const logoutUrl = new URL(`${authDomain}/logout`);
  
  if (postLogoutRedirectUri) {
    logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  }
  
  if (idTokenHint) {
    logoutUrl.searchParams.set('id_token_hint', idTokenHint);
  }
  
  return logoutUrl.toString();
}

// ===== PKCE UTILITIES =====

/**
 * Generate a PKCE code verifier
 */
export function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate a PKCE code challenge from a verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a secure random state parameter
 */
export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}