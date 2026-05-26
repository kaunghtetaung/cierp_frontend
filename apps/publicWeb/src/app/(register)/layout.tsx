import React from "react";
import { cookies } from "next/headers";
import { isKnownTheme, resolveThemeVariant } from "@repo/types";
import { getContentSettings } from "@repo/content";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import AuthShell from "./_components/AuthShell";

// Pull in every theme's CSS so AuthShell's `.theme-<name>.theme-variant-<v>`
// class actually matches a rule on a hard refresh of /signup, /verify,
// /success, /profileSetup. (Without this the theme CSS only loads under
// `(cms)/layout`, so direct visits to auth screens fall back to the inline
// #2460B9 default instead of the tenant's brand colour.)
//
// Each file only defines CSS variables scoped under `.theme-<name>` and
// `.theme-<name>.theme-variant-<v>` selectors — they have no side
// effects when the matching class isn't on a DOM ancestor.
import "@/themes/default/styles/index.css";
import "@/themes/um1sf/styles/index.css";
import "@/themes/crystal/styles/variables.css";

interface RegisterLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for all `(register)` routes — signup, verify, success,
 * profileSetup. Wraps children in `AuthShell` so signup/verify flows
 * never inherit the marketing `(cms)` header/footer chrome.
 *
 * We DO inherit the active theme's CSS variables (primary colour,
 * accent, etc.) by applying the same `theme-<name> theme-variant-<v>`
 * class on the AuthShell root that `(cms)/layout` applies on its
 * ThemeLayout. That way um1 stays cardinal-red, UDM stays blue, etc.,
 * without auth chrome adopting the full theme's nav/footer layout.
 */
export default async function RegisterLayout({
  children,
}: RegisterLayoutProps) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("x-lang");
  const initialLanguage = langCookie?.value || "en";

  // Resolve themeName + themeVariant the same way (cms)/layout does
  // so CSS variables match across the site.
  let themeName = "default";
  let themeVariant: string | undefined;
  try {
    const middleware = await getMiddlewareDataFromHeaders();
    const tenantId = middleware?.tenantId;
    if (tenantId) {
      const contentSettings = await getContentSettings(tenantId).catch(
        () => null,
      );
      const candidate = (contentSettings as any)?.themeName;
      if (candidate && isKnownTheme(candidate)) {
        themeName = candidate;
      }
      themeVariant = resolveThemeVariant(
        themeName,
        (contentSettings as any)?.themeVariant,
      );
    }
  } catch {
    // Fall through to defaults — AuthShell can still render with the
    // baseline theme tokens.
  }

  return (
    <AuthShell
      initialLanguage={initialLanguage}
      themeName={themeName}
      themeVariant={themeVariant}
    >
      {children}
    </AuthShell>
  );
}
