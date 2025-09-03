"use client";

import { SidebarTrigger, useSidebar } from "@repo/ui";
import { Separator } from "@repo/ui";
import { LanguageSelector } from "@repo/base-dashboard";
import { useLanguage } from "@repo/language";
import { getLocalizedText } from "@repo/utils";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AppBreadcrumb } from "@/components/common/AppBreadcrumb";
import type { TenantSettings } from "@repo/types";
import type { AppSchemaData } from "@/types/layout";
import { Z_INDEX } from "@repo/utils";

import React from "react";

interface HeaderProps {
  tenant?: TenantSettings | null;
  appSchemaData?: AppSchemaData | null;
}

export default function Header({ tenant, appSchemaData }: HeaderProps = {}) {
  const { currentLanguage, setLanguage, isLoading } = useLanguage();

  // Generate module display names dynamically from appSchemaData
  const moduleDisplayNames = React.useMemo(() => {
    const names: Record<string, string> = {};

    if (appSchemaData?.modules) {
      appSchemaData.modules.forEach((module) => {
        names[module.slug] = getLocalizedText(module.name, currentLanguage);
      });
    }

    // Add fallback for dashboard if not in schema
    names.dashboard = getLocalizedText(
      { en: "Dashboard", mm: "ဒက်ရှ်ဘုတ်" },
      currentLanguage
    );

    return names;
  }, [appSchemaData, currentLanguage]);

  return (
    <header className={`flex h-16 shrink-0 items-center gap-2 justify-between border-b border-border md:relative md:top-auto md:rounded-t-lg sticky top-0 ${Z_INDEX.HEADER} bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AppBreadcrumb
          moduleDisplayNames={moduleDisplayNames}
          className="hidden md:flex"
        />
      </div>

      <div className="flex items-center gap-2 px-4">
        <ThemeToggle />
        <Separator orientation="vertical" className="h-4" />
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={setLanguage}
          isLoading={isLoading}
          variant="icon"
        />
      </div>
    </header>
  );
}
