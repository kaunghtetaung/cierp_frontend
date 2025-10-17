import { NextRequest, NextResponse } from "next/server";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getTokenForRequest } from "@repo/auth/core";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const verificationToken = body.token;

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
    
    console.log("🔍 [VERIFY-EMAIL] Step 1: Token retrieval", {
      tenantId,
      apiUrl,
      tokenFound: !!token,
      tokenType: token ? (token.startsWith("user_") ? "UserToken" : token.startsWith("tenant_") ? "TenantToken" : "JWT Token") : "None",
      tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
      tokenLength: token?.length || 0,
    });
    
    if (!token) {
      console.error("❌ [VERIFY-EMAIL] Failed to get access token for email verification");
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

    const endpoint = `/core/users/verify-email/${verificationToken}`;
    
    console.log("📤 [VERIFY-EMAIL] Step 2: Preparing request", {
      endpoint,
      method: "GET",
      baseURL: apiUrl,
      tenantId,
      verificationToken: verificationToken.substring(0, 20) + "...",
      headers: {
        "x-tenant-id": tenantId,
        "Authorization": `Bearer ${token.substring(0, 20)}...`,
      }
    });

    // Call the email verification endpoint
    // The HttpClient will handle adding x-tenant-id header via request config
    console.log("📡 [VERIFY-EMAIL] Step 3: Making API request...");
    
    // Try GET method since backend might expect GET for verification
    const response = await httpClient.request(
      `/core/users/verify-email/${verificationToken}`,
      {
        method: "GET",
        tenantId: tenantId,
        withAuth: true,
      }
    );

    console.log("📥 [VERIFY-EMAIL] Step 4: API Response received", {
      success: response.success,
      hasData: !!response.data,
      hasError: !!response.error,
      errorMessage: response.error || "None",
      dataPreview: response.data ? {
        userId: (response.data as any).userId || "N/A",
        email: (response.data as any).email || "N/A",
        isVerified: (response.data as any).isEmailVerified || false
      } : "No data",
      responseStatus: response.success ? "SUCCESS" : "FAILURE"
    });

    // Handle response based on ApiResponse structure
    if (response.success) {
      console.log("✅ [VERIFY-EMAIL] Step 5: Verification successful", {
        userId: (response.data as any)?.userId,
        email: (response.data as any)?.email,
        message: "Email verified successfully! User can now log in."
      });
      
      return NextResponse.json({
        success: true,
        message: "Email verified successfully! You can now log in to your account.",
        data: response.data,
      });
    }

    // Handle error cases
    const errorMessage = response.error || "Failed to verify email";
    
    console.log("❌ [VERIFY-EMAIL] Step 5: Verification failed", {
      errorMessage,
      errorType: errorMessage.includes("Invalid") ? "INVALID_TOKEN" : 
                 errorMessage.includes("expired") ? "EXPIRED_TOKEN" :
                 errorMessage.includes("not found") ? "NOT_FOUND" :
                 errorMessage.includes("404") ? "NOT_FOUND" : "UNKNOWN",
      willReturnStatus: errorMessage.includes("Invalid") || errorMessage.includes("expired") ? 400 :
                       errorMessage.includes("not found") || errorMessage.includes("404") ? 404 : 500
    });
    
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
    console.error("🔥 [VERIFY-EMAIL] Step 6: Unexpected error caught", {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : "No stack trace",
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while verifying your email. Please try again later.",
      },
      { status: 500 }
    );
  }
}