import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getAuthenticationStatus, getCurrentUser } from "@repo/auth/server-api";
import { HeaderContainer } from "./header";
import { FooterContainer } from "./footer";
import type { NavigationItem } from "./navigation/types";

// Library-local CSS — variables + .medical-pattern-bg the header
// consumes. Decoupled from the (cms) theme system on purpose so the
// library OPAC looks the same regardless of the tenant's chosen theme.
import "./library-shell.css";

interface LibraryShellLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Optional menu override. When provided, the header skips the
   *  CMS-managed menu fetch and renders these items instead. */
  navigationItems?: NavigationItem[];
}

/**
 * Library shell — header + main + footer wrapper for `app/library/*`
 * routes. This is a DEDICATED COPY of the components/site-shell so
 * that future redesigns of the (cms) home-page chrome (when a new
 * theme is built) cannot accidentally regress the library OPAC. The
 * library team owns this folder; the rest of the site lives in
 * `components/site-shell` and `themes/<theme>/`.
 *
 * If you change something here, decide explicitly whether the same
 * change should be ported to `components/site-shell` (login/register
 * use that one) — it will NOT be picked up automatically.
 */
export async function LibraryShellLayout({
  children,
  className = "",
  navigationItems,
}: LibraryShellLayoutProps) {
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
    console.error("LibraryShellLayout: auth status failed", error);
    isAuthenticated = false;
    userRoles = [];
  }

  return (
    <div
      // `library-shell` class scopes the chrome's CSS custom
      // properties (--color-nav-bg, --color-banner-bg, …) to this
      // subtree. Without it, library-shell.css would set them on
      // :root and bleed into (cms) tenant themes after navigating
      // back to home.
      className={`library-shell
      min-h-screen flex flex-col
      font-sans antialiased
      bg-gradient-to-br from-background via-muted/30 to-background
      text-foreground relative overflow-x-hidden
      ${className}
    `}
    >
      {/* Animated Background Pattern — owned by the library shell;
          tweak independently from `(cms)` chrome. */}
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

export default LibraryShellLayout;
