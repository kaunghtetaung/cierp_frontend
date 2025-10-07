import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TokenManager } from "@repo/auth/token-manager";
import { getCacheInstance, CacheKeys } from "@repo/cache";
import { getClientCredentialsToken } from "@repo/auth/core";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("x-tenant-id")?.value;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "No tenant ID found" },
        { status: 401 }
      );
    }

    const cache = getCacheInstance();
    const tokenManager = TokenManager.getInstance();

    // Get tenant settings to retrieve initializer credentials
    const tenantSettingsKey = CacheKeys.tenantSettings(tenantId);
    const tenantSettings = await cache.get<any>(tenantSettingsKey);

    if (!tenantSettings?.secret?.apiAccess) {
      return NextResponse.json(
        { success: false, error: "No tenant settings with apiAccess found" },
        { status: 400 }
      );
    }

    const { clientId, clientSecret } = tenantSettings.secret.apiAccess;

    console.log(`🔄 [Test] Refreshing initializer token with clientId: ${clientId.substring(0, 10)}...`);

    // Get new initializer token using client credentials
    const tokenData = await getClientCredentialsToken(
      clientId,
      clientSecret,
      "api.read"
    );

    // Store the new initializer token
    await tokenManager.setInitializerToken(
      tokenData.access_token,
      tokenData.expires_in
    );

    console.log(`✅ [Test] Initializer token refreshed successfully (expires in ${tokenData.expires_in}s)`);

    return NextResponse.json({
      success: true,
      message: "Initializer token refreshed successfully",
      expiresIn: tokenData.expires_in,
    });
  } catch (error) {
    console.error("❌ [Test] Error refreshing initializer token:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh token",
      },
      { status: 500 }
    );
  }
}
