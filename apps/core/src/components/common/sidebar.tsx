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
const getSecondaryNavItems = (language: string) => [
  {
    title: getLocalizedText({ en: "Support", mm: "အကူအညီ" }, language),
    url: "/support",
    icon: ({ className, ...props }: any) => (
      <IconComponent name="LifeBuoy" className={className} {...props} />
    ),
  },
  {
    title: getLocalizedText(
      { en: "FAQ", mm: "မေးလေ့ရှိသောမေးခွန်းများ" },
      language
    ),
    url: "/faq",
    icon: ({ className, ...props }: any) => (
      <IconComponent name="HelpCircle" className={className} {...props} />
    ),
  },
  {
    title: getLocalizedText({ en: "Session Monitor", mm: "အကောင့်ဝင်ခွင့် စောင့်ကြည့်မှု" }, language),
    url: "/session-monitor",
    icon: ({ className, ...props }: any) => (
      <IconComponent name="Monitor" className={className} {...props} />
    ),
  },
  {
    title: getLocalizedText({ en: "Profile", mm: "ပရိုဖိုင်" }, language),
    url: "/profile",
    icon: ({ className, ...props }: any) => (
      <IconComponent name="User" className={className} {...props} />
    ),
  },
];

// Function to convert AppSchema modules to navigation items with language support
function modulesToNavItems(modules: ModuleSchema[], language: string): any[] {
  return modules.map((module) => ({
    title: getLocalizedText(module.name, language) || module.slug,
    url: `/${module.slug}`,
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
        url: `/${module.slug}/${subModule.slug}`,
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
      return modulesToNavItems(appSchemaData.modules, currentLanguage);
    }
    return [];
  }, [appSchemaData, currentLanguage]);

  // Generate localized secondary navigation
  const localizedSecondaryNav = React.useMemo(() => {
    return getSecondaryNavItems(currentLanguage);
  }, [currentLanguage]);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSelector tenant={tenant} currentLanguage={currentLanguage} />
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
