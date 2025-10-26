import React from "react";
import { headers } from "next/headers";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getAuthenticationStatus, getCurrentUser } from "@repo/auth/server-api";
import { HeaderContainer } from "../common/header";
import { FooterContainer } from "../common/footer";

interface ThemeLayoutProps {
  children: React.ReactNode;
  className?: string;
  tenantSetting?: Record<string, any> | null;
}

/**
 * Main Theme Layout Component
 * Server component that provides the base structure and data context
 */
export async function ThemeLayout({
  children,
  className = "",
  tenantSetting,
}: ThemeLayoutProps) {
  // Get tenant and middleware data, with fallback for build time
  let middlewareData;
  let tenantId: string | null = null;
  let currentLanguage: "en" | "mm" = "en";

  
  try {
    middlewareData = await getMiddlewareDataFromHeaders();
    tenantId = middlewareData.tenantId;
    currentLanguage = middlewareData.language as "en" | "mm";
  } catch (error) {
    // During build/static generation, headers aren't available
    tenantId = "default";
    currentLanguage = "en";
  }
  

  // Get real authentication data from server-side auth system
  let isAuthenticated = false;
  let userRoles: string[] = [];

  try {
    const authStatus = await getAuthenticationStatus();
    isAuthenticated = authStatus.isAuthenticated;

    if (isAuthenticated) {
      const user = await getCurrentUser();
      userRoles = user?.roles || [];
    }
  } catch (error) {
    console.error("Failed to get authentication status:", error);
    // Safe fallback - treat as unauthenticated
    isAuthenticated = false;
    userRoles = [];
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-destructive/10">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="space-y-4">
            <h1>Configuration Error</h1>
            <p>
              Unable to determine tenant configuration. Please check your setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      min-h-screen flex flex-col
      font-sans antialiased
      bg-gradient-to-br from-background via-muted/30 to-background
      text-foreground relative overflow-x-hidden
      ${className}
    `}
    >
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform -translate-y-1/2 animate-pulse" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl transform -translate-y-1/2 animate-pulse" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0">
        <HeaderContainer
          tenantId={tenantId}
          currentLanguage={currentLanguage}
          isAuthenticated={isAuthenticated}
          userRoles={userRoles}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <div className="flex-shrink-0 mt-auto">
        <FooterContainer
          tenantId={tenantId}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
}

export default ThemeLayout;
