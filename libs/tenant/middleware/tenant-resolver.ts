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

  console.log("\n🔍 === TENANT RESOLUTION DEBUG START ===");
  console.log("📍 Step 1: Raw hostname from request:", hostname);
  console.log("📍 Step 2: Clean hostname:", cleanHostname);

  try {
    const protocol = request.nextUrl.protocol.replace(":", "");
    console.log("📍 Step 3: Protocol:", protocol);

    // Check if localhost development
    const isLocalhost = cleanHostname === 'localhost' || cleanHostname.includes('127.0.0.');
    console.log("📍 Step 4: Is localhost?", isLocalhost);

    let apiUrl: string;
    if (isLocalhost) {
      // For localhost, API_GATEWAY_URL must be set in environment
      if (!process.env.API_GATEWAY_URL) {
        console.error("❌ API_GATEWAY_URL not set for localhost development");
        throw new Error("Invalid organization");
      }
      console.log("📍 Step 5: API_GATEWAY_URL from env:", process.env.API_GATEWAY_URL);
      apiUrl = buildTenantApiUrl(hostname, protocol, { baseUrl: process.env.API_GATEWAY_URL });
    } else {
      // For multi-tenant domains, use dynamic URL construction
      apiUrl = buildTenantApiUrl(hostname, protocol);
    }

    console.log("📍 Step 6: Built API URL:", apiUrl);

    if (config.enableLogging) {
      console.log(
        "🔍 Resolving tenant for hostname:",
        cleanHostname,
        "→",
        apiUrl
      );
    }

    console.log("📍 Step 7: Starting fetch with timeout:", config.tenantApi.timeout || 5000, "ms");
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Middleware/1.0",
      },
      signal: AbortSignal.timeout(config.tenantApi.timeout || 5000),
    });
    
    const fetchTime = Date.now() - startTime;
    console.log("📍 Step 8: Fetch completed in", fetchTime, "ms with status:", response.status);

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
    console.log("📍 Step 9: Response data:", JSON.stringify(responseData));

    const tenantId = responseData.id || responseData.tenantId;
    console.log("📍 Step 10: Extracted tenant ID:", tenantId);

    if (!tenantId) {
      console.error("❌ No tenant ID in response for hostname:", cleanHostname);
      console.log("🔍 === TENANT RESOLUTION DEBUG END (FAILED) ===\n");
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

    console.log("🔍 === TENANT RESOLUTION DEBUG END (SUCCESS) ===\n");
    return tenantId;
  } catch (error) {
    console.error("❌ Error resolving tenant for hostname:", hostname);
    console.error("📍 Error details:", error);
    console.log("🔍 === TENANT RESOLUTION DEBUG END (ERROR) ===\n");

    // If it's already our "Invalid organization" error, rethrow it
    if (error instanceof Error && error.message === "Invalid organization") {
      throw error;
    }

    // For other errors (network, timeout, etc.), also throw Invalid organization
    throw new Error("Invalid organization");
  }
}
