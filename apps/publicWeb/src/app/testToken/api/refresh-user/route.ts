import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@repo/auth/core";
import { TokenManager } from "@repo/auth/token-manager";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const tenantId = cookieStore.get("x-tenant-id")?.value;

    if (!sessionCookie || !tenantId) {
      return NextResponse.json(
        { success: false, error: "No session or tenant ID found" },
        { status: 401 }
      );
    }

    // Get session
    const session = await getSession(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 401 }
      );
    }

    const tokenManager = TokenManager.getInstance();

    console.log(`🔄 [Test] Refreshing user token for userId: ${session.userId}, tenantId: ${tenantId}`);

    // Refresh user token using the token manager (this uses refresh token)
    const newToken = await tokenManager.refreshUserAccessToken(
      tenantId,
      session.userId
    );

    if (!newToken) {
      return NextResponse.json(
        { success: false, error: "Failed to refresh user token. No refresh token available or refresh failed." },
        { status: 500 }
      );
    }

    console.log(`✅ [Test] User token refreshed successfully for userId: ${session.userId}`);

    return NextResponse.json({
      success: true,
      message: "User access token refreshed successfully",
    });
  } catch (error) {
    console.error("❌ [Test] Error refreshing user token:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh token",
      },
      { status: 500 }
    );
  }
}
