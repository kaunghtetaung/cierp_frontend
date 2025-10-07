/**
 * JWT Token Decoder Utilities
 *
 * Decode JWT tokens to extract claims like expiry time
 * WITHOUT verifying the signature (client-side use only)
 */

export interface JWTPayload {
  exp?: number;  // Expiration time (seconds since epoch)
  iat?: number;  // Issued at time (seconds since epoch)
  nbf?: number;  // Not before time (seconds since epoch)
  sub?: string;  // Subject (user ID)
  aud?: string;  // Audience
  iss?: string;  // Issuer
  [key: string]: any; // Additional claims
}

/**
 * Decode JWT token payload without verification
 *
 * ⚠️ WARNING: This does NOT verify the token signature!
 * Only use for reading non-sensitive data like expiry time.
 * Never use for authentication decisions.
 *
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Type guard - ensure token is a string
    if (typeof token !== 'string') {
      console.error('Invalid token type: expected string, got', typeof token);
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.error('Invalid JWT format: expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // JWT uses base64url encoding, need to convert to standard base64
    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Decode base64
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');

    // Parse JSON
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get JWT token expiry time
 *
 * @param token - JWT token string
 * @returns Expiry timestamp (seconds since epoch) or null if not found
 */
export function getJWTExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  return payload?.exp ?? null;
}

/**
 * Get JWT token issued at time
 *
 * @param token - JWT token string
 * @returns Issued at timestamp (seconds since epoch) or null if not found
 */
export function getJWTIssuedAt(token: string): number | null {
  const payload = decodeJWT(token);
  return payload?.iat ?? null;
}

/**
 * Get remaining lifetime of JWT token
 *
 * @param token - JWT token string
 * @returns Remaining seconds until expiry, or null if expired/invalid
 */
export function getJWTRemainingTime(token: string): number | null {
  const exp = getJWTExpiry(token);
  if (!exp) return null;

  const now = Math.floor(Date.now() / 1000);
  const remaining = exp - now;

  return remaining > 0 ? remaining : 0;
}

/**
 * Check if JWT token is expired
 *
 * @param token - JWT token string
 * @returns true if expired, false if valid, null if cannot determine
 */
export function isJWTExpired(token: string): boolean | null {
  const exp = getJWTExpiry(token);
  if (!exp) return null;

  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

/**
 * Get human-readable expiry info
 *
 * @param token - JWT token string
 * @returns Object with expiry information
 */
export function getJWTExpiryInfo(token: string): {
  expiryTimestamp: number | null;
  expiryDate: Date | null;
  remainingSeconds: number | null;
  isExpired: boolean | null;
} {
  const exp = getJWTExpiry(token);

  if (!exp) {
    return {
      expiryTimestamp: null,
      expiryDate: null,
      remainingSeconds: null,
      isExpired: null,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = exp - now;

  return {
    expiryTimestamp: exp,
    expiryDate: new Date(exp * 1000),
    remainingSeconds: remaining > 0 ? remaining : 0,
    isExpired: now >= exp,
  };
}

/**
 * Format seconds to human-readable duration
 *
 * @param seconds - Number of seconds
 * @returns Human-readable duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return 'Expired';
  if (seconds === 0) return 'Expired';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
