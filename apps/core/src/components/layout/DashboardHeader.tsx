"use client";

import React from "react";
import { SidebarTrigger, useSidebar } from "@repo/ui";
import { Separator } from "@repo/ui";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Badge } from "@repo/ui";
import { LanguageSelector } from "@repo/base-dashboard";
import { useLanguage } from "@repo/language";
import { getLocalizedText } from "@repo/utils";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AppBreadcrumb } from "@/components/common/AppBreadcrumb";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/ui";
import type { TenantSettings } from "@repo/types";
import type { AppSchemaData } from "@/types/layout";

interface DashboardHeaderProps {
  tenant?: TenantSettings | null;
  appSchemaData?: AppSchemaData | null;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
}

/**
 * Enhanced dashboard header following dashboard-01 design patterns
 * Combines existing functionality with modern dashboard styling
 */
export function DashboardHeader({
  tenant,
  appSchemaData,
  title,
  description,
  actions,
  showBreadcrumbs = true,
  className,
}: DashboardHeaderProps) {
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
    <header className={cn(
      "flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4",
      className
    )}>
      {/* Left section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* Breadcrumbs or Title */}
        <div className="flex flex-col">
          {showBreadcrumbs ? (
            <AppBreadcrumb
              moduleDisplayNames={moduleDisplayNames}
              className="hidden md:flex"
            />
          ) : (
            <>
              {title && (
                <h1 className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Custom actions */}
        {actions}

        {/* Search (placeholder for future enhancement) */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <IconComponent
              name="Search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
              placeholder="Search..."
              className="pl-10 w-[300px]"
            />
          </div>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Theme and Language */}
        <ThemeToggle />
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

/**
 * Dashboard page header component for content pages
 */
export function DashboardPageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between space-y-2", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          )}
          {badge && (
            <Badge variant={badge.variant || "default"}>
              {badge.text}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default DashboardHeader;