import React from "react";
import { getTenantSettingClientSafe } from "@repo/tenant/tenant-service";
// import { getContentSettings, getHeaderMenu } from "@repo/content"; // Temporarily commented out - will fix later
import { getLocalizedText } from "@repo/utils/common/localization";
import { HeaderContainerProps } from "./types";
import HeaderBanner from "./HeaderBanner";
import HeaderActions from "./components/Action/HeaderActions";
import HeaderNavigation from "../navigation";

/**
 * Main Header Container Component
 * Orchestrates header layout and data
 * Server component that fetches real tenant and content data
 */
export async function HeaderContainer({
  className,
  currentLanguage = "en",
  tenantId,
  showLogo = true,
  showNavigation = true,
  showSearch = true,
  showLanguageSelector = true,
  showUserMenu = true,
}: HeaderContainerProps) {
  try {
    // Fetch real data from your existing services
    const [tenantSettings] = await Promise.all([
      getTenantSettingClientSafe(tenantId),
      // getContentSettings(tenantId), // Temporarily commented out
    ]);
    
    // Placeholder content settings
    const contentSettings = {
      header: {
        enabled: true,
        showLogo: true,
        showNavigation: true,
        showUserMenu: true,
      }
    } as any;

    // Get header menu items - placeholder data
    const headerMenuItems = [] as any; // await getHeaderMenu(tenantId);

    // Convert MenuItemSettings to NavigationItem format
    const navigationItems = headerMenuItems.map((menuItem: any) => ({
      id: menuItem.id,
      title: menuItem.title,
      url: menuItem.url,
      icon: menuItem.icon,
      cssClass: menuItem.cssClass,
      openInNewTab: menuItem.openInNewTab,
      requiresAuth: menuItem.requiresAuth,
      allowedRoles: menuItem.allowedRoles,
      children: menuItem.children?.map((child: any) => ({
        id: child.id,
        title: child.title,
        url: child.url,
        icon: child.icon,
        cssClass: child.cssClass,
        openInNewTab: child.openInNewTab,
        requiresAuth: child.requiresAuth,
        allowedRoles: child.allowedRoles,
      })),
    }));

    // Extract header data from your settings with multilingual support
    const headerData = {
      // Tenant branding with multilingual support
      logoUrl: tenantSettings.brandInfo?.logoUrl,
      title: tenantSettings.displayName || { en: "CMS" },
      shortName: tenantSettings.displayShortName ||
        tenantSettings.displayName || { en: "CMS" },
      subtitle: tenantSettings.localizedDescription,

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
        <div className={`relative max-w-7xl mx-auto`}>
          {/* Desktop Layout: Top Row: Banner | Actions, Bottom Row: Navigation */}
          <div className="hidden lg:block px-4">
            {/* Top Row: Banner and Actions */}
            <div className="flex items-center justify-between min-h-16 py-4">
              {/* Left: Banner (Logo + Title) */}
              {headerSettings.showLogo && (
                <div className="flex items-center justify-start">
                  <HeaderBanner
                    logoUrl={headerData.logoUrl}
                    title={headerData.title as any}
                    subtitle={headerData.subtitle as any}
                    currentLanguage={currentLanguage}
                    showLogo={headerSettings.showLogo}
                  />
                </div>
              )}

              {/* Right: Actions */}
              <div className="flex items-center justify-start">
                <HeaderActions
                  showSearch={headerSettings.showSearch}
                  showLanguageSelector={headerSettings.showLanguageSelector}
                  showUserMenu={headerSettings.showUserMenu}
                  currentLanguage={currentLanguage}
                />
              </div>
            </div>

            {/* Bottom Row: Navigation */}
            {headerSettings.showNavigation && (
              <div className="py-2 my-2">
                <div className={`flex items-center justify-between mt-2`}>
                  <HeaderNavigation
                    items={headerData.navigationItems}
                    currentLanguage={currentLanguage}
                    isAuthenticated={false}
                    userRoles={[]}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mobile and Tablet Layout: Simple header bar */}
          <div className="lg:hidden flex items-center justify-between w-full px-4 py-3 touch-manipulation">
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
    console.error("Error loading header data:", error);

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
