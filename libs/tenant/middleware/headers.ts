// libs/tenant/middleware/headers.ts
import { NextRequest, NextResponse } from "next/server";
import { MiddlewareConfig } from "./types";

/**
 * Set all required headers on response
 */
export function setMiddlewareHeaders(
  response: NextResponse,
  request: NextRequest,
  data: {
    tenantId: string;
    language: string;
    requestId: string;
    appName?: string;
  },
  config: MiddlewareConfig
): void {
  const hostname = request.headers.get("host") || "localhost";
  const protocol = request.nextUrl.protocol.replace(":", "");

  // Set all headers
  response.headers.set(
    config.headers.tenantHeader || "x-tenant-id",
    data.tenantId
  );
  response.headers.set(config.headers.langHeader || "x-lang", data.language);
  response.headers.set(
    config.headers.requestIdHeader || "x-request-id",
    data.requestId
  );
  response.headers.set(config.headers.hostnameHeader || "x-hostname", hostname);
  response.headers.set(config.headers.protocolHeader || "x-protocol", protocol);

  if (data.appName) {
    response.headers.set(config.headers.appHeader || "x-app", data.appName);
  }
}
