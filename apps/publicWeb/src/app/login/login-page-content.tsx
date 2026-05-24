// Client-side login page content — pure OIDC initiator.
//
// On mount it kicks off `initiateLogin()` which redirects the
// browser to the auth provider. Until that redirect lands, the user
// sees a centred spinner with a "Redirecting to secure login"
// message. Errors (rare — the auth lib already validates config)
// surface in a banner with a retry button.

"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { initiateLogin } from "@repo/auth/login-utils";

export function LoginPageContent() {
  const searchParams = useSearchParams();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `returnUrl` precedence: explicit `redirect_url` query → legacy
  // `returnUrl` query → current origin (lands users back at the
  // homepage of whatever subdomain they came from). Default
  // `/dashboard` is the historical fallback.
  const returnUrl =
    searchParams.get("redirect_url") ||
    searchParams.get("returnUrl") ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "/dashboard";

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await initiateLogin(returnUrl);
    } catch (err) {
      console.error("[Login] OIDC initiation failed:", err);
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  // Auto-redirect to OIDC on mount. Empty deps — fires exactly once.
  useEffect(() => {
    handleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4">
      <div className="text-center max-w-sm">
        {/* Spinner — concentric ring + pulse */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-3 bg-blue-100 rounded-full animate-pulse" />
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-1">
          {error ? "Sign-in needs a retry" : "Signing you in…"}
        </h1>
        <p className="text-sm text-gray-600">
          {error
            ? "We couldn't start the login flow. Try again below."
            : "Redirecting to secure login."}
        </p>

        {!error && (
          <div className="flex justify-center items-center space-x-2 mt-5">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        {error && (
          <div className="mt-6 space-y-3">
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-left">
              <p className="text-sm font-medium text-red-800">Authentication error</p>
              <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoggingIn ? "Retrying…" : "Try sign-in again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
