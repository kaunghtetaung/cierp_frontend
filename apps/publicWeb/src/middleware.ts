// PublicWeb app middleware using common tenant middleware library
import {
  createTenantMiddleware,
  type MiddlewareConfig,
  type MiddlewareOptions,
  DEFAULT_CONFIG,
} from "@repo/tenant/middleware-core";
import type { NextRequest } from "next/server";

/**
 * Common static file exclusions
 */
const STATIC_EXCLUSIONS = [
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
 * PublicWeb specific middleware configuration
 */
const publicWebConfig: Partial<MiddlewareConfig> = {
  excludePaths: [
    ...STATIC_EXCLUSIONS,
    // Exclude specific non-auth API routes
    "/api/health",
    "/api/ping",
    "/api/status",
    "/api/lang",
    // Exclude Redis test routes
    "/redis",
    "/api/redis/test",
    // Exclude error pages to prevent infinite redirects
    "/error/tenant-not-found",
  ],
  enableLogging: process.env.NODE_ENV === "development",
};

/**
 * Configuration for auth API routes (more permissive)
 */
const authApiConfig: Partial<MiddlewareConfig> = {
  excludePaths: [...STATIC_EXCLUSIONS],
  enableLogging: process.env.NODE_ENV === "development",
};

/**
 * Handles language detection and validation
 */
async function getValidLanguage(request: NextRequest) {
  const { languageService } = await import("@repo/language");
  const config = languageService.getConfig();

  const cookieLanguage = request.cookies.get(config.cookieName!)?.value;
  const language = cookieLanguage || config.defaultLanguage!;

  return {
    validLanguage: languageService.isValidLanguage(language)
      ? language
      : config.defaultLanguage!,
    needsCookieUpdate: !languageService.isValidLanguage(cookieLanguage || ""),
    config,
  };
}

/**
 * Handle app detection for PublicWeb (dynamically from x-app-id header, URL path, or hostname)
 */
async function getAppInfo(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  
  // Try to get app ID from x-app-id header first
  const headerAppId = request.headers.get("x-app-id");
  
  let appId: string;
  if (headerAppId) {
    appId = headerAppId;
  } else {
    // For PublicWeb, always use "PublicWeb" as the appId
    // The getAppFromHostname function might return "core" for certain domains
    // but this is the PublicWeb app, so we should always use "PublicWeb"
    appId = "PublicWeb";
    
    // Optional: Still call the function for logging purposes
    try {
      const { getAppFromHostname } = await import("@repo/app-config");
      const detectedApp = getAppFromHostname(hostname, pathname);
      if (detectedApp !== "PublicWeb") {
        console.log(`Note: getAppFromHostname returned "${detectedApp}" but using "PublicWeb" for PublicWeb app`);
      }
    } catch (error) {
      // Silently continue with "PublicWeb"
    }
  }
  
  const currentAppCookie = request.cookies.get("x-app-id")?.value;
  
  return {
    appId,
    needsCookieUpdate: currentAppCookie !== appId,
  };
}

/**
 * PublicWeb middleware implementation
 */
export async function middleware(request: NextRequest) {
  console.log("PublicWeb middleware triggered for:", request.nextUrl.pathname);

  // Get app information
  const { appId, needsCookieUpdate: needsAppCookieUpdate } = await getAppInfo(request);

  // Get language information
  const { validLanguage, needsCookieUpdate: needsLangCookieUpdate } = await getValidLanguage(request);

  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");

  // Select appropriate configuration
  const middlewareConfig = isAuthRoute ? authApiConfig : publicWebConfig;

  if (isAuthRoute) {
    console.log("Running middleware for auth API route");
  }

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
    "PublicWeb",
    middlewareOptions
  );

  // Set additional headers if response exists
  if (response) {
    response.headers.set("x-app-id", appId);
    response.headers.set("x-lang", validLanguage);
  }

  return response;
}

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
     * - images (static images directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
