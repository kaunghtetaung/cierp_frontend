import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getAuthenticationStatus, getCurrentUser } from "@repo/auth/server-api";
import { HeaderContainer } from "./header";
import { FooterContainer } from "./footer";
import type { NavigationItem } from "./navigation/types";

// CSS variables + the .medical-pattern-bg class the header consumes.
// Without this import, library/login/register renders the header
// structurally but the navbar bg, mobile-header bg, and pattern look
// transparent because those tokens only live in default theme's CSS.
import "./site-shell.css";

interface SiteShellLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Optional menu override. When provided, the header skips the
   *  CMS-managed menu fetch and renders these items instead. */
  navigationItems?: NavigationItem[];
}

/**
 * Site shell — header + main + footer wrapper used by routes that
 * intentionally sit OUTSIDE the theme system (library, login, register).
 *
 * Theme-driven routes under `(cms)` ship their own header/footer via
 * each theme's `ThemeLayout`. The shell here is the "neutral" chrome
 * that every tenant sees identically — same nav, same footer, same
 * brand. When a theme wants to override chrome, it does so inside its
 * own theme bundle without touching this file.
 */
export async function SiteShellLayout({
  children,
  className = "",
  navigationItems,
}: SiteShellLayoutProps) {
  let tenantId: string | null = null;
  let currentLanguage: "en" | "mm" = "en";

  try {
    const middlewareData = await getMiddlewareDataFromHeaders();
    tenantId = middlewareData.tenantId;
    currentLanguage = middlewareData.language as "en" | "mm";
  } catch {
    tenantId = "default";
    currentLanguage = "en";
  }

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
    console.error("SiteShellLayout: auth status failed", error);
    isAuthenticated = false;
    userRoles = [];
  }

  return (
    <div
      // `site-shell` class scopes the CSS custom properties from
      // site-shell.css to this subtree. Without it, the chrome
      // colour tokens would land on :root and override (cms)
      // tenant themes after a back-navigation.
      className={`site-shell
      min-h-screen flex flex-col
      font-sans antialiased
      bg-gradient-to-br from-background via-muted/30 to-background
      text-foreground relative overflow-x-hidden
      ${className}
    `}
    >
      {/* Animated Background Pattern — matches the default theme's
          ThemeLayout look so library/login feel like the same site. */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform -translate-y-1/2 animate-pulse" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl transform -translate-y-1/2 animate-pulse" />
      </div>

      <div className="flex-shrink-0">
        <HeaderContainer
          tenantId={tenantId || "default"}
          currentLanguage={currentLanguage}
          isAuthenticated={isAuthenticated}
          userRoles={userRoles}
          navigationItems={navigationItems}
        />
      </div>

      <main className="flex-1 flex flex-col">{children}</main>

      <div className="flex-shrink-0 mt-auto">
        <FooterContainer
          tenantId={tenantId || "default"}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
}

export default SiteShellLayout;
