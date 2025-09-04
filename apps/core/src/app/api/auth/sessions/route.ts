// Session management API for admin monitoring and force logout
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateRequest } from '@repo/auth/core';
import { getCacheInstance, CacheKeys } from '@repo/cache';
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

    if (!sessionInfo.isAuthenticated || !sessionInfo.session || !sessionInfo.user) {
      return NextResponse.json({ error: "Session not found or invalid" }, { status: 401 });
    }

    // Check if user has admin permissions
    const hasAdminAccess = sessionInfo.user.roles?.some(role => 
      typeof role === 'string' ? role.toLowerCase().includes('admin') : 
      typeof role === 'object' && role !== null ? 
        (role as any).Role?.toLowerCase().includes('admin') || (role as any).role?.toLowerCase().includes('admin')
      : false
    ) || sessionInfo.user.permissions?.includes('manage_sessions' as any);

    if (!hasAdminAccess) {
      // Non-admin users can only see their own session
      return NextResponse.json({
        success: true,
        sessions: [{
          sessionId: sessionInfo.session.sessionId,
          userId: sessionInfo.session.userId,
          tenantId: sessionInfo.session.tenantId,
          userEmail: sessionInfo.user.email,
          userName: sessionInfo.user.name,
          createdAt: sessionInfo.session.createdAt,
          expiresAt: sessionInfo.session.expiresAt,
          lastActivityAt: sessionInfo.session.lastActivityAt,
          ipAddress: sessionInfo.session.ipAddress,
          userAgent: sessionInfo.session.userAgent,
          isCurrent: true
        }],
        isAdmin: false
      });
    }

    // For admin users, get all sessions from cache
    const cache = getCacheInstance();
    const { tenantId } = sessionInfo.session;
    
    console.log(`[SESSIONS_LIST] Getting sessions for tenant: ${tenantId}`);
    
    // Get all session keys for this tenant
    const sessionKeys = await cache.getKeysPattern(`session:${tenantId}:*`);
    console.log(`[SESSIONS_LIST] Found ${sessionKeys.length} session keys:`, sessionKeys);
    
    const sessions = await Promise.all(
      sessionKeys.map(async (key) => {
        try {
          const session = await cache.get(key);
          if (!session) {
            console.log(`[SESSIONS_LIST] Empty session for key: ${key}`);
            return null;
          }

          return {
            sessionId: session.sessionId || 'unknown',
            userId: session.userId || 'unknown',
            tenantId: session.tenantId || tenantId,
            userEmail: session.userEmail || 'Unknown',
            userName: session.userName || 'Unknown',
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            lastActivityAt: session.lastActivityAt,
            ipAddress: session.ipAddress || 'unknown',
            userAgent: session.userAgent || 'unknown',
            isCurrent: session.sessionId === sessionInfo.session.sessionId
          };
        } catch (sessionError) {
          console.error(`[SESSIONS_LIST] Error processing session ${key}:`, sessionError);
          return null;
        }
      })
    );

    const validSessions = sessions.filter(Boolean);

    console.log(`[SESSIONS_LIST] Admin ${sessionInfo.user?.email} retrieved ${validSessions.length} sessions`);

    return NextResponse.json({
      success: true,
      sessions: validSessions,
      isAdmin: true
    });
  } catch (error) {
    console.error("Sessions list error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Failed to retrieve sessions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Force logout specific session
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    // Validate current session
    const sessionInfo = await validateRequest(sessionId, {
      ipAddress: request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!sessionInfo.isAuthenticated || !sessionInfo.session || !sessionInfo.user) {
      return NextResponse.json({ error: "Session not found or invalid" }, { status: 401 });
    }

    // Check if user has admin permissions
    const hasAdminAccess = sessionInfo.user.roles?.some(role => 
      typeof role === 'string' ? role.toLowerCase().includes('admin') : 
      typeof role === 'object' && role !== null ? 
        (role as any).Role?.toLowerCase().includes('admin') || (role as any).role?.toLowerCase().includes('admin')
      : false
    ) || sessionInfo.user.permissions?.includes('manage_sessions' as any);

    const { searchParams } = new URL(request.url);
    const targetSessionId = searchParams.get('sessionId');

    if (!targetSessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Users can always logout their own session, admins can logout any session
    const canLogout = hasAdminAccess || targetSessionId === sessionInfo.session.sessionId;

    if (!canLogout) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Force logout the specified session
    const cache = getCacheInstance();
    const { tenantId } = sessionInfo.session;
    const targetSessionKey = CacheKeys.userSession(tenantId, targetSessionId);
    
    const targetSession = await cache.get(targetSessionKey);
    if (!targetSession) {
      return NextResponse.json({ error: "Target session not found" }, { status: 404 });
    }

    // Delete the session from cache
    await cache.del(targetSessionKey);

    // Also clear user tokens if it's not the current session
    if (targetSessionId !== sessionInfo.session.sessionId && targetSession.userId) {
      const { clearUserTokens } = await import('@repo/auth/core');
      await clearUserTokens(tenantId, targetSession.userId);
    }

    const isOwnSession = targetSessionId === sessionInfo.session.sessionId;
    
    console.log(`[FORCE_LOGOUT] ${hasAdminAccess ? 'Admin' : 'User'} ${sessionInfo.user?.email} logged out session ${targetSessionId.substring(0, 12)}... (${isOwnSession ? 'own' : 'other user'})`);

    return NextResponse.json({
      success: true,
      message: isOwnSession ? "Successfully logged out your session" : "Successfully logged out user session",
      loggedOutSessionId: targetSessionId
    });
  } catch (error) {
    console.error("Force logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout session" },
      { status: 500 }
    );
  }
}