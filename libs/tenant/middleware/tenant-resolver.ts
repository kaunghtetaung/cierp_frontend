// libs/tenant/middleware/tenant-resolver.ts
import { NextRequest } from "next/server";
import { buildTenantApiUrl } from "@repo/utils/common/url";
import { MiddlewareConfig } from "./types";

/**
 * Resolve tenant by domain following managementpanel pattern
 * @throws {Error} "Invalid organization" if tenant cannot be resolved
 */
export async function resolveTenantByDomain(
  request: NextRequest,
  config: MiddlewareConfig
): Promise<string> {
  const hostname = request.headers.get("host") || "localhost";
  const cleanHostname = hostname.split(":")[0];

  try {
    const protocol = request.nextUrl.protocol.replace(":", "");

    // Check if localhost development
    const isLocalhost = cleanHostname === 'localhost' || cleanHostname.includes('127.0.0.');

    let apiUrl: string;
    if (isLocalhost) {
      // For localhost, API_GATEWAY_URL must be set in environment
      if (!process.env.API_GATEWAY_URL) {
        console.error("❌ API_GATEWAY_URL not set for localhost development");
        throw new Error("Invalid organization");
      }
      apiUrl = buildTenantApiUrl(hostname, protocol, { baseUrl: process.env.API_GATEWAY_URL });
    } else {
      // For multi-tenant domains, use dynamic URL construction
      apiUrl = buildTenantApiUrl(hostname, protocol);
    }

    if (config.enableLogging) {
      console.log(
        "🔍 Resolving tenant for hostname:",
        cleanHostname,
        "→",
        apiUrl
      );
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Middleware/1.0",
      },
      signal: AbortSignal.timeout(config.tenantApi.timeout || 5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("❌ Tenant not found (404) for hostname:", cleanHostname);
        throw new Error("Invalid organization");
      }
      throw new Error(
        `Tenant resolve failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();

    const tenantId = responseData.id || responseData.tenantId;

    if (!tenantId) {
      console.error("❌ No tenant ID in response for hostname:", cleanHostname);
      throw new Error("Invalid organization");
    }

    if (config.enableLogging) {
      console.log(
        "✅ Successfully resolved tenant:",
        cleanHostname,
        "→",
        tenantId
      );
    }

    return tenantId;
  } catch (error) {
    console.error("❌ Error resolving tenant for hostname:", hostname);
    console.error("📍 Error details:", error);

    // If it's already our "Invalid organization" error, rethrow it
    if (error instanceof Error && error.message === "Invalid organization") {
      throw error;
    }

    // For other errors (network, timeout, etc.), also throw Invalid organization
    throw new Error("Invalid organization");
  }
}
