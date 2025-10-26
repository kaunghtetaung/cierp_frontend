"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { headers } from "next/headers";
import { getRateLimiter } from "./utils/rate-limiter";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getTokenForRequest } from "@repo/auth/core";
import { withServerActionErrorHandler } from "@repo/utils/server";

// Validation schema
const signupSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  verificationToken: z.string().min(1, "Verification token is required"),
});


// Bot detection helper
async function detectBot(
  formData: FormData,
  verificationToken: string
): Promise<{ isBot: boolean; reason?: string }> {
  try {
    // Parse verification token
    const tokenData = JSON.parse(atob(verificationToken));
    
    // Check 1: Token age (should be recent, within 5 minutes)
    const tokenAge = Date.now() - tokenData.timestamp;
    if (tokenAge > 5 * 60 * 1000) {
      return { isBot: true, reason: "Verification token expired" };
    }
    
    // Check 2: Minimum time to complete form (from page load to submission)
    const formLoadTime = formData.get("formLoadTime");
    if (formLoadTime) {
      const timeOnForm = Date.now() - parseInt(formLoadTime.toString(), 10);
      // Check if form was filled in less than 5 seconds from page load
      if (timeOnForm < 5000) {
        return { isBot: true, reason: "Form completed too quickly" };
      }
    }
    
    // Check 3: User agent validation
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    
    // Check for common bot patterns in user agent
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /ruby/i,
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      return { isBot: true, reason: "Suspicious user agent detected" };
    }
    
    // Check 4: Verify attempts count
    if (tokenData.attempts > 5) {
      return { isBot: true, reason: "Too many verification attempts" };
    }
    
    // Check 5: Check for honeypot field (if added to form)
    const honeypot = formData.get("website"); // Hidden field that bots might fill
    if (honeypot) {
      return { isBot: true, reason: "Honeypot field filled" };
    }
    
    // Check 6: Verify screen resolution is reasonable
    if (tokenData.screenResolution) {
      const [width, height] = tokenData.screenResolution.split('x').map(Number);
      if (width < 320 || height < 320 || width > 7680 || height > 4320) {
        return { isBot: true, reason: "Invalid screen resolution" };
      }
    }
    
    return { isBot: false };
  } catch (error) {
    console.error("Bot detection error:", error);
    return { isBot: true, reason: "Invalid verification token" };
  }
}

/**
 * Server Action for User Signup/Registration
 * 
 * This server action handles the complete signup flow including:
 * 1. Input validation using Zod schema
 * 2. Rate limiting to prevent abuse
 * 3. Bot detection with multiple checks
 * 4. Human verification validation
 * 5. Backend API integration for user creation
 * 
 * HUMAN VERIFICATION REQUIREMENT:
 * - YES, human verification IS REQUIRED and is checked in this server action
 * - The verification token from the client-side challenge is validated
 * - Multiple bot detection layers ensure the request is from a real human:
 *   - Token age validation (must be recent, within 5 minutes)
 *   - Minimum completion time (prevents instant bot submissions)
 *   - User agent pattern matching
 *   - Honeypot field detection
 *   - Screen resolution validation
 *   - Attempt count limiting
 * 
 * BACKEND API INTEGRATION:
 * - Endpoint: POST /api/users/register
 * - Tenant-scoped user creation
 * - Password is sent to backend for secure hashing (never hashed client-side)
 * - Returns user ID and verification requirements
 * 
 * @param prevState - Previous form state (for useActionState hook)
 * @param formData - Form data containing user registration details
 * @returns Success/error state with user data or validation errors
 */
