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
