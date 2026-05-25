import React from "react";
import Link from "next/link";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { getCurrentTenantForClient } from "@repo/tenant/wrapper";
import HeaderLangSelector from "../HeaderLangSelector";
import HeaderUserActions from "../HeaderUserActions";

interface HeaderMinimalProps {
  currentLanguage?: "en" | "mm";
}

function pickLang(
  v: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!v) return "";
  return (lang === "mm" ? v.mm : v.en) || v.en || v.mm || "";
}

/**
 * um1sf — Minimal Header variant.
 *
 * Single tight row — for landing pages, single-page micro-sites,
 * or paths where the chrome should recede. Renders:
 *   - Brand: logo + multi-line (title / subtitle) on the left.
 *   - Right cluster: language selector + auth controls
 *     (sign in / sign up when anonymous, user menu when authed).
 *
 * Differs from Modern:
 *   - No navigation menu
 *   - No search
 *   - Single row (no utility bar)
 *   - Tighter spacing
 *
 * Brand sources mirror HeaderModern so admins editing
 * `customBannerTitle/Subtitle` see consistent results across
 * variants.
 */
export async function HeaderMinimal({
  currentLanguage = "en",
}: HeaderMinimalProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  // ContentSettings only carries `organizationId` — actual brand
  // data (logo, multi-lang display name, subtitle) lives on the
  // TenantSettings record. Fetch both in parallel; both are
  // React-cached so this is essentially free.
  const [settings, tenant] = await Promise.all([
    tenantId
      ? getContentSettings(tenantId).catch(() => null)
      : Promise.resolve(null),
    getCurrentTenantForClient().catch(() => null),
  ]);
  const headerCfg = (settings as any)?.header ?? {};
  const useOrgInfoAsBanner = headerCfg.useOrgInfoAsBanner ?? false;
  const customTitle = pickLang(headerCfg.customBannerTitle, currentLanguage);
  const customSubtitle = pickLang(
    headerCfg.customBannerSubtitle,
    currentLanguage,
  );
  const t: any = tenant ?? {};
  const tenantDisplayShort = pickLang(t.displayShortName, currentLanguage);
  const tenantDisplay = pickLang(t.displayName, currentLanguage);
  const tenantSubtitle = t.brandInfo?.subTitle || "";

  const brandTitle =
    !useOrgInfoAsBanner && customTitle
      ? customTitle
      : tenantDisplayShort ||
        tenantDisplay ||
        t.brandInfo?.title ||
        "";
  const brandSubtitle =
    !useOrgInfoAsBanner && customSubtitle ? customSubtitle : tenantSubtitle;

  const logoUrl = t.brandInfo?.logoUrl || null;

  const showLogo = headerCfg.showLogo !== false;
  const showLanguageSelector = headerCfg.showLanguageSelector !== false;
  const showUserMenu = headerCfg.showUserMenu !== false;

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 lg:h-20">
          {/* Brand block. */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 group flex-shrink-0"
          >
            {showLogo && logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandTitle || "Logo"}
                className="h-10 w-10 lg:h-12 lg:w-12 object-contain flex-shrink-0"
              />
            )}
            {(brandTitle || brandSubtitle) && (
              <div className="min-w-0 flex flex-col justify-center">
                {brandTitle && (
                  <span className="text-base lg:text-lg font-semibold tracking-tight text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                    {brandTitle}
                  </span>
                )}
                {brandSubtitle && (
                  <span className="hidden sm:block text-xs text-muted-foreground leading-tight truncate mt-0.5">
                    {brandSubtitle}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* Right cluster — language + auth.
              `HeaderLangSelector` styles itself via the
              `--color-gateway-text` CSS variable (designed for the
              Default variant's dark gateway row). On Minimal's
              light background that text would be invisible — so
              we shadow the variable with the standard foreground
              token for this subtree. */}
          <div
            className="flex items-center gap-2 flex-shrink-0"
            style={
              {
                ["--color-gateway-text" as any]: "var(--foreground)",
              } as React.CSSProperties
            }
          >
            {showLanguageSelector && <HeaderLangSelector />}
            {showUserMenu && <HeaderUserActions language={currentLanguage} />}
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderMinimal;
