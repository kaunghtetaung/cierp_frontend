"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface UseBreadcrumbOptions {
  appName?: string;
  moduleDisplayNames?: Record<string, string>;
  actionDisplayNames?: Record<string, string>;
}

export function useBreadcrumb(options: UseBreadcrumbOptions = {}) {
  const pathname = usePathname();
  const {
    appName = "Dashboard",
    moduleDisplayNames = {},
    actionDisplayNames = {
      list: "List",
      new: "New",
      edit: "Edit",
      view: "View",
      settings: "Settings",
    },
  } = options;

  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = [];
    
    // Remove leading slash and split path
    const pathSegments = pathname.replace(/^\//, "").split("/").filter(Boolean);
    
    
    
    // Always add dashboard as root
    items.push({
      label: appName,
      href: "/",
      isActive: pathSegments.length === 0,
    });

    // If we're on root path, just return dashboard
    if (pathSegments.length === 0) {
      return items;
    }

    // First segment: module (users, applications, etc.)
    if (pathSegments.length >= 1) {
      const module = pathSegments[0];
      const moduleDisplayName = moduleDisplayNames[module] || 
        module.charAt(0).toUpperCase() + module.slice(1);
      
      items.push({
        label: moduleDisplayName,
        href: `/${module}`,
        isActive: pathSegments.length === 1,
      });
    }

    // Second segment: action or specific ID
    if (pathSegments.length >= 2) {
      const actionOrId = pathSegments[1];
      
      // Check if it's a known action
      const actionDisplayName = actionDisplayNames[actionOrId];
      
      if (actionDisplayName) {
        // It's an action (new, edit, etc.)
        items.push({
          label: actionDisplayName,
          href: `/${pathSegments[0]}/${actionOrId}`,
          isActive: pathSegments.length === 2,
        });
      } else {
        // It's likely an ID, show as "Item ID"
        items.push({
          label: `Item ${actionOrId}`,
          href: `/${pathSegments[0]}/${actionOrId}`,
          isActive: pathSegments.length === 2,
        });
      }
    }

    // Third segment and beyond: sub-actions or nested paths
    if (pathSegments.length >= 3) {
      for (let i = 2; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const displayName = actionDisplayNames[segment] || 
          segment.charAt(0).toUpperCase() + segment.slice(1);
        
        const href = `/${pathSegments.slice(0, i + 1).join("/")}`;
        
        items.push({
          label: displayName,
          href,
          isActive: i === pathSegments.length - 1,
        });
      }
    }

    return items;
  }, [pathname, appName, moduleDisplayNames, actionDisplayNames]);

  return {
    breadcrumbs,
    currentPath: pathname,
    pathSegments: pathname.replace(/^\//, "").split("/").filter(Boolean),
  };
}