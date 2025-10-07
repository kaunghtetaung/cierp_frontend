import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, extendSessionOnly } from "@repo/auth/core";
import { TokenManager } from "@repo/auth/server-api";

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

    // Get session to extract userId
    const session = await getSession(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 401 }
      );
    }

    const userId = session.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID not found in session" },
        { status: 400 }
      );
    }

    console.log(`🔄 [Test] Extending session for sessionId: ${sessionCookie.value.substring(0, 16)}...`);

    // Step 1: Extend session
    const renewedSession = await extendSessionOnly(sessionCookie.value);

    if (!renewedSession) {
      return NextResponse.json(
        { success: false, error: "Failed to extend session" },
        { status: 500 }
      );
    }

    // Step 2: Refresh user access token (FORCE refresh, don't just get cached token)
    let tokenRefreshed = false;
    let tokenError: string | undefined;

    try {
      const tokenManager = TokenManager.getInstance();

      console.log(`🔄 [Test] Refreshing user access token for user: ${userId}`);

      const newToken = await tokenManager.refreshUserAccessToken(
        tenantId,
        userId
      );

      if (newToken) {
        tokenRefreshed = true;
        console.log(`✅ [Test] User access token refreshed successfully`);
      } else {
        tokenError = 'Token refresh returned null';
        console.warn(`⚠️ [Test] Failed to refresh user access token, but session was extended`);
      }
    } catch (error) {
      tokenError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Test] Error refreshing user access token:`, error);
    }

    console.log(
      `✅ [Test] Session extended successfully. New expiry: ${renewedSession.expiresAt}, ` +
      `Token refreshed: ${tokenRefreshed}`
    );

    return NextResponse.json({
      success: true,
      message: "Session extended successfully",
      newExpiresAt: renewedSession.expiresAt,
      tokenRefreshed,
      tokenError,
    });
  } catch (error) {
    console.error("❌ [Test] Error extending session:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extend session",
      },
      { status: 500 }
    );
  }
}
