// Token status API route for monitoring
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateRequest } from '@repo/auth/core';
import { 
  getInitializerTokenData,
  getTenantTokenData,
  getUserAccessTokenData,
  getUserRefreshTokenData
} from '@repo/auth/core';
import { COOKIE_NAMES } from '@repo/utils/common/constants';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    // Validate session
    const sessionInfo = await validateRequest(sessionId, {
      ipAddress: request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!sessionInfo.isAuthenticated || !sessionInfo.session) {
      return NextResponse.json({ error: "Session not found or invalid" }, { status: 401 });
    }

    const { tenantId, userId } = sessionInfo.session;

    // Get all token statuses
    const [initializerToken, tenantToken, userAccessToken, userRefreshToken] = await Promise.all([
      getInitializerTokenData(),
      getTenantTokenData(tenantId),
      getUserAccessTokenData(tenantId, userId),
      getUserRefreshTokenData(tenantId, userId)
    ]);

    const formatTokenStatus = (token: any, type: string) => {
      if (!token) {
        return {
          type,
          status: 'missing',
          expiresAt: null,
          isExpired: true,
          timeRemaining: null
        };
      }

      const now = Date.now();
      const expiresAt = token.expiresAt * 1000; // Convert to milliseconds
      const isExpired = now >= expiresAt;
      const timeRemaining = isExpired ? 0 : expiresAt - now;

      return {
        type,
        status: isExpired ? 'expired' : 'active',
        expiresAt: new Date(expiresAt),
        isExpired,
        timeRemaining,
        createdAt: new Date(token.createdAt * 1000),
        tokenType: token.tokenData?.token_type || 'Bearer'
      };
    };

    const tokenStatuses = {
      initializer: formatTokenStatus(initializerToken, 'initializer'),
      tenant: formatTokenStatus(tenantToken, 'tenant'),
      userAccess: formatTokenStatus(userAccessToken, 'user_access'),
      userRefresh: formatTokenStatus(userRefreshToken, 'user_refresh')
    };

    console.log(`[TOKEN_STATUS] Retrieved token statuses for user: ${sessionInfo.user?.email}, tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      tokens: tokenStatuses,
      user: {
        id: userId,
        tenantId: tenantId
      }
    });
  } catch (error) {
    console.error("Token status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve token status" },
      { status: 500 }
    );
  }
}