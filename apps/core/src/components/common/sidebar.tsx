"use client";

import * as React from "react";
import type { TenantSettings, TenantApplication } from "@repo/types";
import type { ClientAppSchemaData, ClientModule } from "@/types/layout";
import { IconComponent } from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import { useLanguage } from "@repo/language";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { UserActionMenu, ClientAppSelector } from "@repo/base-dashboard";
import { useAuth } from "@repo/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@repo/ui";

// Multilingual secondary navigation items
const getSecondaryNavItems = (
  language: string,
  appPrefix: string = "/core"
) => [
  {
    title: getLocalizedText({ en: "Support", mm: "အကူအညီ" }, language),
    url: `${appPrefix}/support`,
    icon: ({ className, ...props }: any) => (
      <IconComponent name="LifeBuoy" className={className} {...props} />
    ),
  },
  {
    title: getLocalizedText(
      { en: "FAQ", mm: "မေးလေ့ရှိသောမေးခွန်းများ" },
      language
    ),
    url: `${appPrefix}/faq`,
    icon: ({ className, ...props }: any) => (
      <IconComponent name="HelpCircle" className={className} {...props} />
    ),
  },
  {
    title: getLocalizedText(
      { en: "Session Monitor", mm: "အကောင့်ဝင်ခွင့် စောင့်ကြည့်မှု" },
      language
    ),
    url: `${appPrefix}/session-monitor`,
    icon: ({ className, ...props }: any) => (
      <IconComponent name="Monitor" className={className} {...props} />
    ),
  },
  {
    title: getLocalizedText({ en: "Profile", mm: "ပရိုဖိုင်" }, language),
    url: `${appPrefix}/profile`,
    icon: ({ className, ...props }: any) => (
      <IconComponent name="User" className={className} {...props} />
    ),
  },
];

// Function to convert clean client modules to navigation items with language support
function modulesToNavItems(
  modules: ClientModule[],
  language: string,
  currentAppId?: string
): any[] {
  // Use reliable server data (currentAppId) as primary source for app prefix
  // This prevents stale window.location.pathname during server component re-renders
  const getAppPrefix = (): string => {
    // Primary: Use currentAppId from server data (most reliable)
    if (currentAppId) {
      return `/${currentAppId}`;
    }

    // Fallback: Client-side detection (only when currentAppId is not available)
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const pathSegments = pathname
        .replace(/^\/+|\/+$/g, "")
        .split("/")
        .filter(Boolean);
      const appFromPath = pathSegments.length > 0 ? pathSegments[0] : "";

      // Verify it's a valid app (matches known app configs)
      if (
        appFromPath &&
        (appFromPath === "core" ||
          appFromPath === "library" ||
          appFromPath === "school" ||
          appFromPath === "content")
      ) {
        return `/${appFromPath}`;
      }
    }

    // Final fallback
    return "/core";
  };

  const appPrefix = getAppPrefix();

  return modules.map((module) => {
    // Use static routes from server-provided module data
    const staticRoutes = module.staticRoutes || [];

    // Build sub-items array
    const subItems = staticRoutes.length > 0
      ? [
          // Add main list view as first item
          {
            title: getLocalizedText({ en: "List", mm: "စာရင်း" }, language),
            url: `${appPrefix}/${module.slug}`,
          },
          // Add custom static routes
          ...staticRoutes.map(route => ({
            title: route.title,
            url: `${appPrefix}/${module.slug}/${route.path}`,
          }))
        ]
      : []; // No sub-items if no static routes

    return {
      title: getLocalizedText(module.name, language) || module.slug,
      url: `${appPrefix}/${module.slug}`,
      icon: ({ className, ...props }: any) => (
        <IconComponent
          name={module.iconName || "SquareTerminal"}
          fallback="SquareTerminal"
          className={className}
          {...props}
        />
      ),
      items: subItems,
      isActive: staticRoutes.length > 0, // Make collapsible if has sub-items
    };
  });
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenant: TenantSettings | null;
  appSchemaData?: ClientAppSchemaData | null;
  filteredApps?: TenantApplication[];
  authData?: any; // Keep for potential future use, but not used in client-side filtering
}

export function AppSidebar({
  tenant,
  appSchemaData,
  filteredApps = [],
  authData,
  ...props
}: AppSidebarProps) {
  const { currentLanguage } = useLanguage();
  const { user, logout, isLoading } = useAuth();

  // Use pre-filtered modules from server (SECURE: no client-side access control)
  const navItems = React.useMemo(() => {
    if (appSchemaData?.modules && appSchemaData.modules.length > 0) {
      console.log(`[SIDEBAR] Rendering ${appSchemaData.modules.length} server-filtered modules for app: ${appSchemaData.appId}`);
      console.log(`[SIDEBAR] Modules:`, appSchemaData.modules.map(m => ({ slug: m.slug, name: m.name })));

      return modulesToNavItems(
        appSchemaData.modules,
        currentLanguage,
        appSchemaData.appId
      );
    }
    console.log(`[SIDEBAR] No modules available - appSchemaData:`, !!appSchemaData, "modules:", appSchemaData?.modules?.length || 0);
    return [];
  }, [appSchemaData, currentLanguage]);

  // Generate localized secondary navigation
  const localizedSecondaryNav = React.useMemo(() => {
    // Use reliable server data (appSchemaData.appId) as primary source for app prefix
    // This prevents stale window.location.pathname during server component re-renders
    const getAppPrefix = (): string => {
      // Primary: Use appSchemaData.appId from server data (most reliable)
      if (appSchemaData?.appId) {
        return `/${appSchemaData.appId}`;
      }

      // Fallback: Client-side detection (only when appSchemaData.appId is not available)
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const pathSegments = pathname
          .replace(/^\/+|\/+$/g, "")
          .split("/")
          .filter(Boolean);
        const appFromPath = pathSegments.length > 0 ? pathSegments[0] : "";

        if (
          appFromPath &&
          (appFromPath === "core" ||
            appFromPath === "library" ||
            appFromPath === "school" ||
            appFromPath === "content")
        ) {
          return `/${appFromPath}`;
        }
      }

      // Final fallback
      return "/core";
    };

    return getSecondaryNavItems(currentLanguage, getAppPrefix()) as any;
  }, [currentLanguage, appSchemaData?.appId]);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <ClientAppSelector
          tenant={tenant}
          filteredApps={filteredApps}
          currentLanguage={currentLanguage}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={localizedSecondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <UserActionMenu
          user={user as any}
          currentLanguage={currentLanguage}
          isLoading={isLoading}
          onLogout={logout}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
