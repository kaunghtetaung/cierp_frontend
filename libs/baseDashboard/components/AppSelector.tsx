"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { TenantSettings, TenantApplication } from "@repo/types";
import { getLocalizedText } from "@repo/utils";
import { extractBaseDomain } from "@repo/utils/common/url";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { IconComponent } from "@repo/ui/components/icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSelectorProps {
  tenant: TenantSettings | null;
  currentLanguage: string;
}

export function AppSelector({ tenant, currentLanguage }: AppSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  console.log(
    "Tenant applications loaded in AppSelector",
    tenant?.applications
  );

  // Get applications directly from tenant settings
  const getApps = (): TenantApplication[] => {
    if (!tenant?.applications || tenant.applications.length === 0) {
      return [];
    }

    // Filter only active applications
    return tenant.applications.filter((app) => app.status);
  };

  const apps = getApps();

  // Debug: Log apps array to see structure
  console.log("Apps array structure:", apps);

  // Get current app from hostname subdomain
  const getCurrentApp = (): TenantApplication | null => {
    if (apps.length === 0) return null;

    if (typeof window !== "undefined") {
      const currentHostname = window.location.hostname;
      const baseDomain = extractBaseDomain(currentHostname);

      // Extract subdomain (e.g., "core" from "core.crystal-image.net")
      const subdomain = currentHostname.replace(`.${baseDomain}`, "");

      // Find app that matches the current subdomain using slug (with fallback)
      const currentApp = apps.find((app) => {
        const appIdentifier =
          app.slug || getLocalizedText(app.displayShortName, currentLanguage);
        return appIdentifier === subdomain;
      });

      // If found, return it; otherwise return first app as fallback
      return currentApp || apps[0];
    }

    // Server-side fallback - return first app
    return apps[0];
  };

  const currentApp = getCurrentApp();

  // Get icon component by name using our custom IconComponent
  const getIcon = (iconName: string, className?: string) => {
    return (
      <IconComponent
        name={iconName}
        className={className}
        fallback="LayoutDashboard"
      />
    );
  };

  const handleAppSelect = (app: TenantApplication) => {
    // Debug: Log the app object to see what's available
    console.log("Selected app object:", app);

    // Use slug if available, fallback to displayShortName.en for backwards compatibility
    const appSlug =
      app.slug || getLocalizedText(app.displayShortName, currentLanguage);

    if (!appSlug) {
      console.error("App slug and displayShortName are not available", app);
      return;
    }

    if (typeof window !== "undefined") {
      const currentHostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      const search = window.location.search;
      const hash = window.location.hash;

      // Extract base domain (e.g., crystal-image.net from core.crystal-image.net)
      const baseDomain = extractBaseDomain(currentHostname);

      // Check if we're already on this app's subdomain
      const currentSubdomain = currentHostname.replace(`.${baseDomain}`, "");
      if (currentSubdomain === appSlug) {
        console.log(`Already on ${appSlug} app`);
        return;
      }

      // Build new subdomain URL with app slug
      const portSuffix = port ? `:${port}` : "";
      const newUrl = `${protocol}//${appSlug}.${baseDomain}${portSuffix}${pathname}${search}${hash}`;

      console.log(
        `Switching from ${currentSubdomain} to ${appSlug} app: ${newUrl}`
      );

      // Navigate to new subdomain
      window.location.href = newUrl;
    }
  };

  if (!tenant || !currentApp) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
              <div className="size-4 bg-muted-foreground/20 rounded"></div>
            </div>
            <div className="grid flex-1 gap-1">
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-2 bg-muted/70 rounded w-1/2"></div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {getIcon(currentApp.iconName, "size-4")}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {getLocalizedText(currentApp.displayName, currentLanguage)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-card border-border"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {getLocalizedText(tenant.displayName, currentLanguage)} -
              Applications
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {apps.map((app, index) => (
              <DropdownMenuItem
                key={
                  app.slug ||
                  getLocalizedText(app.displayShortName, currentLanguage) ||
                  index
                }
                onClick={() => handleAppSelect(app)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  {getIcon(app.iconName, "size-3")}
                </div>
                <div className="flex-1 grid text-left">
                  <span className="font-medium text-sm">
                    {getLocalizedText(app.displayName, currentLanguage)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getLocalizedText(
                      app.localizedDescription,
                      currentLanguage
                    )}
                  </span>
                </div>
                {(currentApp.slug ||
                  getLocalizedText(
                    currentApp.displayShortName,
                    currentLanguage
                  )) ===
                  (app.slug ||
                    getLocalizedText(
                      app.displayShortName,
                      currentLanguage
                    )) && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 text-muted-foreground">
              <Plus className="size-4" />
              <span>Request new app</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}