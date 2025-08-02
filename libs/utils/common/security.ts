// Cryptographically secure utilities - Next.js 15 compatible

/**
 * Generate cryptographically secure random bytes
 * Fixes the Math.random() vulnerability in CSRF token generation
 */
export function generateSecureRandomBytes(length: number): Uint8Array {
  if (typeof window !== 'undefined') {
    // Client-side: Use Web Crypto API
    return crypto.getRandomValues(new Uint8Array(length));
  } else {
    // Server-side: Use Node.js crypto
    const crypto = require('crypto');
    return crypto.randomBytes(length);
  }
}

/**
 * Generate cryptographically secure random string
 * Replaces insecure Math.random() usage
 */
export function generateSecureRandomString(length: number): string {
  const bytes = generateSecureRandomBytes(length);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate secure CSRF token
 * Fixes critical security vulnerability
 */
export function generateCSRFToken(): string {
  return generateSecureRandomString(32); // 256-bit token
}

/**
 * Generate secure session ID
 */
export function generateSecureSessionId(): string {
  return generateSecureRandomString(64); // 512-bit session ID
}

/**
 * Constant-time string comparison
 * Prevents timing attacks on token comparison
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Hash string using SHA-256 (browser and Node.js compatible)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  if (typeof window !== 'undefined') {
    // Client-side: Use Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Server-side: Use Node.js crypto
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

/**
 * Generate secure API key
 */
export function generateApiKey(): string {
  return generateSecureRandomString(48); // 384-bit API key
}

/**
 * Validate token format (basic security check)
 */
export function isValidTokenFormat(token: string): boolean {
  // Check if token is hex string with minimum length
  const hexRegex = /^[a-f0-9]+$/i;
  return hexRegex.test(token) && token.length >= 32;
}

/**
 * Generate secure nonce for CSP
 */
export function generateNonce(): string {
  return generateSecureRandomString(16); // 128-bit nonce
}