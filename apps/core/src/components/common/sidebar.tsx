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
// Supports hierarchical navigation with parent modules
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

  // Step 1: Identify actual parent modules and child modules
  const parentModulesMap = new Map<string, ClientModule>(); // Actual parent modules (keyed by slug)
  const childModulesMap = new Map<string, ClientModule[]>(); // Children grouped by parent slug
  const standaloneModules: ClientModule[] = [];

  // First pass: Find all modules that are referenced as parents (by slug)
  const parentSlugs = new Set<string>();
  modules.forEach((module) => {
    if (module.parentModule) {
      // Handle both string slug and object formats
      const parentSlug = typeof module.parentModule === 'string'
        ? module.parentModule
        : module.parentModule.slug;
      if (parentSlug) {
        parentSlugs.add(parentSlug);
      }
    }
  });

  // Second pass: Categorize modules
  modules.forEach((module) => {
    if (module.parentModule) {
      // This module has a parent - it's a child
      const parentSlug = typeof module.parentModule === 'string'
        ? module.parentModule
        : module.parentModule.slug;

      if (parentSlug) {
        if (!childModulesMap.has(parentSlug)) {
          childModulesMap.set(parentSlug, []);
        }
        childModulesMap.get(parentSlug)!.push(module);
      }
    } else if (parentSlugs.has(module.slug)) {
      // This module is referenced as a parent by others
      parentModulesMap.set(module.slug, module);
    } else {
      // Standalone module (no parent, not a parent)
      standaloneModules.push(module);
    }
  });

  const navItems: any[] = [];

  // Process parent modules with their children
  parentModulesMap.forEach((parentModule, parentSlug) => {
    const children = childModulesMap.get(parentSlug) || [];

    // Build child items
    const childItems = children.map((childModule) => {
      const staticRoutes = childModule.staticRoutes || [];
      const hasStaticRoutes = staticRoutes.length > 0;

      return {
        title: getLocalizedText(childModule.name, language) || childModule.slug,
        url: `${appPrefix}/${childModule.slug}`,
        icon: ({ className, ...props }: any) => (
          <IconComponent
            name={childModule.iconName || "Circle"}
            fallback="Circle"
            className={className}
            {...props}
          />
        ),
        items: hasStaticRoutes
          ? [
              {
                title: getLocalizedText({ en: "List", mm: "စာရင်း" }, language),
                url: `${appPrefix}/${childModule.slug}`,
              },
              ...staticRoutes.map(route => ({
                title: route.title,
                url: `${appPrefix}/${childModule.slug}/${route.path}`,
              }))
            ]
          : [],
        isActive: hasStaticRoutes,
      };
    });

    // Add parent nav item with children
    navItems.push({
      title: getLocalizedText(parentModule.name, language) || parentModule.slug,
      url: '#', // Parent items are collapsible groups, no direct URL
      icon: ({ className, ...props }: any) => (
        <IconComponent
          name={parentModule.iconName || "Folder"}
          fallback="Folder"
          className={className}
          {...props}
        />
      ),
      items: childItems,
      isActive: true, // Always collapsible
    });
  });

  // Process standalone modules
  standaloneModules.forEach((module) => {
    const staticRoutes = module.staticRoutes || [];
    const hasStaticRoutes = staticRoutes.length > 0;

    navItems.push({
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
      items: hasStaticRoutes
        ? [
            {
              title: getLocalizedText({ en: "List", mm: "စာရین်း" }, language),
              url: `${appPrefix}/${module.slug}`,
            },
            ...staticRoutes.map(route => ({
              title: route.title,
              url: `${appPrefix}/${module.slug}/${route.path}`,
            }))
          ]
        : [],
      isActive: hasStaticRoutes,
    });
  });

  return navItems;
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
