import { NextRequest, NextResponse } from "next/server";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { TenantTokenStrategy } from "@repo/auth/tenant-token-strategy";
import { getCacheInstance } from "@repo/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Get tenant context from middleware
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      console.error("No tenant ID found in middleware data");
      return NextResponse.json(
        { success: false, error: "Unable to determine organization" },
        { status: 400 }
      );
    }

    // Get tenant access token
    const apiUrl = await getApiDomain();
    const cache = getCacheInstance();
    const tenantTokenStrategy = new TenantTokenStrategy(cache);
    
    // Try to get existing token or create new one
    let tenantToken = await tenantTokenStrategy.getToken(tenantId);
    
    if (!tenantToken) {
      // Get client credentials from environment
      const clientId = process.env.TENANT_CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID || '';
      const clientSecret = process.env.TENANT_CLIENT_SECRET || process.env.CLIENT_SECRET || '';
      
      if (clientId && clientSecret) {
        tenantToken = await tenantTokenStrategy.createTenantToken(tenantId, clientId, clientSecret);
      }
    }
    
    if (!tenantToken) {
      console.error("Failed to get tenant access token");
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Create HTTP client with tenant token
    const httpClient = createHttpClient({
      baseURL: apiUrl,
      enableAuth: true,
      authToken: tenantToken,
      enableCSRF: true,
    });

    console.log("Verifying email with backend:", {
      endpoint: `/core/users/verify-email/${token}`,
      tenantId,
    });

    // Call the email verification endpoint
    const response = await httpClient.post(
      `/core/users/verify-email/${token}`,
      {},
      {
        headers: {
          'x-tenant-id': tenantId,
        },
      }
    );

    // Handle different response statuses
    if (response.status === 200 || response.status === 201) {
      return NextResponse.json({
        success: true,
        message: "Email verified successfully! You can now log in to your account.",
        data: response.data,
      });
    }

    if (response.status === 400) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification token. Please request a new verification email.",
        },
        { status: 400 }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification token not found. It may have already been used.",
        },
        { status: 404 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify email. Please try again.",
      },
      { status: response.status || 500 }
    );

  } catch (error) {
    console.error("Email verification error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while verifying your email. Please try again later.",
      },
      { status: 500 }
    );
  }
}