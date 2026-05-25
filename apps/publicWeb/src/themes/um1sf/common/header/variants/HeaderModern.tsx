import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { getCurrentTenantForClient } from "@repo/tenant/wrapper";
import { createHttpClient } from "@repo/api/client";
import { IconComponent } from "@repo/ui/components/icons";
import HeaderUserActions from "../HeaderUserActions";
import HeaderLangSelector from "../HeaderLangSelector";
import HeaderSearch from "../HeaderSearch";
import MobileMenu from "../MobileMenu";

interface HeaderModernProps {
  currentLanguage?: "en" | "mm";
}

interface MenuTreeNode {
  _id: string;
  title?: { en?: string; mm?: string };
  url?: string;
  slug?: string;
  icon?: string;
  openInNewTab?: boolean;
  displayType?: "dropdown" | "mega";
  children?: MenuTreeNode[];
}

function pickLang(
  v: { en?: string; mm?: string } | undefined | null,
  lang: "en" | "mm",
): string {
  if (!v) return "";
  return (lang === "mm" ? v.mm : v.en) || v.en || v.mm || "";
}

/**
 * um1sf — Modern Header variant.
 *
 * Two-tier layout:
 *   Row 1 — utility bar: language selector + auth controls (sign in
 *           when anonymous, user menu when authed). Subtle.
 *   Row 2 — brand row: logo + (title / subtitle stacked) on the
 *           left, primary nav inline on the right, search action
 *           at the far right. Sticky on scroll with backdrop blur.
 *
 * Data sources:
 *   - Logo URL:   `settings.organization.logoUrl`
 *   - Title:      `settings.header.customBannerTitle` (override) →
 *                 `organization.displayShortName` → `fullName`
 *   - Subtitle:   `settings.header.customBannerSubtitle` (override) →
 *                 `organization.subTitle`
 *   - Primary menu: Navigation docs with menuType matching
 *                 `settings.header.menuType` (default 'header')
 *
 * Visibility flags from `settings.header.{showLogo,showNavigation,
 * showSearch,showLanguageSelector,showUserMenu}`.
 */
