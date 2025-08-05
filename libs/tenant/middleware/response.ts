// libs/tenant/middleware/response.ts
import { NextRequest, NextResponse } from "next/server";
import { MiddlewareConfig } from "./types";

/**
 * Create error response with proper headers
 */
export function createErrorResponse(
  request: NextRequest,
  error: {
    status: number;
    message: string;
    code?: string;
  },
  data: {
    requestId: string;
    hostname: string;
    appName?: string;
  },
  config: MiddlewareConfig
): NextResponse {
  // For tenant not found errors, redirect to publicWeb error page instead of JSON response
  if (error.code === "TENANT_NOT_FOUND") {
    // Always redirect to publicWeb error page for better user experience
    const baseUrl = request.url.includes('://') ? 
      request.url.split('://')[0] + '://' + data.hostname : 
      `https://${data.hostname}`;
    
    // If hostname already includes 'www.', use it as is
    // Otherwise, redirect to www subdomain for publicWeb
    const publicWebHostname = data.hostname.startsWith('www.') ? 
      data.hostname : 
      `www.${data.hostname.replace(/^[^.]+\./, '')}`;
    
    const url = new URL("/error/tenant-not-found", `${baseUrl.split('://')[0]}://${publicWebHostname}`);
    url.searchParams.set("hostname", data.hostname);
    url.searchParams.set("requestId", data.requestId);
    if (data.appName) {
      url.searchParams.set("app", data.appName);
    }
    
    return NextResponse.redirect(url);
  }

  const response = new NextResponse(
    JSON.stringify({
      error: error.code || "MIDDLEWARE_ERROR",
      message: error.message,
      hostname: data.hostname,
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
      ...(data.appName && { app: data.appName }),
    }),
    {
      status: error.status,
      headers: {
        "Content-Type": "application/json",
        [config.headers.hostnameHeader || "x-hostname"]: data.hostname,
        [config.headers.requestIdHeader || "x-request-id"]: data.requestId,
        ...(data.appName && {
          [config.headers.appHeader || "x-app"]: data.appName,
        }),
      },
    }
  );

  return response;
}
