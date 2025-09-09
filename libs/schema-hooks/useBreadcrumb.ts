"use client";

import { usePathname, useParams } from "next/navigation";
import { useMemo } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive: boolean;
}

export interface UseBreadcrumbConfig {
  appName: string;
  moduleDisplayNames?: Record<string, string>;
  actionDisplayNames?: Record<string, string>;
}

export function useBreadcrumb({
  appName,
  moduleDisplayNames = {},
  actionDisplayNames = {},
}: UseBreadcrumbConfig) {
  const pathname = usePathname();
  const params = useParams();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Add app name as first breadcrumb
    items.push({
      label: appName,
      href: segments.length > 1 ? `/${segments[0]}` : undefined,
      isActive: segments.length === 1,
    });

    // Handle different path patterns
    if (segments.length > 1) {
      const appId = segments[0];
      
      // Dashboard page
      if (segments[1] === "dashboard") {
        items.push({
          label: "Dashboard",
          href: undefined,
          isActive: true,
        });
        return items;
      }

      // Module pages
      if (segments.length >= 2) {
        const moduleName = segments[1];
        const moduleDisplayName = moduleDisplayNames[moduleName] || moduleName;

        items.push({
          label: moduleDisplayName,
          href: segments.length === 2 ? undefined : `/${appId}/${moduleName}`,
          isActive: segments.length === 2,
        });

        // Action pages (new, edit, view, etc.)
        if (segments.length >= 3) {
          const action = segments[2];
          
          // Handle special cases like "deleted"
          if (action === "deleted") {
            items.push({
              label: "Deleted Items",
              href: undefined,
              isActive: true,
            });
          }
          // Handle ID-based routes (view/edit specific records)
          else if (segments.length >= 4) {
            const recordAction = segments[3];
            const actionDisplayName = actionDisplayNames[recordAction] || recordAction;
            
            items.push({
              label: actionDisplayName,
              href: undefined,
              isActive: true,
            });
          }
          // Handle direct actions (new, settings, etc.)
          else {
            const actionDisplayName = actionDisplayNames[action] || action;
            items.push({
              label: actionDisplayName,
              href: undefined,
              isActive: true,
            });
          }
        }
      }
    }

    return items;
  }, [pathname, appName, moduleDisplayNames, actionDisplayNames]);

  return { breadcrumbs };
}