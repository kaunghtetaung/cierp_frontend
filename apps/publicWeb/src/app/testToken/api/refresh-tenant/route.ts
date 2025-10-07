import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TokenManager } from "@repo/auth/token-manager";
import { getCacheInstance, CacheKeys } from "@repo/cache";

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

    // Get tenant settings to retrieve apiAccess credentials
    const tenantSettingsKey = CacheKeys.tenantSettings(tenantId);
    const tenantSettings = await cache.get<any>(tenantSettingsKey);

    if (!tenantSettings?.secret?.apiAccess) {
      return NextResponse.json(
        { success: false, error: "No tenant settings with apiAccess found" },
        { status: 400 }
      );
    }

    const { clientId, clientSecret } = tenantSettings.secret.apiAccess;

    console.log(`🔄 [Test] Refreshing tenant token for ${tenantId} with clientId: ${clientId.substring(0, 10)}...`);

    // Refresh tenant token using the token manager
    const newToken = await tokenManager.getTenantAccessTokenWithRefresh(
      tenantId,
      clientId,
      clientSecret
    );

    if (!newToken) {
      return NextResponse.json(
        { success: false, error: "Failed to refresh tenant token" },
        { status: 500 }
      );
    }

    console.log(`✅ [Test] Tenant token refreshed successfully for ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: "Tenant token refreshed successfully",
    });
  } catch (error) {
    console.error("❌ [Test] Error refreshing tenant token:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh token",
      },
      { status: 500 }
    );
  }
}
