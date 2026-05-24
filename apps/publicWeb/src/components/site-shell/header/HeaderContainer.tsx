import React from "react";
import { redirect } from "next/navigation";
import { getTenantSettingClientSafe } from "@repo/tenant/tenant-service";
import { getContentSettings, getHeaderMenu } from "@repo/content";
import { getLocalizedText } from "@repo/utils/common/localization";
import { HeaderContainerProps } from "./types";
import HeaderBanner from "./HeaderBanner";
import HeaderActions from "./components/Action/HeaderActions";
import HeaderNavigation from "../navigation";
import { LangSelectorWrapper } from "@/feature-components/lang-selector";
import { LangSelectorUI } from "../navigation/header/LangSelectorUI";

/**
 * Main Header Container Component
 * Orchestrates header layout and data
 * Server component that fetches real tenant and content data
 */
export async function HeaderContainer({
  className,
  currentLanguage = "en",
  tenantId,
  isAuthenticated = false,
  userRoles = [],
  showLogo = true,
  showNavigation = true,
  showSearch = true,
  showLanguageSelector = true,
  showUserMenu = true,
  navigationItems: navigationItemsOverride,
}: HeaderContainerProps) {
  try {
    // Fetch real data from your existing services
    const [tenantSettings, contentSettings] = await Promise.all([
      getTenantSettingClientSafe(tenantId),
      getContentSettings(tenantId),
    ]);

    // Resolve nav items. When the caller passes `navigationItemsOverride`
    // (e.g. /library uses its own 3-item menu), use those directly and
    // skip the CMS menu fetch entirely. Otherwise fall back to the
    // tenant's CMS-managed header menu.
    let navigationItems;
    if (navigationItemsOverride && navigationItemsOverride.length > 0) {
      navigationItems = navigationItemsOverride;
    } else {
      const headerMenuItems = await getHeaderMenu(tenantId);
      const mapMenuItem = (menuItem: any): any => ({
        id: menuItem.id,
        title: menuItem.title,
        url: menuItem.url,
        icon: menuItem.icon,
        cssClass: menuItem.cssClass,
        openInNewTab: menuItem.openInNewTab,
        requiresAuth: menuItem.requiresAuth,
        allowedRoles: menuItem.allowedRoles,
        children: menuItem.children?.map(mapMenuItem),
      });
      navigationItems = headerMenuItems.map(mapMenuItem);
    }

    // Extract header data from your settings with multilingual support
    const headerData = {
      // Tenant branding with multilingual support
      logoUrl: tenantSettings.brandInfo?.logoUrl,
      title: tenantSettings.displayName || { en: "CMS" },
      shortName: tenantSettings.displayShortName ||
        tenantSettings.displayName || { en: "CMS" },
      subtitle: tenantSettings.subTitle,

      // Navigation items from header menu
      navigationItems,

      // Header settings from content settings
      headerSettings: {
        enabled: contentSettings.header?.enabled !== false,
        showSearch: contentSettings.header?.showSearch !== false && showSearch,
        showLanguageSelector: showLanguageSelector,
        showUserMenu:
          contentSettings.header?.showUserMenu !== false && showUserMenu,
        showLogo: contentSettings.header?.showLogo !== false && showLogo,
        showNavigation:
          contentSettings.header?.showNavigation !== false && showNavigation,
      },
    };

    // If header is disabled, return minimal header
    if (!headerData.headerSettings.enabled) {
      return (
        <header
          className={`sticky top-0 z-40 bg-background border-b border-border ${
            className || ""
          }`}
        >
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex items-center justify-center h-16`}>
              <h1>{getLocalizedText(headerData.title, currentLanguage)}</h1>
            </div>
          </div>
        </header>
      );
    }

    const { headerSettings } = headerData;

    return (
      <header
        className={`sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm ${className}`}
      >
        {/* Desktop Layout: Two Row Design */}
        <div className="hidden lg:block">
          {/* First Row: Banner with Logo, Title, and Actions */}
          <div className="w-full medical-pattern-bg">
            <div className="relative max-w-7xl mx-auto px-4">
              {headerSettings.showLogo && (
                <div className="flex items-center justify-between py-6">
                  {/* Left: Logo + Title + Subtitle */}
                  <HeaderBanner
                    logoUrl={headerData.logoUrl}
                    title={headerData.title as any}
                    subtitle={headerData.subtitle as any}
                    currentLanguage={currentLanguage}
                    showLogo={headerSettings.showLogo}
                  />

                  {/* Right: Actions in vertical layout */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Top Right: Sign In/Sign Up - Absolute positioned at top */}
                    <div className="absolute top-0 right-4 flex items-center gap-2">
                      <HeaderActions
                        showSearch={false}
                        showLanguageSelector={false}
                        showUserMenu={headerSettings.showUserMenu}
                        currentLanguage={currentLanguage}
                      />
                    </div>

                    {/* Bottom Right: Search Box + Language Selector - With top padding */}
                    <div className="flex items-center gap-2 mt-8">
                      {headerSettings.showSearch && (
                        <HeaderActions
                          showSearch={true}
                          showLanguageSelector={false}
                          showUserMenu={false}
                          currentLanguage={currentLanguage}
                        />
                      )}
                      {headerSettings.showLanguageSelector && (
                        <LangSelectorWrapper
                          initialLanguage={currentLanguage}
                          languages={[
                            {
                              code: "en",
                              name: "English",
                              nativeName: "English",
                              flag: "🇺🇸",
                            },
                            {
                              code: "mm",
                              name: "Myanmar",
                              nativeName: "မြန်မာ",
                              flag: "🇲🇲",
                            },
                          ]}
                        >
                          <LangSelectorUI
                            variant="dropdown"
                            showFlag={true}
                            showNativeName={true}
                            showName={false}
                            className="relative"
                            triggerClassName="text-white hover:text-blue-100 transition-colors"
                            contentClassName="!bg-[#1e4f99] border-white/30 backdrop-blur-sm"
                          />
                        </LangSelectorWrapper>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Second Row: Navigation Menu */}
          {headerSettings.showNavigation && (
            <div className="w-full bg-[var(--color-nav-bg)] overflow-visible">
              <div className="max-w-7xl mx-auto px-4 overflow-visible">
                <div className="flex items-center justify-start py-2 overflow-visible">
                  <HeaderNavigation
                    items={headerData.navigationItems}
                    currentLanguage={currentLanguage}
                    isAuthenticated={isAuthenticated}
                    userRoles={userRoles}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile and Tablet Layout: Simple header bar - Full Width Background */}
        <div className="lg:hidden w-full bg-[var(--color-mobile-header-bg)]">
          <div className="flex items-center justify-between px-4 py-3 touch-manipulation">
            <HeaderActions
              isMobileView={true}
              showSearch={headerSettings.showSearch}
              showLanguageSelector={headerSettings.showLanguageSelector}
              showUserMenu={headerSettings.showUserMenu}
              title={getLocalizedText(headerData.shortName, currentLanguage)}
              navigationItems={headerData.navigationItems}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>
      </header>
    );
  } catch (error) {
    // `redirect()` throws a NEXT_REDIRECT signal — propagate it.
    if (
      error &&
      typeof error === "object" &&
      (error as any).digest?.startsWith?.("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Failed to load header:", error);

    // Critical fetches failed (tenant settings / content settings
    // / header menu). Instead of rendering a broken half-header
    // fragment ("Unable to load header configuration"), redirect
    // the whole page to the friendly service-unavailable UI —
    // matches the UX the user gets when middleware-level lookups
    // fail. `redirect()` aborts the current render and short-
    // circuits any sibling server components in the same route.
    const message = error instanceof Error ? error.message : "Unknown error";
    const params = new URLSearchParams();
    params.set("code", "HEADER_FETCH_FAILED");
    params.set("message", message);
    redirect(`/error/service-unavailable?${params.toString()}`);
  }
}

export default HeaderContainer;
