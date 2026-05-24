import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { resolveThemeVariant } from "@repo/types";
import { getContentSettings } from "@repo/content";
import { HeaderContainer } from "../common/header/HeaderContainer";
import { FooterContainer } from "../common/footer/FooterContainer";

interface ThemeLayoutProps {
  children: React.ReactNode;
  className?: string;
  tenantSetting?: Record<string, any> | null;
}

/**
 * um1sf ThemeLayout — Stanford-inspired chrome.
 *
 * Owns its own header + footer (NOT the shared site-shell). Renders
 * a clean white canvas with a 2-row header on top and the dark slate
 * multi-column footer on the bottom — matching the Stanford editorial
 * reference. Colour palette is variant-driven via Settings.themeVariant
 * (cardinal / blue / teal); see `styles/index.css` for the variant
 * blocks scoped under `.theme-um1sf.theme-variant-X`.
 */
export async function ThemeLayout({
  children,
  className = "",
}: ThemeLayoutProps) {
  let currentLanguage: "en" | "mm" = "en";
  let tenantId: string | null = null;
  try {
    const middlewareData = await getMiddlewareDataFromHeaders();
    if (middlewareData?.language === "mm" || middlewareData?.language === "en") {
      currentLanguage = middlewareData.language;
    }
    tenantId = middlewareData?.tenantId ?? null;
  } catch {
    currentLanguage = "en";
  }

  let themeVariant: string | undefined;
  try {
    if (tenantId) {
      const contentSettings = await getContentSettings(tenantId);
      themeVariant = resolveThemeVariant(
        "um1sf",
        (contentSettings as any)?.themeVariant,
      );
    } else {
      themeVariant = resolveThemeVariant("um1sf", undefined);
    }
  } catch {
    themeVariant = resolveThemeVariant("um1sf", undefined);
  }
  const variantClass = themeVariant ? `theme-variant-${themeVariant}` : "";

  return (
    <div
      // `theme-um1sf` scopes the editorial palette + typography to
      // this subtree. Without it, default theme's @theme variables
      // (declared on :root) win because Next.js bundles every
      // theme's CSS into one document stylesheet. The
      // `theme-variant-X` class swaps the colour palette inside the
      // already-scoped um1sf subtree.
      className={`theme-um1sf ${variantClass} min-h-screen flex flex-col bg-background text-foreground antialiased ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <HeaderContainer currentLanguage={currentLanguage} />

      <main className="flex-1 flex flex-col">{children}</main>

      <FooterContainer currentLanguage={currentLanguage} />
    </div>
  );
}

export default ThemeLayout;
