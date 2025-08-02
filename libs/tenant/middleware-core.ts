// libs/tenant/middleware/index.ts
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CONFIG, mergeMiddlewareConfig } from "./middleware/config";
import { generateRequestId, shouldExcludePath } from "./middleware/utils";
import { resolveTenantByDomain } from "./middleware/tenant-resolver";
import {
  getTenantIdFromRequest,
  getLanguageFromRequest,
  createTenantCookie,
  createLanguageCookie,
  createAppCookie,
} from "./middleware/cookies";
import { setMiddlewareHeaders } from "./middleware/headers";
import { createErrorResponse } from "./middleware/response";
import { MiddlewareConfig } from "./middleware/types";

/**
 * Additional middleware options for cookie handling
 */
export interface MiddlewareOptions {
  appId?: string;
  shouldSetLanguageCookie?: boolean;
  shouldSetAppCookie?: boolean;
  customLanguage?: string;
}

/**
 * Main middleware implementation
 */
export async function createTenantMiddleware(
  request: NextRequest,
  appConfig: Partial<MiddlewareConfig> = {},
  appName?: string,
  options: MiddlewareOptions = {}
): Promise<NextResponse> {
  const config = mergeMiddlewareConfig(DEFAULT_CONFIG, appConfig);
  const start = Date.now();
  const hostname = request.headers.get("host") || "localhost";
  const pathname = request.nextUrl.pathname;
  const requestId = generateRequestId();

  if (config.enableLogging) {
    console.log(
      `🔄 [${requestId}] ${appName || "App"} Middleware processing:`,
      {
        hostname,
        pathname,
        protocol: request.nextUrl.protocol.replace(":", ""),
        method: request.method,
        userAgent: request.headers.get("user-agent")?.slice(0, 50),
      }
    );
  }

  // Skip middleware for excluded paths
  if (shouldExcludePath(pathname, config.excludePaths)) {
    return NextResponse.next();
  }

  try {
    // Get existing tenant ID from cookie
    let tenantId = getTenantIdFromRequest(request, config);
    let shouldUpdateTenantCookie = false;

    // If no tenant ID in cookie, resolve from hostname
    if (!tenantId) {
      if (config.enableLogging) {
        console.log(
          `🔍 [${requestId}] No tenant cookie found, resolving from hostname:`,
          hostname
        );
      }

      tenantId = await resolveTenantByDomain(request, config);

      if (!tenantId) {
        const duration = Date.now() - start;
        if (config.enableLogging) {
          console.log(
            `❌ [${requestId}] Could not resolve tenant for hostname: ${hostname} (${duration}ms)`
          );
        }

        return createErrorResponse(
          request,
          {
            status: 404,
            message: `No tenant configuration found for domain: ${hostname}`,
            code: "TENANT_NOT_FOUND",
          },
          { requestId, hostname, appName },
          config
        );
      }

      shouldUpdateTenantCookie = true;
    } else if (config.enableLogging) {
      console.log(`✅ [${requestId}] Found tenant ID in cookie:`, tenantId);
    }

    // Get language (use custom language from options if provided)
    const cookieLanguage = getLanguageFromRequest(request, config);
    const language = options.customLanguage || cookieLanguage || config.defaultLanguage || "en";

    // Create response with headers
    const response = NextResponse.next();

    // Set all middleware headers
    setMiddlewareHeaders(
      response,
      request,
      { tenantId, language, requestId, appName },
      config
    );

    // Collect cookies to set
    const cookiesToSet: string[] = [];

    // Set/update tenant cookie if needed
    if (shouldUpdateTenantCookie) {
      if (config.enableLogging) {
        console.log(`🍪 [${requestId}] Setting tenant cookie for:`, tenantId);
      }
      cookiesToSet.push(createTenantCookie(tenantId, hostname, config));
    }

    // Set language cookie if requested
    if (options.shouldSetLanguageCookie) {
      if (config.enableLogging) {
        console.log(`🍪 [${requestId}] Setting language cookie for:`, language);
      }
      cookiesToSet.push(createLanguageCookie(language, hostname, config));
    }

    // Set app ID cookie if requested
    if (options.shouldSetAppCookie && options.appId) {
      if (config.enableLogging) {
        console.log(`🍪 [${requestId}] Setting app cookie for:`, options.appId);
      }
      cookiesToSet.push(createAppCookie(options.appId, hostname, config));
    }

    // Set all cookies at once
    cookiesToSet.forEach(cookie => {
      response.headers.append("Set-Cookie", cookie);
    });

    const duration = Date.now() - start;
    if (config.enableLogging) {
      console.log(
        `✅ [${requestId}] ${
          appName || "App"
        } Middleware completed in ${duration}ms:`,
        {
          tenantId,
          hostname,
          pathname,
        }
      );
    }

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `❌ [${requestId}] ${
        appName || "App"
      } Middleware error after ${duration}ms:`,
      error
    );

    return createErrorResponse(
      request,
      {
        status: 500,
        message: "Internal server error in tenant resolution",
        code: "MIDDLEWARE_ERROR",
      },
      { requestId, hostname, appName },
      config
    );
  }
}

/**
 * Export default config for easy customization
 */
export { DEFAULT_CONFIG };

/**
 * Export types
 */
export type { MiddlewareConfig, MiddlewareOptions };
