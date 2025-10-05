// Client-side login page content
"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { TenantSettings } from "@repo/types";
import Image from "next/image";
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

  // Extract customization from tenant settings
  const title = (tenantSettings as any)?.name
    ? `Welcome to ${(tenantSettings as any).name}`
    : (tenantSettings as any)?.brandInfo?.title
    ? `Welcome to ${(tenantSettings as any).brandInfo.title}`
    : "Welcome";
  const subtitle =
    (tenantSettings as any)?.brandInfo?.subTitle ||
    "Please sign in to continue";

  const companyName =
    (tenantSettings as any)?.brandInfo?.title ||
    (tenantSettings as any)?.name ||
    "Company";

  const logoUrl = tenantSettings?.brandInfo?.logoUrl || undefined;

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      // Use proper OIDC login flow
      await initiateLogin(returnUrl);
    } catch (error) {
      console.error("Login failed:", error);
      setError(error instanceof Error ? error.message : "Login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white transition-colors duration-300">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-blue-50 to-gray-50">
        <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100"></div>
      </div>

      {/* Floating shapes for visual interest - using theme colors */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-32 w-40 h-40 bg-gray-200 rounded-full opacity-20 blur-xl animate-bounce"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-100 rounded-full opacity-20 blur-xl animate-ping"></div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Login card */}
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl border border-gray-200 overflow-hidden transition-colors duration-300">
            {/* Header section */}
            <div className="px-8 pt-12 pb-8 text-center bg-gradient-to-b from-white/90 to-white/60">
              {logoUrl && (
                <div className="mx-auto w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-gray-600 p-1 shadow-lg">
                  <Image
                    className="w-full h-full object-contain rounded-xl bg-white p-2 transition-colors duration-300"
                    src={logoUrl}
                    alt={companyName}
                    width={80}
                    height={80}
                  />
                </div>
              )}
              {!logoUrl && (
                <div className="mx-auto w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-gray-600 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              )}

              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="mt-3 text-gray-600 text-lg transition-colors duration-300">
                {subtitle}
              </p>
            </div>

            {/* Form section */}
            <div className="px-8 pb-12">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 transition-colors duration-300">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-600 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-red-600">
                        Login Error
                      </h3>
                      <p className="mt-1 text-sm text-red-500">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="group relative w-full flex items-center justify-center py-4 px-6 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-gray-600 hover:from-blue-500 hover:to-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-gray-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  {isLoggingIn ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6 mr-3 group-hover:rotate-3 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>Continue with Single Sign-On</span>
                    </>
                  )}
                </div>
              </button>

              {/* Security badges */}
              <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-gray-600">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1.5 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Secure Login</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1.5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Fast Access</span>
                </div>
              </div>

              {/* Terms */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-600 leading-relaxed transition-colors duration-300">
                  By continuing, you agree to our{" "}
                  <span className="text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-300">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-300">
                    Privacy Policy
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Custom footer */}
          {(tenantSettings as any)?.brandInfo?.description && (
            <div className="mt-8 text-center">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 transition-colors duration-300">
                <div className="text-sm text-gray-600">
                  {(tenantSettings as any).brandInfo.description}
                </div>
              </div>
            </div>
          )}

          {/* Development tools */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 bg-gray-100/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-200">
              <h3 className="font-semibold mb-4 flex items-center text-gray-900">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Development Tools
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Return URL:</span>{" "}
                    <span className="text-emerald-500 font-mono">
                      {returnUrl}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Logging In:</span>{" "}
                    <span
                      className={
                        isLoggingIn ? "text-amber-500" : "text-gray-600"
                      }
                    >
                      {isLoggingIn ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Error:</span>{" "}
                    <span className={error ? "text-red-600" : "text-gray-600"}>
                      {error || "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginPageContent({ tenantSettings }: { tenantSettings: any }) {
  return <ModernLoginContent tenantSettings={tenantSettings} />;
}
