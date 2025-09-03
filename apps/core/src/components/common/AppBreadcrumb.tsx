"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@repo/ui";
import { useBreadcrumb, BreadcrumbItem } from "@/hooks/useBreadcrumb";
import { useLanguage } from "@repo/language";
import { getLocalizedText } from "@repo/utils";

interface AppBreadcrumbProps {
  className?: string;
  showHomeIcon?: boolean;
  maxItems?: number;
  moduleDisplayNames?: Record<string, string>;
  actionDisplayNames?: Record<string, string>;
}

export function AppBreadcrumb({
  className = "",
  showHomeIcon = true,
  maxItems = 5,
  moduleDisplayNames = {},
  actionDisplayNames = {},
}: AppBreadcrumbProps) {
  const { currentLanguage } = useLanguage();
  
  // Default localized action names
  const defaultActionNames = {
    list: getLocalizedText({ en: "List", mm: "စာရင်း" }, currentLanguage),
    new: getLocalizedText({ en: "New", mm: "အသစ်" }, currentLanguage),
    edit: getLocalizedText({ en: "Edit", mm: "ပြင်ဆင်" }, currentLanguage),
    view: getLocalizedText({ en: "View", mm: "ကြည့်ရှု" }, currentLanguage),
    settings: getLocalizedText({ en: "Settings", mm: "ဆက်တင်များ" }, currentLanguage),
    details: getLocalizedText({ en: "Details", mm: "အသေးစိတ်" }, currentLanguage),
  };

  const { breadcrumbs } = useBreadcrumb({
    appName: getLocalizedText({ en: "Dashboard", mm: "ဒက်ရှ်ဘုတ်" }, currentLanguage),
    moduleDisplayNames,
    actionDisplayNames: { ...defaultActionNames, ...actionDisplayNames },
  });

  // Limit breadcrumbs if needed
  const displayBreadcrumbs = breadcrumbs.length > maxItems 
    ? [
        breadcrumbs[0],
        { label: "...", isEllipsis: true } as BreadcrumbItem & { isEllipsis: boolean },
        ...breadcrumbs.slice(-2)
      ]
    : breadcrumbs;

  if (breadcrumbs.length === 0) {
    return null; // Only hide if no breadcrumbs at all
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className
      )}
    >
      <ol className="flex items-center space-x-1">
        {displayBreadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index === 0 && showHomeIcon && (
              <Home className="w-4 h-4 mr-1" />
            )}

            {"isEllipsis" in item && item.isEllipsis ? (
              <span className="px-2 py-1 text-muted-foreground">...</span>
            ) : item.isActive ? (
              <span 
                className={cn(
                  "font-medium text-foreground",
                  "px-2 py-1 rounded-md"
                )}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className={cn(
                  "hover:text-foreground transition-colors",
                  "px-2 py-1 rounded-md hover:bg-accent",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
              >
                {item.label}
              </Link>
            )}

            {index < displayBreadcrumbs.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/50" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default AppBreadcrumb;