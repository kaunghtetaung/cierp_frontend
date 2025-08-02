// Enhanced cookie management with security best practices
//
// SECURITY STANDARD: All cookies follow these rules:
// - httpOnly: true (prevents XSS access)
// - secure: true in production (HTTPS only)
// - domain: .{rootDomain} (root-level domain for subdomain sharing)
// - sameSite: 'lax' or 'strict' (CSRF protection)
// - path: '/' (available across entire domain)
//
import { COOKIE_NAMES } from "@repo/utils/common/constants";

export interface SecureCookieOptions {
  readonly httpOnly?: boolean;
  readonly secure?: boolean;
  readonly sameSite?: "strict" | "lax" | "none";
  readonly maxAge?: number;
  readonly expires?: Date;
  readonly path?: string;
  readonly domain?: string;
  readonly priority?: "low" | "medium" | "high";
}

export interface CookieManagerConfig {
  readonly defaultSecure: boolean;
  readonly defaultHttpOnly: boolean;
  readonly defaultSameSite: "strict" | "lax" | "none";
  readonly defaultPath: string;
  readonly signCookies: boolean;
  readonly encryptCookies: boolean;
}

const DEFAULT_CONFIG: CookieManagerConfig = {
  defaultSecure: process.env.NODE_ENV === "production",
  defaultHttpOnly: true, // Always httpOnly for security
  defaultSameSite: "lax", // More permissive for tenant switching
  defaultPath: "/",
  signCookies: true,
  encryptCookies: false,
};

/**
 * Create secure cookie configuration
 */
export function createSecureCookieOptions(
  options: SecureCookieOptions = {},
  config: Partial<CookieManagerConfig> = {}
): SecureCookieOptions {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    httpOnly: options.httpOnly ?? finalConfig.defaultHttpOnly,
    secure: options.secure ?? finalConfig.defaultSecure,
    sameSite: options.sameSite ?? finalConfig.defaultSameSite,
    path: options.path ?? finalConfig.defaultPath,
    maxAge: options.maxAge,
    expires: options.expires,
    domain: options.domain,
    priority: options.priority ?? "medium",
  };
}

/**
 * Create standard secure cookie options (httpOnly, root domain, secure in production)
 */
export function createStandardCookieOptions(
  tenantDomain: string,
  maxAge: number = 24 * 60 * 60, // 24 hours
  sameSite: "strict" | "lax" | "none" = "lax"
): SecureCookieOptions {
  return {
    httpOnly: true, // Always httpOnly for security
    secure: process.env.NODE_ENV === "production", // Secure in production
    sameSite,
    maxAge,
    path: "/",
    domain: `.${tenantDomain}`, // Always use root-level domain
    priority: "high",
  };
}

/**
 * Create session cookie options
 */
export function createSessionCookieOptions(
  tenantDomain: string,
  maxAge: number = 30 * 60 // 30 minutes
): SecureCookieOptions {
  return createStandardCookieOptions(tenantDomain, maxAge, "strict");
}

/**
 * Create tenant cookie options
 */
export function createTenantCookieOptions(
  tenantDomain: string,
  maxAge: number = 24 * 60 * 60 // 24 hours
): SecureCookieOptions {
  return createStandardCookieOptions(tenantDomain, maxAge, "lax"); // Allow cross-site for tenant switching
}

/**
 * Create CSRF cookie options
 */
export function createCSRFCookieOptions(
  tenantDomain: string,
  maxAge: number = 60 * 60 // 1 hour
): SecureCookieOptions {
  return createStandardCookieOptions(tenantDomain, maxAge, "strict");
}

/**
 * Create theme cookie options (httpOnly for security)
 */
export function createThemeCookieOptions(
  tenantDomain: string,
  maxAge: number = 365 * 24 * 60 * 60 // 1 year
): SecureCookieOptions {
  return createStandardCookieOptions(tenantDomain, maxAge, "lax");
}

/**
 * Create language cookie options (httpOnly for security)
 */
export function createLanguageCookieOptions(
  tenantDomain: string,
  maxAge: number = 365 * 24 * 60 * 60 // 1 year
): SecureCookieOptions {
  return createStandardCookieOptions(tenantDomain, maxAge, "lax");
}

/**
 * Serialize cookie with secure defaults
 */
