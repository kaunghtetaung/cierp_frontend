"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/styled-components/ui/DropdownMenu";
import { S3Image } from "@/components/common/S3Image";
import { useTenant } from "@repo/tenant";
import {
  LangSelectorProvider,
  useLangSelector,
} from "@/feature-components/lang-selector";
import type { Language } from "@/feature-components/lang-selector";

/**
 * Compact in-shell language switcher. Built directly on the
 * DropdownMenu primitives so we can pin a small trigger size and
 * own the active-item palette. The shared `LangSelectorUI` defaults
 * to a 44px touch target and a dark dropdown background — too big
 * for the auth chrome and unreadable when the theme tints the
 * accent background dark (e.g. um1 cardinal-red on cardinal-red
 * active item).
 */
function CompactLangSwitcher() {
  const { currentLanguage, languages, changeLanguage } = useLangSelector();
  if (!languages || languages.length < 2) return null;
  const current =
    languages.find((l: Language) => l.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1 h-8 px-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Select language"
        >
          {current.flag && <span className="text-sm leading-none">{current.flag}</span>}
          <span className="uppercase tracking-wider">{current.code}</span>
          <ChevronDown className="h-3 w-3 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px] bg-white border-gray-200 shadow-lg z-[9999] p-1"
      >
        {languages.map((language: Language) => {
          const isActive = language.code === currentLanguage;
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className="cursor-pointer rounded-md px-2.5 py-1.5 text-sm focus:bg-gray-100 data-[highlighted]:bg-gray-100"
              // Active item uses the brand colour as a subtle wash with the
              // foreground forced to the brand's primary-foreground so the
              // text stays readable even when the theme tint is dark (e.g.
              // um1 cardinal-red). Inactive items keep neutral gray.
              style={
                isActive
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--color-primary, #2460B9) 12%, transparent)",
                      color: "var(--color-primary, #2460B9)",
                      fontWeight: 600,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-2 w-full">
                {language.flag && (
                  <span className="text-sm leading-none">{language.flag}</span>
                )}
                <span className="flex-1 truncate">{language.nativeName}</span>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
          // Brand-tinted slate-100 — pulls the page out of pure-white
          // territory so the white header + white card stand out as
          // distinct surfaces. The 6% brand wash ties the canvas to
          // each tenant's theme without overpowering content colour.
          backgroundColor:
            "color-mix(in srgb, var(--color-primary, #2460B9) 6%, #F1F5F9)",
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
              {/* Brand block doubles as the "go home" affordance — the
                  whole logo+name row is a Link to `/`. No separate back
                  button (would compete with the logo for the same job
                  and clutter the chrome). */}
              <Link
                href="/"
                aria-label="Home"
                title="Home"
                className="flex items-center gap-2.5 sm:gap-3 flex-1 justify-start min-w-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg"
              >
                {tenant.brandInfo?.logoUrl && (
                  <div className="relative h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-50 ring-1 ring-gray-100 group-hover:ring-gray-200 transition-shadow">
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
                    className="text-sm sm:text-base font-semibold truncate leading-tight group-hover:underline underline-offset-4 decoration-2"
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
              </Link>

              {/* Compact lang switcher — see CompactLangSwitcher above
                  for why we don't reuse the shared LangSelectorUI here. */}
              <div className="flex items-center flex-shrink-0">
                <CompactLangSwitcher />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile gets `py-4` so the form card has breathing room
            under the sticky header (previously `py-0` glued the card
            to the accent stripe). Desktop keeps `py-8`. */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </main>

        {/* Footer now visible on mobile too — same copyright text in
            a slimmer container. Earlier this was `hidden sm:block`,
            which left the page with no bottom anchor on phones. */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <p className="text-center text-xs sm:text-sm text-gray-600">
              © {new Date().getFullYear()} {displayName}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </LangSelectorProvider>
  );
}