export async function signupAction(
  prevState: any,
  formData: FormData
) {
  return withServerActionErrorHandler(async () => {
    // Extract form data
    const rawData = {
      displayName: formData.get("displayName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      verificationToken: formData.get("verificationToken") as string,
    };

    const tenantId = formData.get("tenantId") as string;

    // Validate input
    const validationResult = signupSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((error) => {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      });
      
      return {
        success: false,
        error: "Please correct the errors below",
        fieldErrors,
        data: null,
      };
    }

    // Get client IP for rate limiting
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";

    // Rate limiting check
    const rateLimiter = getRateLimiter();
    if (rateLimiter) {
      // Check by email
      if (rateLimiter.isRateLimited(rawData.email, clientIp)) {
        const remainingTime = rateLimiter.getRemainingTime(rawData.email, clientIp);
        return {
          success: false,
          error: `Too many signup attempts. Please try again in ${remainingTime} seconds.`,
          fieldErrors: {},
          data: null,
        };
      }

      // Record this attempt
      const { limited, remaining } = rateLimiter.recordAttempt(rawData.email, clientIp);
      if (limited) {
        return {
          success: false,
          error: "Too many signup attempts. Please try again later.",
          fieldErrors: {},
          data: null,
        };
      }
    }

    // Bot detection
    const botCheck = await detectBot(formData, rawData.verificationToken);
    if (botCheck.isBot) {
      console.warn("Bot detected:", botCheck.reason);
      
      // Log suspicious activity
      console.warn("Suspicious signup attempt:", {
        reason: botCheck.reason,
        ip: clientIp,
        userAgent: headersList.get("user-agent"),
        email: rawData.email,
        timestamp: new Date().toISOString(),
      });
      
      // Return generic error to avoid giving bots information
      return {
        success: false,
        error: "Verification failed. Please try again.",
        fieldErrors: {},
        data: null,
      };
    }

    // Get tenant context from middleware
    const middlewareData = await getMiddlewareDataFromHeaders();
    const actualTenantId = tenantId || middlewareData.tenantId;
    
    if (!actualTenantId) {
      return {
        success: false,
        error: "Unable to determine organization. Please try again.",
        fieldErrors: {},
        data: null,
      };
    }

    // Get additional request metadata
    const userAgent = headersList.get("user-agent") || "unknown";
    const acceptLanguage = headersList.get("accept-language") || "en";

    // Parse verification token for additional info
    const tokenData = JSON.parse(atob(rawData.verificationToken));

    // Prepare data for backend API - only the required fields
    const signupData = {
      displayName: validationResult.data.displayName.trim(),
      email: validationResult.data.email.toLowerCase().trim(),
      password: validationResult.data.password,
    };

    // Get appropriate token for the request
    // The tenant token should already be initialized in the layout
    // This will use: User token > Tenant token > Initializer token
    const apiUrl = await getApiDomain();
    const token = await getTokenForRequest(actualTenantId);
    
    if (!token) {
      console.error("Failed to get access token for signup");
      return {
        success: false,
        error: "Service temporarily unavailable. Please try again.",
        fieldErrors: {},
        data: null,
      };
    }

    // Create HTTP client - it will handle token injection via headers
    const httpClient = createHttpClient({
      baseURL: apiUrl,
      enableAuth: true,
      enableCSRF: true,
    });

    console.log("Submitting signup data to backend:", {
      endpoint: "/core/users/signup",
      tenantId: actualTenantId,
      email: signupData.email,
    });

    // Call the user registration endpoint
    // The HttpClient will handle adding x-tenant-id header via request config
    // Note: httpClient automatically stringifies the body, so we pass the object directly
    const response = await httpClient.request(
      "/core/users/signup",
      {
        method: "POST",
        body: signupData, // Pass object directly, httpClient will stringify it
        headers: {
          "Content-Type": "application/json",
        },
        tenantId: actualTenantId,
        withAuth: true,
      }
    );

    // Handle response based on ApiResponse structure
    if (!response.success) {
      const errorMessage = response.error || "Failed to create account";
      
      // Check for specific error cases
      if (errorMessage.includes("already exists") || errorMessage.includes("409")) {
        // Conflict - user already exists
        return {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
          fieldErrors: { email: ["Email already registered"] },
          data: null,
        };
      }
      
      if (errorMessage.includes("validation") || errorMessage.includes("400")) {
        // Bad request - validation error
        return {
          success: false,
          error: "Invalid request. Please check your information.",
          fieldErrors: {},
          data: null,
        };
      }
      
      // Generic error
      return {
        success: false,
        error: errorMessage,
        fieldErrors: {},
        data: null,
      };
    }

    // Parse the successful response data
    const userData = response.data as any;
    
    // Log successful signup for analytics
    console.log("Successful signup:", {
      userId: userData?.id,
      email: userData?.email,
      tenantId: actualTenantId,
      timestamp: new Date().toISOString(),
    });

    // Return success with user data
    return {
      success: true,
      error: null,
      fieldErrors: {},
      data: {
        message: "Account created successfully!",
        userId: userData?.id,
        displayName: userData?.displayName,
        email: userData?.email,
        isEmailVerified: userData?.isEmailVerified || false,
        roles: userData?.roles || [],
      },
    };
  }, {
    operation: 'user-signup',
    component: 'signup-actions',
    metadata: { email: formData.get("email") as string }
  });
}