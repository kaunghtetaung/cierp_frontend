// Enhanced CSRF protection with cryptographically secure tokens
import {
  generateSecureRandomString,
  constantTimeEquals,
} from "@repo/utils/common/security";
import { SECURITY_CONFIG } from "@repo/utils/common/constants";

export interface CSRFTokenData {
  readonly token: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}

export interface CSRFConfig {
  readonly tokenLength: number;
  readonly expiryMinutes: number;
  readonly headerName: string;
  readonly cookieName: string;
  readonly formFieldName: string;
}

const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  tokenLength: SECURITY_CONFIG.CSRF_TOKEN_LENGTH,
  expiryMinutes: 60,
  headerName: "X-CSRF-Token",
  cookieName: "csrf-token",
  formFieldName: "_csrf_token",
};

/**
 * Generate cryptographically secure CSRF token
 * Fixes critical security vulnerability from Math.random()
 */
export function generateCSRFToken(
  config: Partial<CSRFConfig> = {}
): CSRFTokenData {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const token = generateSecureRandomString(finalConfig.tokenLength);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + finalConfig.expiryMinutes * 60 * 1000
  );

  return {
    token,
    expiresAt,
    createdAt: now,
  };
}

/**
 * Validate CSRF token with constant-time comparison
 * Prevents timing attacks
 */
export function validateCSRFToken(
  providedToken: string,
  storedTokenData: CSRFTokenData,
  config: Partial<CSRFConfig> = {}
): boolean {
  // Check if token has expired
  if (new Date() > storedTokenData.expiresAt) {
    return false;
  }

  // Check token length to prevent basic attacks
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  if (providedToken.length !== finalConfig.tokenLength * 2) {
    // hex string is 2x length
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeEquals(providedToken, storedTokenData.token);
}

/**
 * Create CSRF token for forms
 */
export function createCSRFFormToken(config: Partial<CSRFConfig> = {}): string {
  const tokenData = generateCSRFToken(config);
  return tokenData.token;
}

/**
 * Validate CSRF token from request headers
 */
export function validateCSRFHeader(
  headers: Record<string, string>,
  storedTokenData: CSRFTokenData,
  config: Partial<CSRFConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const token = headers[finalConfig.headerName.toLowerCase()];

  if (!token) {
    return false;
  }

  return validateCSRFToken(token, storedTokenData, config);
}

/**
 * Validate CSRF token from form data
 */
export function validateCSRFFormData(
  formData: Record<string, string>,
  storedTokenData: CSRFTokenData,
  config: Partial<CSRFConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const token = formData[finalConfig.formFieldName];

  if (!token) {
    return false;
  }

  return validateCSRFToken(token, storedTokenData, config);
}

/**
 * Double-submit cookie pattern implementation
 */
export interface DoubleSubmitCSRFData {
  readonly cookieToken: string;
  readonly headerToken: string;
  readonly expiresAt: Date;
}

export function generateDoubleSubmitCSRF(
  config: Partial<CSRFConfig> = {}
): DoubleSubmitCSRFData {
  const tokenData = generateCSRFToken(config);

  return {
    cookieToken: tokenData.token,
    headerToken: tokenData.token,
    expiresAt: tokenData.expiresAt,
  };
}

export function validateDoubleSubmitCSRF(
  cookieToken: string,
  headerToken: string,
  expiresAt: Date
): boolean {
  // Check expiration
  if (new Date() > expiresAt) {
    return false;
  }

  // Both tokens must be present
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must match (constant-time comparison)
  return constantTimeEquals(cookieToken, headerToken);
}

/**
 * Create CSRF middleware configuration
 */
export interface CSRFMiddlewareConfig extends CSRFConfig {
  readonly skipRoutes: string[];
  readonly safeMethods: string[];
  readonly onValidationError?: (error: CSRFValidationError) => void;
}

export interface CSRFValidationError {
  readonly type: "missing" | "invalid" | "expired";
  readonly message: string;
  readonly timestamp: Date;
}

const DEFAULT_MIDDLEWARE_CONFIG: CSRFMiddlewareConfig = {
  ...DEFAULT_CSRF_CONFIG,
  skipRoutes: ["/api/health", "/api/auth/callback"],
  safeMethods: ["GET", "HEAD", "OPTIONS"],
  onValidationError: (error) => {
    console.error("CSRF validation error:", error);
  },
};

/**
 * Validate CSRF for middleware
 */
export function validateCSRFMiddleware(
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
  },
  config: Partial<CSRFMiddlewareConfig> = {}
): { valid: boolean; error?: CSRFValidationError } {
  const finalConfig = { ...DEFAULT_MIDDLEWARE_CONFIG, ...config };

  // Skip validation for safe methods
  if (finalConfig.safeMethods.includes(request.method)) {
    return { valid: true };
  }

  // Skip validation for excluded routes
  const url = new URL(request.url, "http://localhost");
  if (finalConfig.skipRoutes.some((route) => url.pathname.startsWith(route))) {
    return { valid: true };
  }

  const cookieToken = request.cookies[finalConfig.cookieName];
  const headerToken = request.headers[finalConfig.headerName.toLowerCase()];

  if (!cookieToken || !headerToken) {
    const error: CSRFValidationError = {
      type: "missing",
      message: "CSRF token missing from request",
      timestamp: new Date(),
    };
    finalConfig.onValidationError?.(error);
    return { valid: false, error };
  }

  // For double-submit pattern, we need to compare cookie and header tokens
  if (!constantTimeEquals(cookieToken, headerToken)) {
    const error: CSRFValidationError = {
      type: "invalid",
      message: "CSRF token mismatch",
      timestamp: new Date(),
    };
    finalConfig.onValidationError?.(error);
    return { valid: false, error };
  }

  return { valid: true };
}

/**
 * Generate CSRF token for Next.js API routes
 */
export function generateCSRFForAPI(): {
  token: string;
  cookie: {
    name: string;
    value: string;
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: "strict" | "lax" | "none";
      maxAge: number;
      path: string;
    };
  };
} {
  const tokenData = generateCSRFToken();

  return {
    token: tokenData.token,
    cookie: {
      name: DEFAULT_CSRF_CONFIG.cookieName,
      value: tokenData.token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      },
    },
  };
}