export async function HeaderModern({
  currentLanguage = "en",
}: HeaderModernProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  // Fetch settings + tenant in parallel. `ContentSettingsData` only
  // holds settings.* and `organizationId` — the actual brand data
  // (logo URL, displayName, subTitle) lives on the TenantSettings
  // record. Both calls are React-cached so duplicate fetches in
  // the same render are free.
  const [settings, tenant] = await Promise.all([
    tenantId
      ? getContentSettings(tenantId).catch(() => null)
      : Promise.resolve(null),
    getCurrentTenantForClient().catch(() => null),
  ]);
  const primaryMenuType =
    (settings as any)?.header?.menuType || "header";
  const primaryMenu = await fetchMenuTree(primaryMenuType, tenantId).catch(
    () => [] as MenuTreeNode[],
  );

  // Resolve brand text. Priority:
  //   1. Settings.header.customBannerTitle (admin override) —
  //      unless `useOrgInfoAsBanner` flips back to org defaults.
  //   2. tenant.displayShortName (multi-lang) / displayName
  //   3. tenant.brandInfo.title (plain string)
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
  const showNavigation = headerCfg.showNavigation !== false;
  const showSearch = headerCfg.showSearch !== false;
  const showLanguageSelector = headerCfg.showLanguageSelector !== false;
  const showUserMenu = headerCfg.showUserMenu !== false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* ── Row 1: utility strip ──────────────────────────────────
          Compact bar with language + auth controls. Uses the same
          gateway palette as the Default variant so the shared
          `HeaderLangSelector` (which styles itself via
          `--color-gateway-text`) renders with the correct contrast.
          Hidden when neither control is enabled. */}
      {(showLanguageSelector || showUserMenu) && (
        <div
          className="border-b border-border/60"
          style={{
            backgroundColor: "var(--color-gateway-bg)",
            color: "var(--color-gateway-text)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end gap-2 h-10">
              {showLanguageSelector && <HeaderLangSelector />}
              {showUserMenu && (
                <HeaderUserActions language={currentLanguage} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Row 2: brand + nav ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-20 lg:h-24">
          {/* Brand block — logo + title + optional subtitle. */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 group flex-shrink-0"
          >
            {showLogo && logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandTitle || "Logo"}
                className="h-12 w-12 lg:h-14 lg:w-14 object-contain flex-shrink-0"
              />
            )}
            {(brandTitle || brandSubtitle) && (
              <div className="min-w-0 flex flex-col justify-center">
                {brandTitle && (
                  <span className="text-lg lg:text-xl font-bold tracking-tight text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                    {brandTitle}
                  </span>
                )}
                {brandSubtitle && (
                  <span className="text-xs lg:text-sm text-muted-foreground leading-tight truncate mt-0.5">
                    {brandSubtitle}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* Primary menu — desktop, pushed to the right of the brand. */}
          {showNavigation && primaryMenu.length > 0 && (
            <nav
              className="hidden lg:flex items-center gap-1 ml-auto"
              role="navigation"
              aria-label="Primary"
            >
              {primaryMenu.map((node: MenuTreeNode) => (
                <PrimaryMenuItem
                  key={node._id}
                  node={node}
                  currentLanguage={currentLanguage}
                />
              ))}
            </nav>
          )}

          {/* Right edge actions: search + mobile-only menu trigger. */}
          <div className="ml-auto lg:ml-0 flex items-center gap-2 flex-shrink-0">
            {showSearch && <HeaderSearch currentLanguage={currentLanguage} />}
            {showNavigation && primaryMenu.length > 0 && (
              <div className="lg:hidden">
                <MobileMenu
                  primaryMenu={primaryMenu}
                  audienceMenu={[]}
                  currentLanguage={currentLanguage}
                  showSearch={showSearch}
                  showNavigation={showNavigation}
                  showLanguageSelector={showLanguageSelector}
                  showUserMenu={showUserMenu}
                  brandTitle={brandTitle}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function PrimaryMenuItem({
  node,
  currentLanguage,
}: {
  node: MenuTreeNode;
  currentLanguage: "en" | "mm";
}) {
  const label = pickLang(node.title, currentLanguage) || node.slug || "";
  const hasChildren = (node.children?.length ?? 0) > 0;

  if (!hasChildren) {
    return (
      <Link
        href={node.url || "#"}
        target={node.openInNewTab ? "_blank" : undefined}
        rel={node.openInNewTab ? "noopener noreferrer" : undefined}
        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
      >
        {node.icon && (
          <IconComponent
            name={node.icon}
            size={14}
            className="inline-block mr-1.5 -mt-0.5"
          />
        )}
        {label}
      </Link>
    );
  }

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
      >
        {label}
        <ChevronDown
          size={14}
          className="transition-transform group-hover:rotate-180"
        />
      </button>
      <div
        className="absolute right-0 top-full pt-1 min-w-[14rem] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
        role="menu"
      >
        <ul className="bg-background border border-border rounded-md shadow-lg py-1">
          {node.children!.map((child) => (
            <li key={child._id}>
              <Link
                href={child.url || "#"}
                target={child.openInNewTab ? "_blank" : undefined}
                rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                role="menuitem"
                className="block px-4 py-2 text-sm text-foreground hover:bg-muted/60 hover:text-primary transition-colors"
              >
                {pickLang(child.title, currentLanguage) || child.slug}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

async function fetchMenuTree(
  menuType: string,
  tenantId: string | null | undefined,
): Promise<MenuTreeNode[]> {
  if (!tenantId) return [];
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10000,
    });
    const response: any = await httpClient.request(
      `/content/navigations/menu/${encodeURIComponent(menuType)}/public?language=en`,
      {
        method: "GET",
        tenantId,
        withAuth: false,
      },
    );
    if (!response?.success) return [];
    let data: any = response.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = (data as { data: unknown }).data;
    }
    return Array.isArray(data) ? (data as MenuTreeNode[]) : [];
  } catch {
    return [];
  }
}

export default HeaderModern;
