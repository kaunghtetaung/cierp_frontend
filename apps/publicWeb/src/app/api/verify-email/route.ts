import { NextRequest, NextResponse } from "next/server";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getTokenForRequest } from "@repo/auth/core";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token: verificationToken } = body;

    if (!verificationToken) {
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

    // Get appropriate token for the request
    // The tenant token should already be initialized in the layout
    // This will use: User token > Tenant token > Initializer token
    const apiUrl = await getApiDomain();
    const token = await getTokenForRequest(tenantId);
    
    if (!token) {
      console.error("Failed to get access token for email verification");
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Create HTTP client - it will handle token injection via headers
    const httpClient = createHttpClient({
      baseURL: apiUrl,
      enableAuth: true,
      enableCSRF: true,
    });

    console.log("Verifying email with backend:", {
      endpoint: `/core/users/verify-email/${verificationToken}`,
      tenantId,
    });

    // Call the email verification endpoint
    // The HttpClient will handle adding x-tenant-id header via request config
    const response = await httpClient.request(
      `/core/users/verify-email/${verificationToken}`,
      {
        method: "POST",
        tenantId: tenantId,
        withAuth: true,
      }
    );

    // Handle response based on ApiResponse structure
    if (response.success) {
      return NextResponse.json({
        success: true,
        message: "Email verified successfully! You can now log in to your account.",
        data: response.data,
      });
    }

    // Handle error cases
    const errorMessage = response.error || "Failed to verify email";
    
    if (errorMessage.includes("Invalid") || errorMessage.includes("expired")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification token. Please request a new verification email.",
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes("not found") || errorMessage.includes("404")) {
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
        error: errorMessage,
      },
      { status: 500 }
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