import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@repo/auth/core";
import { TokenManager } from "@repo/auth/token-manager";
import { getCacheInstance, CacheKeys } from "@repo/cache";
import { getJWTExpiryInfo } from "@repo/auth/utils/jwt-decoder";

export async function GET(request: NextRequest) {
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
    const session = await getSession(sessionCookie.value, tenantId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 401 }
      );
    }

    const tokenManager = TokenManager.getInstance();
    const cache = getCacheInstance();

    // Get Initializer Token Info
    const initializerToken = await tokenManager.getInitializerToken();
    const initializerKey = CacheKeys.initializerToken();
    const initializerData = await cache.get<any>(initializerKey);

    // Get Tenant Token Info
    const tenantToken = await tokenManager.getTenantAccessToken(tenantId);
    const tenantKey = CacheKeys.tenantAccessToken(tenantId);
    const tenantData = await cache.get<any>(tenantKey);

    // Get User Token Info
    const userToken = await tokenManager.getUserAccessToken(tenantId, session.userId);
    const userAccessKey = CacheKeys.userAccessToken(tenantId, session.userId);
    const userAccessData = await cache.get<any>(userAccessKey);

    // Get User Refresh Token Info
    const userRefreshKey = CacheKeys.userRefreshToken(tenantId, session.userId);
    const userRefreshData = await cache.get<any>(userRefreshKey);
    const userRefreshToken = userRefreshData?.token || userRefreshData; // Handle both StoredToken object and plain string

    // Get Redis TTLs
    const initializerTTL = await cache.ttl(initializerKey);
    const tenantTTL = await cache.ttl(tenantKey);
    const userAccessTTL = await cache.ttl(userAccessKey);
    const userRefreshTTL = await cache.ttl(userRefreshKey);

    // Get JWT expiry info from tokens
    const initializerJWTInfo = initializerToken ? getJWTExpiryInfo(initializerToken) : null;
    const tenantJWTInfo = tenantToken ? getJWTExpiryInfo(tenantToken) : null;
    const userAccessJWTInfo = userToken ? getJWTExpiryInfo(userToken) : null;
    const userRefreshJWTInfo = userRefreshToken && typeof userRefreshToken === 'string' ? getJWTExpiryInfo(userRefreshToken) : null;

    return NextResponse.json({
      success: true,
      tokens: {
        initializer: {
          exists: !!initializerToken,
          redisTTL: initializerTTL > 0 ? initializerTTL : undefined,
          jwtExpiryTimestamp: initializerJWTInfo?.expiryTimestamp,
          jwtRemainingSeconds: initializerJWTInfo?.remainingSeconds,
          jwtIsExpired: initializerJWTInfo?.isExpired,
          token: initializerToken,
        },
        tenant: {
          exists: !!tenantToken,
          redisTTL: tenantTTL > 0 ? tenantTTL : undefined,
          jwtExpiryTimestamp: tenantJWTInfo?.expiryTimestamp,
          jwtRemainingSeconds: tenantJWTInfo?.remainingSeconds,
          jwtIsExpired: tenantJWTInfo?.isExpired,
          token: tenantToken,
        },
        userAccess: {
          exists: !!userToken,
          redisTTL: userAccessTTL > 0 ? userAccessTTL : undefined,
          jwtExpiryTimestamp: userAccessJWTInfo?.expiryTimestamp,
          jwtRemainingSeconds: userAccessJWTInfo?.remainingSeconds,
          jwtIsExpired: userAccessJWTInfo?.isExpired,
          token: userToken,
        },
        userRefresh: {
          exists: !!userRefreshToken,
          redisTTL: userRefreshTTL > 0 ? userRefreshTTL : undefined,
          jwtExpiryTimestamp: userRefreshJWTInfo?.expiryTimestamp,
          jwtRemainingSeconds: userRefreshJWTInfo?.remainingSeconds,
          jwtIsExpired: userRefreshJWTInfo?.isExpired,
          token: userRefreshToken,
        },
      },
      session: {
        sessionId: sessionCookie.value,
        userId: session.userId,
        tenantId: session.tenantId,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error fetching token info:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
