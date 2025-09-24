"use client";

import * as React from "react";
import type { TenantSettings, ModuleSchema } from "@repo/types";
import { IconComponent } from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import { useLanguage } from "@repo/language";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { UserActionMenu, AppSelector } from "@repo/base-dashboard";
import { useAuth } from "@repo/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@repo/ui";

// Multilingual secondary navigation items
const getSecondaryNavItems = (language: string, appPrefix: string = '/core') => [
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
    title: getLocalizedText({ en: "Session Monitor", mm: "အကောင့်ဝင်ခွင့် စောင့်ကြည့်မှု" }, language),
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

// Function to convert AppSchema modules to navigation items with language support
function modulesToNavItems(modules: ModuleSchema[], language: string, currentAppId?: string): any[] {
  // Get current app from URL path for proper navigation
  const getAppPrefix = (): string => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const pathSegments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      const appFromPath = pathSegments.length > 0 ? pathSegments[0] : '';
      
      // Verify it's a valid app (matches known app configs)
      if (appFromPath && (appFromPath === 'core' || appFromPath === 'library' || appFromPath === 'school' || appFromPath === 'content')) {
        return `/${appFromPath}`;
      }
    }
    
    // Fallback to provided currentAppId or default to core
    return currentAppId ? `/${currentAppId}` : '/core';
  };

  const appPrefix = getAppPrefix();

  return modules.map((module) => ({
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
    items:
      module.subModules?.map((subModule) => ({
        title: getLocalizedText(subModule.name, language) || subModule.slug,
        url: `${appPrefix}/${module.slug}/${subModule.slug}`,
      })) || [],
  }));
}

interface AppSchemaData {
  modules: ModuleSchema[];
  supportedLanguages: any[];
  serviceName: string;
  timestamp: string;
  appId: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenant: TenantSettings | null;
  appSchemaData?: AppSchemaData | null;
}

export function AppSidebar({
  tenant,
  appSchemaData,
  ...props
}: AppSidebarProps) {
  const { currentLanguage } = useLanguage();
  const { user, logout, isLoading } = useAuth();

  // Use AppSchema modules to generate dynamic navigation with language support
  const navItems = React.useMemo(() => {
    if (appSchemaData?.modules && appSchemaData.modules.length > 0) {
      return modulesToNavItems(appSchemaData.modules, currentLanguage, appSchemaData.appId);
    }
    return [];
  }, [appSchemaData, currentLanguage]);

  // Generate localized secondary navigation
  const localizedSecondaryNav = React.useMemo(() => {
    // Get current app prefix for secondary navigation
    const getAppPrefix = (): string => {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const pathSegments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
        const appFromPath = pathSegments.length > 0 ? pathSegments[0] : '';
        
        if (appFromPath && (appFromPath === 'core' || appFromPath === 'library' || appFromPath === 'school' || appFromPath === 'content')) {
          return `/${appFromPath}`;
        }
      }
      
      return appSchemaData?.appId ? `/${appSchemaData.appId}` : '/core';
    };

    return getSecondaryNavItems(currentLanguage, getAppPrefix());
  }, [currentLanguage, appSchemaData?.appId]);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSelector tenant={tenant} currentLanguage={currentLanguage} user={user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={localizedSecondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <UserActionMenu
          user={user}
          currentLanguage={currentLanguage}
          isLoading={isLoading}
          onLogout={logout}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
