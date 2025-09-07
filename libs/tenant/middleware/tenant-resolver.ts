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

  console.log("\n🔍 === TENANT RESOLUTION DEBUG START ===");
  console.log("📍 Step 1: Raw hostname from request:", hostname);
  console.log("📍 Step 2: Clean hostname:", cleanHostname);

  try {
    const protocol = request.nextUrl.protocol.replace(":", "");
    console.log("📍 Step 3: Protocol:", protocol);
    
    // For localhost development, use API_BASE_URL; for multi-tenant domains, use domain-based URLs
    const isLocalhost = cleanHostname === 'localhost' || cleanHostname.includes('127.0.0.');
    console.log("📍 Step 4: Is localhost?", isLocalhost);
    console.log("📍 Step 5: API_BASE_URL from env:", process.env.API_BASE_URL || "NOT SET");
    
    const apiConfig = (isLocalhost && process.env.API_BASE_URL) ? { baseUrl: process.env.API_BASE_URL } : {};
    console.log("📍 Step 6: API config:", JSON.stringify(apiConfig));
    
    const apiUrl = buildTenantApiUrl(hostname, protocol, apiConfig);
    console.log("📍 Step 7: Built API URL:", apiUrl);

    if (config.enableLogging) {
      console.log(
        "🔍 Resolving tenant for hostname:",
        cleanHostname,
        "→",
        apiUrl
      );
    }

    console.log("📍 Step 8: Starting fetch with timeout:", config.tenantApi.timeout || 5000, "ms");
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Middleware/1.0",
      },
      signal: AbortSignal.timeout(config.tenantApi.timeout || 5000),
    });
    
    const fetchTime = Date.now() - startTime;
    console.log("📍 Step 9: Fetch completed in", fetchTime, "ms with status:", response.status);

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
    console.log("📍 Step 10: Response data:", JSON.stringify(responseData));
    
    const tenantId = responseData.id || responseData.tenantId;
    console.log("📍 Step 11: Extracted tenant ID:", tenantId);

    if (!tenantId) {
      console.error("❌ No tenant ID in response for hostname:", cleanHostname);
      console.log("🔍 === TENANT RESOLUTION DEBUG END (FAILED) ===\n");
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

    console.log("🔍 === TENANT RESOLUTION DEBUG END (SUCCESS) ===\n");
    return tenantId;
  } catch (error) {
    console.error("❌ Error resolving tenant for hostname:", hostname);
    console.error("📍 Error details:", error);
    console.log("🔍 === TENANT RESOLUTION DEBUG END (ERROR) ===\n");
    return null;
  }
}
