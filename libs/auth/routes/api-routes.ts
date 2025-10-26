// OIDC Login API Routes - based on management app implementation
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  setUserAccessToken,
  setUserRefreshToken,
  clearUserTokens,
  loginUser,
  logoutUser,
  validateRequest,
} from "../core";
import { renewSession } from "../core/sessions";
import { getCacheInstance } from "@repo/cache";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getTenantSetting } from "@repo/tenant/tenant-service";
import { getAuthDomain, getPublicUrl } from "@repo/utils/server";
import { COOKIE_NAMES } from "@repo/utils/common/constants";
import { generateSecureRandomString } from "@repo/utils/common/security";
import { setSessionCookie, deleteSessionCookie } from "../core/cookies";
import type { User } from "@repo/types";
import { handleApiError } from "@repo/utils/server";

// PKCE utilities - using cryptographically secure random generation
function generateCodeVerifier(): string {
  // Use secure random generation instead of Math.random() for security
  // Generate 128 characters from the allowed PKCE character set
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomBytes = generateSecureRandomString(96); // Enough random data for 128 chars
  let result = "";

  // Convert secure random hex to PKCE-compliant charset
  for (let i = 0; i < randomBytes.length && result.length < 128; i += 2) {
    const hexPair = randomBytes.substr(i, 2);
    const value = parseInt(hexPair, 16);
    result += chars.charAt(value % chars.length);
  }

  return result.substring(0, 128);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(digest)))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateState(): string {
  // Use secure random generation instead of Math.random() for security
  // Generate 32 characters of secure random state
  return generateSecureRandomString(16).substring(0, 32);
}

// Import centralized JWT utility to eliminate duplication
import { extractUserInfoFromJWT } from "../utils/jwt-utils";

// Get OIDC endpoint from tenant-based auth domain
async function getOidcEndpoint(): Promise<string> {
  return await getAuthDomain();
}

// Get tenant OIDC client credentials
async function getTenantOidcCredentials(
  tenantId: string
): Promise<{ clientId: string; clientSecret?: string }> {
  try {
    // Use tenant service to get settings
    const tenantSettings = await getTenantSetting(tenantId);

    if (tenantSettings.secret?.logInFlow?.clientId) {
      return {
        clientId: tenantSettings.secret.logInFlow.clientId,
        clientSecret: tenantSettings.secret.logInFlow.clientSecret,
      };
    }
  } catch (error) {
    console.warn("Failed to get tenant OIDC credentials:", error);
  }

  // Fallback to environment variables
  return {
    clientId: process.env.OIDC_CLIENT_ID || "default-client-id",
    clientSecret: process.env.OIDC_CLIENT_SECRET || "default-client-secret",
  };
}

/**
 * Login initiation route - generates OIDC authorization URL
 * Usage: GET /api/auth/login?returnUrl=/dashboard
 */
export async function handleLoginRequest(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Generate default returnUrl if not provided
    let returnUrl = searchParams.get("returnUrl");
    if (!returnUrl) {
      const publicUrl = await getPublicUrl();
      returnUrl = `${publicUrl}`;
    }
    // Get tenant context
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID not found" },
        { status: 400 }
      );
    }

    // Get tenant settings and OIDC credentials
    const tenantSettings = await getTenantSetting(tenantId);
    const { clientId } = await getTenantOidcCredentials(tenantId);
    const oidcEndpoint = await getOidcEndpoint();

    // Use configured redirect URI from tenant settings or fallback to dynamic
    let redirectUri: string;
    if (
      tenantSettings.secret?.logInFlow?.redirectUris &&
      tenantSettings.secret.logInFlow.redirectUris.length > 0
    ) {
      // Use the first configured redirect URI
      redirectUri = tenantSettings.secret.logInFlow.redirectUris[0];
    } else {
      // Fallback to dynamic redirect URI
      redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store PKCE parameters in session for callback
    const cache = getCacheInstance();
    const pkceKey = `ciApp:PKCE:${state}`;
    await cache.set(
      pkceKey,
      JSON.stringify({
        codeVerifier,
        tenantId,
        returnUrl,
        redirectUri, // Store the actual redirect URI used
        timestamp: Date.now(),
      }),
      300
    ); // 5 minutes

    // Build authorization URL
    const authUrl = new URL(`${oidcEndpoint}/oidc/auth`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("tenant_id", tenantId);

    return NextResponse.json({
      authorizationUrl: authUrl.toString(),
      state,
      redirectUri,
      tenantId,
    });
  } catch (error) {
    return handleApiError(error, request, {
      operation: 'generate-login-url',
      component: 'auth-login',
      metadata: { endpoint: '/api/auth/login' }
    });
  }
}

/**
 * Login callback route - handles OIDC authorization code exchange
 * Usage: GET /api/auth/callback?code=...&state=...
 */
