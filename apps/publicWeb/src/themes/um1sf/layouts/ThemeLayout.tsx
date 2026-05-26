import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { resolveThemeVariant } from "@repo/types";
import { getContentSettings } from "@repo/content";
import { getCurrentTenantForClient } from "@repo/tenant/wrapper";
import { HeaderContainer } from "../common/header/HeaderContainer";
import { FooterContainer } from "../common/footer/FooterContainer";
import { MobileTopBar } from "../common/mobile/MobileTopBar";
import { MobileBottomNav } from "../common/mobile/MobileBottomNav";
import { MobileDrawerLinks } from "../common/mobile/MobileDrawerLinks";

interface ThemeLayoutProps {
  children: React.ReactNode;
  className?: string;
  tenantSetting?: Record<string, any> | null;
}

function pickLang(
  v: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!v) return "";
  return (lang === "mm" ? v.mm : v.en) || v.en || v.mm || "";
}

/**
 * um1sf ThemeLayout — Stanford-inspired chrome.
 *
 * Owns its own header + footer (NOT the shared site-shell).
 *
 * Mobile (< lg) collapses the variant-specific desktop header into
 * a unified two-bar surface:
 *   • `MobileTopBar`     — sticky top: title + hamburger drawer +
 *                          language selector + sign-in/profile icon.
 *   • `MobileBottomNav`  — fixed bottom tab bar (Home / News /
 *                          Announcements / Library) so the most
 *                          common destinations are always one tap
 *                          away.
 * The desktop `HeaderContainer` is wrapped in `hidden lg:block`,
 * and `main` gets bottom padding on mobile so the fixed bottom
 * nav doesn't cover content.
 *
 * Colour palette is variant-driven via Settings.themeVariant
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

  // Fetch settings + tenant in parallel — both are React-cached
  // so the variant-specific Header/Footer dispatchers downstream
  // get them for free.
  const [contentSettings, tenant] = await Promise.all([
    tenantId
      ? getContentSettings(tenantId).catch(() => null)
      : Promise.resolve(null),
    getCurrentTenantForClient().catch(() => null),
  ]);

  let themeVariant: string | undefined;
  try {
    themeVariant = resolveThemeVariant(
      "um1sf",
      (contentSettings as any)?.themeVariant,
    );
  } catch {
    themeVariant = resolveThemeVariant("um1sf", undefined);
  }
  const variantClass = themeVariant ? `theme-variant-${themeVariant}` : "";

  // Build brand text/logo for the mobile top bar. Mirrors the
  // sourcing logic in HeaderModern so admin overrides win, falling
  // back to tenant.brandInfo data.
  const headerCfg = (contentSettings as any)?.header ?? {};
  const useOrgInfoAsBanner = headerCfg.useOrgInfoAsBanner ?? false;
  const customTitle = pickLang(headerCfg.customBannerTitle, currentLanguage);
  const t: any = tenant ?? {};
  const tenantDisplayShort = pickLang(t.displayShortName, currentLanguage);
  const tenantDisplay = pickLang(t.displayName, currentLanguage);
  const brandTitle =
    !useOrgInfoAsBanner && customTitle
      ? customTitle
      : tenantDisplayShort ||
        tenantDisplay ||
        t.brandInfo?.title ||
        "";
  const logoUrl = t.brandInfo?.logoUrl || null;

  const showLogo = headerCfg.showLogo !== false;
  const showLanguageSelector = headerCfg.showLanguageSelector !== false;
  const showUserMenu = headerCfg.showUserMenu !== false;

  // Drawer menu — fetched server-side so it ships with the initial
  // HTML rather than fading in after hydration.
  const drawerContent = (
    <MobileDrawerLinks
      tenantId={tenantId}
      currentLanguage={currentLanguage}
      menuType={headerCfg.menuType || "header"}
    />
  );

  return (
    <div
      // `theme-um1sf` scopes the editorial palette + typography to
      // this subtree. Without it, default theme's @theme variables
      // win because Next.js bundles every theme's CSS into one
      // document stylesheet.
      className={`theme-um1sf ${variantClass} min-h-screen flex flex-col bg-background text-foreground antialiased ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Mobile-only top bar. The component itself is `lg:hidden`. */}
      <MobileTopBar
        brandTitle={brandTitle}
        logoUrl={logoUrl}
        currentLanguage={currentLanguage}
        showLogo={showLogo}
        showLanguageSelector={showLanguageSelector}
        showUserMenu={showUserMenu}
        drawer={drawerContent}
      />

      {/* Desktop header — hidden on mobile so it doesn't double up
          with the MobileTopBar. The variant dispatcher (Default /
          Modern / Minimal) lives inside. */}
      <div className="hidden lg:block">
        <HeaderContainer currentLanguage={currentLanguage} />
      </div>

      {/* Main content. `pb-20 lg:pb-0` reserves room for the fixed
          MobileBottomNav so the last paragraph isn't hidden under
          it; on lg+ the nav is gone so no padding needed. */}
      <main className="flex-1 flex flex-col pb-20 lg:pb-0">{children}</main>

      {/* Desktop footer hidden on mobile — the MobileBottomNav
          covers the most-used destinations and the multi-column
          editorial footer is too dense for narrow screens. */}
      <div className="hidden lg:block">
        <FooterContainer currentLanguage={currentLanguage} />
      </div>

      <MobileBottomNav currentLanguage={currentLanguage} />
    </div>
  );
}

export default ThemeLayout;