export function serializeCookie(
  name: string,
  value: string,
  options: SecureCookieOptions = {}
): string {
  const secureOptions = createSecureCookieOptions(options);

  let serialized = `${name}=${encodeURIComponent(value)}`;

  if (secureOptions.maxAge) {
    serialized += `; Max-Age=${secureOptions.maxAge}`;
  }

  if (secureOptions.expires) {
    serialized += `; Expires=${secureOptions.expires.toUTCString()}`;
  }

  if (secureOptions.path) {
    serialized += `; Path=${secureOptions.path}`;
  }

  if (secureOptions.domain) {
    serialized += `; Domain=${secureOptions.domain}`;
  }

  if (secureOptions.httpOnly) {
    serialized += "; HttpOnly";
  }

  if (secureOptions.secure) {
    serialized += "; Secure";
  }

  if (secureOptions.sameSite) {
    serialized += `; SameSite=${secureOptions.sameSite}`;
  }

  if (secureOptions.priority) {
    serialized += `; Priority=${secureOptions.priority}`;
  }

  return serialized;
}

/**
 * Parse cookie string safely
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) return cookies;

  cookieString.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      const value = rest.join("=");
      try {
        cookies[name] = decodeURIComponent(value);
      } catch (error) {
        // Skip malformed cookies
        console.warn(`Failed to decode cookie ${name}:`, error);
      }
    }
  });

  return cookies;
}

/**
 * Get cookie value safely
 */
export function getCookie(
  name: string,
  cookieString?: string
): string | undefined {
  const cookies = parseCookies(
    cookieString || (typeof document !== "undefined" ? document.cookie : "")
  );
  return cookies[name];
}

/**
 * Set cookie safely (client-side)
 */
export function setCookie(
  name: string,
  value: string,
  options: SecureCookieOptions = {}
): void {
  if (typeof document === "undefined") {
    console.warn("setCookie called on server-side");
    return;
  }

  document.cookie = serializeCookie(name, value, options);
}

/**
 * Delete cookie safely
 */
export function deleteCookie(
  name: string,
  options: Pick<SecureCookieOptions, "path" | "domain"> = {}
): void {
  if (typeof document === "undefined") {
    console.warn("deleteCookie called on server-side");
    return;
  }

  document.cookie = serializeCookie(name, "", {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Cookie manager class for server-side operations
 */
export class ServerCookieManager {
  private cookies: Record<string, string> = {};
  private setCookieHeaders: string[] = [];

  constructor(cookieHeader?: string) {
    if (cookieHeader) {
      this.cookies = parseCookies(cookieHeader);
    }
  }

  get(name: string): string | undefined {
    return this.cookies[name];
  }

  set(name: string, value: string, options: SecureCookieOptions = {}): void {
    this.cookies[name] = value;
    this.setCookieHeaders.push(serializeCookie(name, value, options));
  }

  delete(
    name: string,
    options: Pick<SecureCookieOptions, "path" | "domain"> = {}
  ): void {
    delete this.cookies[name];
    this.setCookieHeaders.push(
      serializeCookie(name, "", {
        ...options,
        maxAge: 0,
        expires: new Date(0),
      })
    );
  }

  getHeaders(): string[] {
    return this.setCookieHeaders;
  }

  clearHeaders(): void {
    this.setCookieHeaders = [];
  }
}

/**
 * Validate cookie name
 */
export function isValidCookieName(name: string): boolean {
  // Cookie names cannot contain control characters, whitespace, or separators
  const invalidChars = /[\x00-\x20\x7f-\xff()<>@,;:\\"/\[\]?={}]/;
  return !invalidChars.test(name) && name.length > 0;
}

/**
 * Validate cookie value
 */
export function isValidCookieValue(value: string): boolean {
  // Cookie values cannot contain control characters, whitespace, double quotes, commas, semicolons, or backslashes
  const invalidChars = /[\x00-\x20\x7f-\xff";,\\]/;
  return !invalidChars.test(value);
}

/**
 * Sanitize cookie value
 */
export function sanitizeCookieValue(value: string): string {
  // Remove or encode problematic characters
  return value.replace(/[\x00-\x20\x7f-\xff";,\\]/g, "");
}

/**
 * Create secure cookie for authentication
 */
export function createAuthCookie(
  name: string,
  value: string,
  tenantDomain?: string,
  maxAge: number = 30 * 60 // 30 minutes
): string {
  const options = createSessionCookieOptions(tenantDomain, maxAge);
  return serializeCookie(name, value, options);
}

/**
 * Create secure cookie for tenant identification
 */
export function createTenantCookie(
  tenantId: string,
  tenantDomain: string,
  maxAge: number = 24 * 60 * 60 // 24 hours
): string {
  const options = createTenantCookieOptions(tenantDomain, maxAge);
  return serializeCookie(COOKIE_NAMES.TENANT_ID, tenantId, options);
}
