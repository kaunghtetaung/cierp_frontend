"use client";

import { useEffect } from "react";
import { IconComponent } from "@repo/ui";

/**
 * Logout Page
 * Automatically initiates OIDC logout when accessed
 * URL: www.tenant.com/logout
 */
export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("🚪 [Logout] Initiating logout...");

        // Clear local storage
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }

        // Call the logout API endpoint
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to logout");
        }

        // Response will be a redirect to OIDC logout endpoint
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          // Fallback: redirect to login page
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("❌ [Logout] Error:", error);
        // Fallback: redirect to login page
        window.location.href = "/login";
      }
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center space-y-6">
        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
            <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Logout Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
            <IconComponent
              name="LogOut"
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
            />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Signing Out
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we securely log you out...
          </p>
        </div>

        {/* Security Message */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500">
          <IconComponent name="Shield" className="w-4 h-4" />
          <span>Secure logout in progress</span>
        </div>
      </div>
    </div>
  );
}
