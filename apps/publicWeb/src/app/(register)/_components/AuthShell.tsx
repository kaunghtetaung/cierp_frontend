"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { S3Image } from "@/components/common/S3Image";
import { useTenant } from "@repo/tenant";
import { LangSelectorUI } from "@/components/site-shell/navigation/header/LangSelectorUI";
import { LangSelectorProvider } from "@/feature-components/lang-selector";
import type { Language } from "@/feature-components/lang-selector";

interface AuthShellProps {
  children: React.ReactNode;
  initialLanguage?: string;
  /** Active theme key (`default`, `um1sf`, …). Applied as `.theme-<name>`
   *  on the shell's root so all theme CSS variables (primary, accent,
   *  …) are available inside auth screens. */
  themeName?: string;
  /** Active variant key (`cardinal`, `blue`, `teal`, …) for the theme.
   *  Applied as `.theme-variant-<key>` alongside the theme class. */
  themeVariant?: string;
}

/**
 * Shared chrome for all auth/registration screens — signup, verify,
 * success, profileSetup wizards. Lives under the `(register)` route
 * group so it stays deliberately detached from the `(cms)` theme
 * variants (default / um1sf etc.): conversion flows benefit from a
 * stable, brand-light surface that doesn't shift per-tenant theme.
 *
 * The chrome itself reads tenant logo + name from `useTenant()` so it
 * still feels owned by the tenant; only the layout structure is
 * theme-agnostic.
 *
 * Routes inside `(register)/` should render plain content under this
 * shell rather than re-implementing their own header/footer/lang
 * switcher.
 */
export default function AuthShell({
  children,
  initialLanguage = "en",
  themeName,
  themeVariant,
}: AuthShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant } = useTenant();

  // Mirror the theme class set by `(cms)/layout` so um1 gets cardinal-red,
  // UDM blue, etc. — auth chrome then reads `var(--color-primary)` etc.
  // straight from the theme's `index.css` blocks. Falls back to no class
  // if themeName isn't provided; theme-less environments use the inline
  // styles below.
  const themeClass = themeName
    ? `theme-${themeName}${themeVariant ? ` theme-variant-${themeVariant}` : ""}`
    : "";

  if (!tenant) {
    return (
      <div className={`${themeClass} min-h-screen flex items-center justify-center bg-muted`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const languages: Language[] = (tenant.langSupport || ["en", "mm"]).map(
    (code: string) => {
      const map: Record<string, Language> = {
        en: { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", direction: "ltr" },
        mm: { code: "mm", name: "Myanmar", nativeName: "မြန်မာ", flag: "🇲🇲", direction: "ltr" },
      };
      return map[code] || map.en;
    },
  );

  const displayName =
    (tenant.displayName &&
      tenant.displayName[
        initialLanguage as keyof typeof tenant.displayName
      ]) ||
    tenant.brandInfo?.title ||
    "Welcome";
  const displayShort =
    (tenant.displayShortName &&
      tenant.displayShortName[
        initialLanguage as keyof typeof tenant.displayShortName
      ]) ||
    displayName;

  // Per-route subtitle. Keeps each screen identifiable inside the
  // shared chrome without requiring callers to thread props in.
  const subtitle = (() => {
    if (!pathname) return "";
    if (pathname.startsWith("/profileSetup")) return "Profile Setup";
    if (pathname.startsWith("/signup")) return "Create Account";
    if (pathname.startsWith("/verify")) return "Email Verification";
    if (pathname.startsWith("/success")) return "Account Created";
    return "";
  })();

  // Hide the back-arrow on terminal screens where the only sensible
  // next step is forward (verify result, success landing) — going
  // back from there reopens the form they just submitted.
  const hideBack =
    pathname?.startsWith("/verify") || pathname?.startsWith("/success");

  return (
    <LangSelectorProvider
      key={initialLanguage}
      initialLanguage={initialLanguage}
      languages={languages}
    >
      <div
        className={`${themeClass} min-h-screen flex flex-col`}
        style={{
          fontFamily: "var(--font-sans, system-ui)",
          backgroundColor: "#F8FAFC", // soft slate-50 — calm canvas
        }}
      >
        {/* Sticky header — clean white surface, brand-coloured accent
            strip at the bottom. No background pattern; a subtle ring
            of brand colour reads as "tenant chrome" without the
            heavy filled bar the old design used. */}
        <header
          className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b"
          style={{
            borderBottomColor: "var(--color-primary, #2460B9)",
            borderBottomWidth: "3px",
          }}
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back / Home button — ghost pill, brand-coloured icon */}
              {hideBack ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Home"
                >
                  <ArrowLeft
                    className="h-4 w-4"
                    style={{ color: "var(--color-primary, #2460B9)" }}
                  />
                  <span className="text-sm font-medium hidden sm:inline">
                    Home
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft
                    className="h-4 w-4"
                    style={{ color: "var(--color-primary, #2460B9)" }}
                  />
                  <span className="text-sm font-medium hidden sm:inline">
                    Back
                  </span>
                </button>
              )}

              {/* Brand block — logo + tenant name + screen subtitle.
                  Centred on mobile (left/right buttons flank it) and
                  left-aligned from sm+ for a more conventional layout. */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 justify-center sm:justify-start sm:ml-2 min-w-0">
                {tenant.brandInfo?.logoUrl && (
                  <div className="relative h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-50 ring-1 ring-gray-100">
                    <S3Image
                      src={tenant.brandInfo.logoUrl}
                      alt={tenant.brandInfo?.title || "Logo"}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h1
                    className="text-sm sm:text-base font-semibold truncate leading-tight"
                    style={{ color: "var(--color-primary, #2460B9)" }}
                  >
                    <span className="md:hidden">{displayShort}</span>
                    <span className="hidden md:inline">{displayName}</span>
                  </h1>
                  {subtitle && (
                    <p className="text-[11px] sm:text-xs text-gray-500 truncate leading-tight mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Language selector — outlined pill, brand-coloured ring
                  on hover. The original was a borderless ghost on dark
                  bg which read as a transparent label; this gives it a
                  proper "clickable control" affordance. */}
              <div className="flex items-center flex-shrink-0">
                <div
                  className="rounded-full border border-gray-200 hover:border-gray-300 transition-colors px-1.5 py-1 sm:px-2"
                >
                  <LangSelectorUI
                    variant="dropdown"
                    showFlag={true}
                    showNativeName={true}
                    showName={false}
                    triggerClassName="text-gray-700 hover:text-gray-900 transition-colors"
                    contentClassName="bg-white border-gray-200 shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-8">
          {children}
        </main>

        <footer className="hidden sm:block border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-600">
              © {new Date().getFullYear()} {displayName}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </LangSelectorProvider>
  );
}
