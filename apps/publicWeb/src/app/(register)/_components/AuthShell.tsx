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
}: AuthShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant } = useTenant();

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8f0fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2460B9] mx-auto mb-4" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  const backgroundPattern = `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/svg%3E`;

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
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#e8f0fa" }}>
        <header
          className="relative z-50"
          style={{
            backgroundColor: "#2460B9",
            backgroundImage: `url("${backgroundPattern}")`,
            backgroundRepeat: "repeat",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between gap-3">
              {hideBack ? (
                <Link
                  href="/"
                  className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">
                    Home
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">
                    Back
                  </span>
                </button>
              )}

              <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start sm:ml-4 min-w-0">
                {tenant.brandInfo?.logoUrl && (
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <S3Image
                      src={tenant.brandInfo.logoUrl}
                      alt={tenant.brandInfo?.title || "Logo"}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="text-white min-w-0">
                  <h1 className="text-base sm:text-xl font-semibold truncate">
                    <span className="md:hidden">{displayShort}</span>
                    <span className="hidden md:inline">{displayName}</span>
                  </h1>
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-blue-100 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                <LangSelectorUI
                  variant="dropdown"
                  showFlag={true}
                  showNativeName={true}
                  showName={false}
                  triggerClassName="text-white hover:text-blue-100 transition-colors"
                  contentClassName="!bg-[#1e4f99] border-white/30 backdrop-blur-sm"
                />
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
