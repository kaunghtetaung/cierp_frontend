import React from "react";
import { isKnownTheme, resolveThemeVariant } from "@repo/types";
import { getContentSettings } from "@repo/content";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

// Pull every tenant theme's CSS into this subtree so `var(--color-primary)`
// resolves the same way it does on (cms)/* routes. /profile pages aren't
// under the marketing site shell, so without these imports the brand
// variables would fall back to globals.css defaults on a hard refresh.
import "@/themes/default/styles/index.css";
import "@/themes/um1sf/styles/index.css";
import "@/themes/crystal/styles/variables.css";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for `/profile/*` pages — student profile, staff profile,
 * password change. Sets the `theme-<name>.theme-variant-<v>` class on
 * the wrapping div so brand-coloured controls in child pages
 * (back button, logo header, action buttons, etc.) pick up the same
 * `--color-primary` the rest of the site uses. Mirrors the wiring in
 * `(cms)/layout` and `(register)/layout`.
 *
 * Does NOT introduce shared chrome — each child page owns its own
 * layout (the student profile has a complex print-aware header, etc.).
 * This layout is purely the CSS-variable carrier.
 */
export default async function ProfileLayout({ children }: ProfileLayoutProps) {
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
    // Fall through with default — child pages still render, just
    // without tenant brand colour.
  }

  const themeClass = `theme-${themeName}${
    themeVariant ? ` theme-variant-${themeVariant}` : ""
  }`;

  return <div className={themeClass}>{children}</div>;
}
