import {
  createTenantMiddleware,
  type MiddlewareConfig,
  type MiddlewareOptions,
} from "@repo/tenant/middleware-core";
import type { NextRequest } from "next/server";

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
 * Handle app detection from x-app-id header or hostname
 */
async function getAppFromHostname(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  
  // Try to get app ID from x-app-id header first
  const headerAppId = request.headers.get("x-app-id");
  
  let appId: string;
  if (headerAppId) {
    appId = headerAppId;
  } else {
    // Fallback to hostname detection
    try {
      const { getAppFromHostname } = await import("@repo/app-config");
      appId = getAppFromHostname(hostname);
    } catch (error) {
      console.error("Failed to detect app from hostname:", error);
      appId = "core"; // Default fallback
    }
  }
  
  return {
    appId,
    hostname,
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
 * Main middleware implementation
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get app information from hostname
  const { appId, needsCookieUpdate: needsAppCookieUpdate } = await getAppFromHostname(request);

  // Get language information
  const { validLanguage, needsCookieUpdate: needsLangCookieUpdate } = await getValidLanguage(request);

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
    request,
    middlewareConfig,
    "Core",
    middlewareOptions
  );

  // Set additional headers if response exists
  if (response) {
    response.headers.set("x-app-id", appId);
    response.headers.set("x-lang", validLanguage);
  }

  return response;
}
