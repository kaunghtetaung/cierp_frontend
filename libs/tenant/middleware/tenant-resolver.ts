// libs/tenant/middleware/tenant-resolver.ts
import { NextRequest } from "next/server";
import { buildTenantApiUrl } from "@repo/utils/common/url";
import { MiddlewareConfig } from "./types";

/**
 * Resolve tenant by domain following managementpanel pattern
 */
export async function resolveTenantByDomain(
  request: NextRequest,
  config: MiddlewareConfig
): Promise<string | null> {
  const hostname = request.headers.get("host") || "localhost";
  const cleanHostname = hostname.split(":")[0];

  try {
    const protocol = request.nextUrl.protocol.replace(":", "");
    const apiUrl = buildTenantApiUrl(hostname, protocol);

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
        if (config.enableLogging) {
          console.log("❌ Tenant not found (404) for hostname:", cleanHostname);
        }
        return null;
      }
      throw new Error(
        `Tenant resolve failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    const tenantId = responseData.id || responseData.tenantId;

    if (!tenantId) {
      console.error("❌ No tenant ID in response for hostname:", cleanHostname);
      return null;
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
    console.error("❌ Error resolving tenant for hostname:", hostname, error);
    return null;
  }
}
