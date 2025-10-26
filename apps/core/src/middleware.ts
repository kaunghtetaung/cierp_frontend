import {
  createTenantMiddleware,
  type MiddlewareConfig,
  type MiddlewareOptions,
} from "@repo/tenant/middleware-core";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "@repo/utils/common/constants";
import { getPublicUrl } from "@repo/utils/server/domain";
import { wrapMiddleware, logMiddlewareError } from "@repo/utils/server";

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (static images)
     * Note: Including API routes so middleware can set tenant context
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};

/**
 * Static files and common excludes
 */
const STATIC_EXCLUDES = [
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/_vercel",
  "/ping",
  "/uploads/",
  "/images/",
] as const;

/**
 * Non-auth API routes that should be excluded
 */
const PUBLIC_API_EXCLUDES = [
  "/api/health",
  "/api/ping",
  "/api/status",
  "/api/lang",
  "/api/logs", // Client-side console logger endpoint (has own security)
] as const;

/**
 * Configuration for standard routes
 */
const coreConfig: Partial<MiddlewareConfig> = {
  excludePaths: [...STATIC_EXCLUDES, ...PUBLIC_API_EXCLUDES],
  enableLogging: process.env.NODE_ENV === "development",
};

/**
 * Configuration for auth routes (excludes only static files)
 */
const authConfig: Partial<MiddlewareConfig> = {
  excludePaths: [...STATIC_EXCLUDES],
  enableLogging: process.env.NODE_ENV === "development",
};

/**
 * Handle app detection from x-app-id header, URL path, or hostname
 */
async function getAppFromRequest(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  
  // Try to get app ID from x-app-id header first
  const headerAppId = request.headers.get("x-app-id");
  
  let appId: string;
  if (headerAppId) {
    appId = headerAppId;
  } else {
    // Extract appId directly from URL path
    const pathSegments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    appId = pathSegments.length > 0 ? pathSegments[0] : "core";
  }
  
  return {
    appId,
    hostname,
    pathname,
    needsCookieUpdate: request.cookies.get("x-app-id")?.value !== appId,
  };
}

/**
 * Handle language detection and validation
 */
async function getValidLanguage(request: NextRequest) {
  const { languageService } = await import("@repo/language");
  const config = languageService.getConfig();

  // Check for x-lang cookie from client request
  const cookieLanguage = request.cookies.get(config.cookieName!)?.value;
  const language = cookieLanguage || config.defaultLanguage!;

  // Only update cookie if:
  // 1. No existing cookie, OR
  // 2. Existing cookie has invalid language
  const isValidCookieLanguage = cookieLanguage && languageService.isValidLanguage(cookieLanguage);
  
  return {
    validLanguage: isValidCookieLanguage 
      ? cookieLanguage 
      : config.defaultLanguage!,
    needsCookieUpdate: !isValidCookieLanguage,
    config,
  };
}

/**
 * Check if route requires authentication
 */
function requiresAuthentication(pathname: string): boolean {
  // Skip auth check for API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) return false;

  // Skip auth for static files and public routes
  const publicRoutes = ["/error", "/login", "/callback"];
  return !publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get WWW subdomain based on environment
 * Production: www
 * Development: www-dev
 */
function getWwwSubdomain(): string {
  const envSubdomain = process.env.WWW_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }
  // Default: use 'www' for production, 'www-dev' for development
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? 'www-dev' : 'www';
}

/**
 * Handle authentication redirect
 */
async function handleAuthRedirect(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the actual hostname and protocol from request headers
    const hostname = request.headers.get("host") || "localhost";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.search;

    // Construct the proper return URL using actual request details
    const actualUrl = `${protocol}://${hostname}${pathname}${searchParams}`;
    const returnUrl = encodeURIComponent(actualUrl);

    const publicUrl = await getPublicUrl();
    const loginUrl = `${publicUrl}/login?returnUrl=${returnUrl}`;

    console.log(`[AUTH_REDIRECT] Redirecting from ${actualUrl} to: ${loginUrl}`);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    // Log error to Loki
    await logMiddlewareError(
      error,
      request,
      'core-middleware',
      'auth-redirect',
      { attemptedUrl: request.url }
    );

    // Fallback: construct URL from request hostname with environment-based subdomain
    const hostname = request.headers.get("host") || "localhost";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseDomain = hostname.split(':')[0].replace(/^(core|api|auth|www|www-dev)\./, '');
    const wwwSubdomain = getWwwSubdomain();
    const fallbackLoginUrl = `${protocol}://${wwwSubdomain}.${baseDomain}/login`;
    console.log(`[AUTH_REDIRECT] Using fallback URL with ${wwwSubdomain} subdomain: ${fallbackLoginUrl}`);
    return NextResponse.redirect(fallbackLoginUrl);
  }
}

/**
 * Main middleware implementation
 */
export async function middleware(request: NextRequest) {
  return wrapMiddleware(request, 'core-middleware', async (req) => {
    const pathname = req.nextUrl.pathname;

    // Get app information from request (path-based detection)
    const { appId, needsCookieUpdate: needsAppCookieUpdate } = await getAppFromRequest(req);

    // Get language information
    const { validLanguage, needsCookieUpdate: needsLangCookieUpdate } = await getValidLanguage(req);

    // NEW: Check session cookie for authenticated routes
    if (requiresAuthentication(pathname)) {
      const sessionCookie = req.cookies.get(COOKIE_NAMES.SESSION)?.value;

      if (!sessionCookie) {
        // No session cookie found - redirect to login
        return await handleAuthRedirect(req);
      }
    }

    // Determine which config to use based on route
    const isAuthRoute = pathname.startsWith("/api/auth");
    const middlewareConfig = isAuthRoute ? authConfig : coreConfig;

    // Prepare middleware options
    const middlewareOptions: MiddlewareOptions = {
      appId,
      shouldSetLanguageCookie: needsLangCookieUpdate && !isAuthRoute,
      shouldSetAppCookie: needsAppCookieUpdate && !isAuthRoute,
      customLanguage: validLanguage,
    };

    // Run tenant middleware with enhanced cookie handling
    const response = await createTenantMiddleware(
      req,
      middlewareConfig,
      "Core",
      middlewareOptions
    );

    // Set additional headers if response exists
    if (response) {
      response.headers.set("x-app-id", appId);
      response.headers.set("x-lang", validLanguage);
      response.headers.set("x-pathname", pathname);

      // NEW: Forward session ID to layout for auth validation
      const sessionCookie = req.cookies.get(COOKIE_NAMES.SESSION)?.value;
      if (sessionCookie) {
        response.headers.set("x-session-id", sessionCookie);
      }
    }

    return response;
  });
}