export async function handleAuthCallback(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json(
        { error: "Authorization code and state are required" },
        { status: 400 }
      );
    }

    // Retrieve PKCE parameters from cache
    const cache = getCacheInstance();
    const pkceKey = `ciApp:PKCE:${state}`;
    const pkceData = await cache.get<string>(pkceKey);

    if (!pkceData) {
      return NextResponse.json(
        { error: "Invalid or expired state parameter" },
        { status: 400 }
      );
    }

    // Parse PKCE data - handle both string and object cases
    let parsedData;
    if (typeof pkceData === "string") {
      parsedData = JSON.parse(pkceData);
    } else {
      // Cache might return already parsed object
      parsedData = pkceData;
    }

    const { codeVerifier, tenantId, returnUrl, redirectUri } = parsedData;

    // Clean up PKCE data
    await cache.del(pkceKey);

    // Get tenant OIDC credentials
    const { clientId, clientSecret } = await getTenantOidcCredentials(tenantId);
    const oidcEndpoint = await getOidcEndpoint();

    // Exchange code for tokens
    const tokenEndpoint = `${oidcEndpoint}/oidc/token`;
    // Use the stored redirect URI from login initiation

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret || "",
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(
        `Token exchange failed: ${tokenResponse.status} ${errorText}`
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      return NextResponse.json(
        { error: "Invalid token response: missing id_token" },
        { status: 400 }
      );
    }

    // Extract user info from id_token (not access_token)
    const userInfo = extractUserInfoFromJWT(tokenData.id_token);

    if (!userInfo.id) {
      return NextResponse.json(
        { error: "Invalid id_token: missing user ID" },
        { status: 400 }
      );
    }

    // Create complete user object
    const roles = userInfo.roles || [];
    const user: User = {
      id: userInfo.id,
      email: userInfo.email || "",
      name: userInfo.name || "",
      displayName: userInfo.name || "", // Backward compatibility
      roles: roles,
      role: Array.isArray(roles) && roles.length > 0 ? roles[0] as any : undefined, // Backward compatibility
      permissions: userInfo.permissions || [],
      tenantId: tenantId,
      sub: userInfo.id, // Backward compatibility
      profileState: userInfo.profileState, // Profile completion state: 'created' | 'profile_completed' | 'approved'
      isActive: true,
      createdAt: userInfo.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Use simplified auth functions to login user
    // Use id_token (JWT) for gateway API calls, access_token is reference token
    const sessionData = await loginUser(
      user.id,
      tenantId,
      tokenData.id_token, // Store JWT instead of reference token
      tokenData.refresh_token,
      tokenData.expires_in || 3600,
      {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: { userInfo: user },
      }
    );

    // SessionManager already stored the session - no duplicate storage needed

    // Set session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    };

    // Ensure we redirect to the proper public URL (www-prefixed) instead of localhost
    let redirectUrl = returnUrl;

    // If returnUrl is a relative path, make it absolute using public URL
    if (returnUrl.startsWith("/")) {
      const publicUrl = await getPublicUrl();
      redirectUrl = `${publicUrl}${returnUrl}`;
    }

    const response = NextResponse.redirect(redirectUrl);

    // Set session cookie with root domain support
    const hostname = request.headers.get("host") || "";
    setSessionCookie(response, sessionData.sessionId, hostname, {
      maxAge: cookieOptions.maxAge,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly,
    });

    return response;
  } catch (error) {
    return handleApiError(error, request, {
      operation: 'auth-callback',
      component: 'auth-callback',
      metadata: { endpoint: '/api/auth/callback' }
    });
  }
}

/**
 * Logout route - clears session and redirects to OIDC logout
 * Usage: POST /api/auth/logout
 */
export async function handleLogout(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (sessionId) {
      // Use simplified logout function
      await logoutUser(sessionId);
    }

    // Build logout URL with skip_confirmation for smoother UX
    const oidcEndpoint = await getOidcEndpoint();
    const publicUrl = await getPublicUrl();
    const postLogoutRedirectUri = `${publicUrl}/login`;

    // Use skip_confirmation=true for direct logout without confirmation page
    const logoutUrl = `${oidcEndpoint}/logout?post_logout_redirect_uri=${encodeURIComponent(
      postLogoutRedirectUri
    )}&skip_confirmation=true`;

    const response = NextResponse.redirect(logoutUrl);

    // Delete session cookie with root domain support
    const hostname = request.headers.get("host") || "";
    deleteSessionCookie(response, hostname);

    return response;
  } catch (error) {
    return handleApiError(error, request, {
      operation: 'logout',
      component: 'auth-logout',
      metadata: { endpoint: '/api/auth/logout' }
    });
  }
}

/**
 * Session status route - returns current authentication status
 * Usage: GET /api/auth/session
 */
