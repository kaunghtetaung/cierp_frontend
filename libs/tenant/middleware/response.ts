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
  // Pick the friendly error page based on the error code. The
  // tenant-not-found case has its own dedicated page (different
  // copy: "Domain not configured" vs "Backend unreachable");
  // every other middleware failure (gateway down, network glitch,
  // generic throw) redirects to the generic service-unavailable
  // page. Returning HTML for HTML clients and falling back to
  // JSON only for API / fetch clients keeps the UX clean for
  // people browsing the site while preserving machine-readable
  // errors for fetch / curl.
  const isHtmlClient = isHtmlAcceptingRequest(request);

  if (isHtmlClient) {
    const errorPath =
      error.code === "TENANT_NOT_FOUND"
        ? "/error/tenant-not-found"
        : "/error/service-unavailable";

    const baseUrl = request.url.includes('://')
      ? request.url.split('://')[0] + '://' + data.hostname
      : `https://${data.hostname}`;

    // Strip the originating subdomain (e.g. `api-dev.um1.edu.mm`
    // → `www-dev.um1.edu.mm`) when the hostname isn't already a
    // `www.*` host, so the error page is served by publicWeb.
    const publicWebHostname = data.hostname.startsWith('www.') ||
      data.hostname.startsWith('www-')
      ? data.hostname
      : `www.${data.hostname.replace(/^[^.]+\./, '')}`;

    const url = new URL(
      errorPath,
      `${baseUrl.split('://')[0]}://${publicWebHostname}`,
    );
    url.searchParams.set("hostname", data.hostname);
    url.searchParams.set("requestId", data.requestId);
    if (data.appName) url.searchParams.set("app", data.appName);
    if (error.code) url.searchParams.set("code", error.code);
    if (error.message) url.searchParams.set("message", error.message);

    return NextResponse.redirect(url);
  }

  // Non-HTML client (API call, fetch with `Accept: application/json`)
  // — keep the JSON response so frontends / scripts can react.
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

/**
 * Decide whether the caller wants HTML (a browser) or JSON (an
 * API / fetch / curl). Browser requests carry `Accept: text/html`
 * in their headers; pure-JSON callers send `Accept: application/json`
 * or the wildcard accept value. Returning HTML to a JSON consumer
 * would break downstream parsing, so the distinction matters.
 *
 * Note: the wildcard token is referenced as a string constant
 * rather than spelled inline in the JSDoc because `* + slash`
 * inside a block comment closes the comment early.
 */
function isHtmlAcceptingRequest(request: NextRequest): boolean {
  const WILDCARD_ACCEPT = "*" + "/" + "*";
  const accept = request.headers.get("accept") || "";
  // Browser navigation always lists text/html first.
  if (accept.includes("text/html")) return true;
  // No `accept` header at all? Treat as browser (Next.js dev
  // sometimes omits it for top-level navigations).
  if (!accept || accept === WILDCARD_ACCEPT) {
    // Confirm it's a top-level navigation, not an XHR — XHRs
    // usually carry an `x-requested-with` or `sec-fetch-dest`.
    const dest = request.headers.get("sec-fetch-dest");
    if (!dest || dest === "document") return true;
  }
  return false;
}
