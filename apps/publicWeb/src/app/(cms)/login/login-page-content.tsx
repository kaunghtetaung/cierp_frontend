// Client-side login page content
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { TenantSettings } from "@repo/types";
import { initiateLogin } from "@repo/auth/login-utils";

function ModernLoginContent({
  tenantSettings,
}: {
  tenantSettings: TenantSettings | null;
}) {
  const searchParams = useSearchParams();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnUrl =
    searchParams.get("redirect_url") ||
    searchParams.get("returnUrl") ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    "/dashboard";

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      console.log("🔐 [Login] Initiating OIDC authentication...");
      console.log("🔐 [Login] Return URL:", returnUrl);
      // Use proper OIDC login flow
      await initiateLogin(returnUrl);
    } catch (error) {
      console.error("❌ [Login] Login failed:", error);
      setError(error instanceof Error ? error.message : "Login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  // Auto-redirect to OIDC login on page load
  useEffect(() => {
    console.log("🚀 [Login] Page loaded - auto-redirecting to OIDC...");
    setIsLoggingIn(true); // Set loading state immediately
    handleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run once on mount

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="text-center">
        {/* Animated spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {/* Inner pulse */}
          <div className="absolute inset-3 bg-blue-100 rounded-full animate-pulse"></div>
        </div>

        {/* Processing text */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Processing...</h2>
        <p className="text-gray-600">Redirecting to secure login</p>

        {/* Animated dots */}
        <div className="flex justify-center items-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* Error display (only shown if there's an error) */}
      {error && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LoginPageContent({ tenantSettings }: { tenantSettings: any }) {
  return <ModernLoginContent tenantSettings={tenantSettings} />;
}