export async function handleSessionStatus(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;
    const hostname = request.headers.get("host") || "";
    const tenantIdFromHeaders = request.headers.get("x-tenant-id");

    console.log(`[SESSION_STATUS] hostname: ${hostname}, tenantId: ${tenantIdFromHeaders}, sessionId: ${sessionId ? sessionId.substring(0, 20) + '...' : 'null'}`);

    if (!sessionId) {
      console.log("[SESSION_STATUS] No session cookie found");
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
        session: null,
        tenantId: tenantIdFromHeaders,
        error: null, // No error - just not authenticated
      });
    }

    // Use simplified validation function with debug info
    const ipAddress = request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") ||
                     "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;
    
    console.log(`[SESSION_STATUS] Validating session with IP: ${ipAddress}, UserAgent: ${userAgent ? userAgent.substring(0, 50) + '...' : 'null'}`);

    const sessionInfo = await validateRequest(sessionId, {
      ipAddress,
      userAgent,
    });

    if (!sessionInfo.isAuthenticated || !sessionInfo.session) {
      console.log("[SESSION_STATUS] Session validation failed");
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
        session: null,
        tenantId: tenantIdFromHeaders,
        error: "Session validation failed",
      });
    }

    console.log(`[SESSION_STATUS] Session validation successful for user: ${sessionInfo.user?.email}`);
    

    const session = sessionInfo.session;

    return NextResponse.json({
      isAuthenticated: true,
      user: sessionInfo.user || null,
      session: {
        id: session.sessionId,
        userId: session.userId,
        tenantId: session.tenantId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
      tenantId: session.tenantId,
      error: undefined,
    });
  } catch (error) {
    return handleApiError(error, request, {
      operation: 'get-session-status',
      component: 'auth-session',
      metadata: { endpoint: '/api/auth/session' }
    });
  }
}

/**
 * Refresh session route - extends session expiry
 * Usage: POST /api/auth/refresh
 */
export async function handleRefreshSession(
  request: NextRequest
): Promise<NextResponse> {
  console.log(`🔄 [REFRESH_SESSION] ========== SESSION REFRESH REQUEST STARTED ==========`);

  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    console.log(`🔄 [REFRESH_SESSION] Session cookie present: ${!!sessionId}`);

    if (!sessionId) {
      console.log(`❌ [REFRESH_SESSION] No session cookie found`);
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    console.log(`🔄 [REFRESH_SESSION] Validating existing session: ${sessionId.substring(0, 16)}...`);

    // First validate the existing session
    const sessionInfo = await validateRequest(sessionId, {
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!sessionInfo.isAuthenticated || !sessionInfo.session) {
      console.log(`❌ [REFRESH_SESSION] Session validation failed - not authenticated or session not found`);
      return NextResponse.json(
        { error: "Session not found or invalid" },
        { status: 401 }
      );
    }

    const userId = sessionInfo.user?.id;
    const tenantId = sessionInfo.session.tenantId;

    console.log(`✅ [REFRESH_SESSION] Session valid - userId: ${userId}, tenantId: ${tenantId}`);

    if (!userId || !tenantId) {
      console.log(`❌ [REFRESH_SESSION] Missing userId or tenantId`);
      return NextResponse.json(
        { error: "Missing user ID or tenant ID" },
        { status: 400 }
      );
    }

    // Step 1: Extend session
    const { extendSessionOnly } = await import('../core/sessions');
    const renewedSession = await extendSessionOnly(sessionId);

    if (!renewedSession) {
      return NextResponse.json(
        { error: "Failed to extend session" },
        { status: 500 }
      );
    }

    // Step 2: Refresh user access token (FORCE refresh, don't just get cached token)
    let tokenRefreshed = false;
    let tokenError: string | undefined;

    try {
      const { TokenManager } = await import('../managers/token-manager');
      const tokenManager = TokenManager.getInstance();

      console.log(`[REFRESH_SESSION] Refreshing user access token for user: ${userId}`);

      const newToken = await tokenManager.refreshUserAccessToken(
        tenantId,
        userId
      );

      if (newToken) {
        tokenRefreshed = true;
        console.log(`✅ [REFRESH_SESSION] User access token refreshed successfully`);
      } else {
        tokenError = 'Token refresh returned null';
        console.warn(`⚠️ [REFRESH_SESSION] Failed to refresh user access token, but session was extended`);
      }
    } catch (error) {
      tokenError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [REFRESH_SESSION] Error refreshing user access token:`, error);
    }

    console.log(
      `✅ [REFRESH_SESSION] Session extended for user: ${sessionInfo.user?.email}\n` +
      `   - New expiry: ${renewedSession.expiresAt}\n` +
      `   - Token refreshed: ${tokenRefreshed ? 'YES ✅' : 'NO ❌'}\n` +
      `   - Token error: ${tokenError || 'None'}`
    );

    console.log(`🔄 [REFRESH_SESSION] ========== SESSION REFRESH REQUEST COMPLETED ==========`);

    return NextResponse.json({
      success: true,
      expiresAt: renewedSession.expiresAt,
      tokenRefreshed,
      tokenError,
    });
  } catch (error) {
    return handleApiError(error, request, {
      operation: 'refresh-session',
      component: 'auth-refresh',
      metadata: { endpoint: '/api/auth/refresh' }
    });
  }
}
