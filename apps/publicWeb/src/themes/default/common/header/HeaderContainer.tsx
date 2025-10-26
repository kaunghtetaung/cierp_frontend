import React from "react";
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
}: HeaderContainerProps) {
  try {
    // Fetch real data from your existing services
    const [tenantSettings, contentSettings] = await Promise.all([
      getTenantSettingClientSafe(tenantId),
      getContentSettings(tenantId),
    ]);

    // Get header menu items
    const headerMenuItems = await getHeaderMenu(tenantId);

    // Recursive function to map menu items with all nested children
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

    // Convert MenuItemSettings to NavigationItem format with all nested levels
    const navigationItems = headerMenuItems.map(mapMenuItem);

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
        className={`sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm ${className}`}
      >
        {/* Desktop Layout: Three Row Design */}
        <div className="hidden lg:block">
          {/* First Row: Icon Bar (Actions) - Full Width Background */}
          <div
            className="w-full border-b border-border/50"
            style={{ backgroundColor: "#1A48A4" }}
          >
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between py-1">
                <HeaderActions
                  showSearch={headerSettings.showSearch}
                  showLanguageSelector={false}
                  showUserMenu={false}
                  currentLanguage={currentLanguage}
                />
                <div className="flex items-center gap-1">
                  <HeaderActions
                    showSearch={false}
                    showLanguageSelector={false}
                    showUserMenu={headerSettings.showUserMenu}
                    currentLanguage={currentLanguage}
                  />
                  {headerSettings.showLanguageSelector && (
                    <LangSelectorWrapper
                      initialLanguage={currentLanguage}
                      languages={[
                        {
                          code: "en",
                          name: "English",
                          nativeName: "English",
                          flag: "🇺🇸",
                          direction: "ltr" as const,
                        },
                        {
                          code: "mm",
                          name: "Myanmar",
                          nativeName: "မြန်မာ",
                          flag: "🇲🇲",
                          direction: "ltr" as const,
                        },
                      ]}
                    >
                      <LangSelectorUI
                        variant="dropdown"
                        showFlag={true}
                        showNativeName={false}
                        showName={false}
                        className="relative"
                        triggerClassName="flex items-center gap-1 px-2 py-1 text-sm font-medium transition-colors border-0 bg-transparent rounded-none text-white hover:text-white/90"
                        contentClassName="w-48"
                      />
                    </LangSelectorWrapper>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining rows with max-width container */}
          <div className="relative max-w-7xl mx-auto px-4">
            {/* Second Row: Brand Info (Logo + Title + Subtitle) */}
            {headerSettings.showLogo && (
              <div className="flex items-center justify-start py-6 border-b border-border/50">
                <HeaderBanner
                  logoUrl={headerData.logoUrl}
                  title={headerData.title as any}
                  subtitle={headerData.subtitle as any}
                  currentLanguage={currentLanguage}
                  showLogo={headerSettings.showLogo}
                />
              </div>
            )}

            {/* Third Row: Navigation Menu */}
            {headerSettings.showNavigation && (
              <div className="flex items-center justify-start py-2">
                <HeaderNavigation
                  items={headerData.navigationItems}
                  currentLanguage={currentLanguage}
                  isAuthenticated={isAuthenticated}
                  userRoles={userRoles}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile and Tablet Layout: Simple header bar - Full Width Background */}
        <div
          className="lg:hidden w-full"
          style={{ backgroundColor: "#1A48A4" }}
        >
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
    console.error("Failed to load header:", error);

    // Fallback header in case of error
    return (
      <header
        className={`sticky top-0 z-40 bg-background border-b border-border ${
          className || ""
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-center flex-1">
              <h1 className="text-lg font-semibold text-foreground">CMS</h1>
              <p className="text-sm text-muted-foreground">
                Unable to load header configuration
              </p>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

export default HeaderContainer;
