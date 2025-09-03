// libs/tenant/middleware/config.ts
import { MiddlewareConfig } from "./types";

export const DEFAULT_CONFIG: MiddlewareConfig = {
  tenantApi: {
    timeout: 15000, // Increased timeout to 15 seconds
  },
  cookies: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60, // 24 hours
    sameSite: "lax",
  },
  headers: {
    tenantHeader: "x-tenant-id",
    langHeader: "x-lang",
    requestIdHeader: "x-request-id",
    hostnameHeader: "x-hostname",
    protocolHeader: "x-protocol",
    appHeader: "x-app",
  },
  defaultLanguage: "en",
  excludePaths: [
    "/_next/",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/_vercel",
    "/ping",
    //"/health",
  ],
  enableLogging: false,
};

export function mergeMiddlewareConfig(
  base: MiddlewareConfig,
  override: Partial<MiddlewareConfig>
): MiddlewareConfig {
  return {
    ...base,
    ...override,
    tenantApi: { ...base.tenantApi, ...override.tenantApi },
    cookies: { ...base.cookies, ...override.cookies },
    security: { ...base.security, ...override.security },
    headers: { ...base.headers, ...override.headers },
  };
}
