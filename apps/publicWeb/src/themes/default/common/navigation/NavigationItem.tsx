"use client";

import React from "react";
import Link from "next/link";
import {
  NavigationItem as NavigationItemType,
  NavigationItemProps,
} from "./types";

/**
 * Individual Navigation Item Component
 * Handles both desktop and mobile rendering
 * Uses CSS classes instead of inline styles
 */
export function NavigationItem({
  item,
  currentLanguage,
  isAuthenticated,
  userRoles,
  isMobile = false,
  onItemClick,
}: NavigationItemProps) {
  // Check if user has access to this item
  const hasAccess = React.useMemo(() => {
    // If authentication is required but user is not authenticated
    if (item.requiresAuth && !isAuthenticated) {
      return false;
    }

    // If specific roles are required
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (
        !isAuthenticated ||
        !userRoles.some((role) => item.allowedRoles!.includes(role))
      ) {
        return false;
      }
    }

    return true;
  }, [item.requiresAuth, item.allowedRoles, isAuthenticated, userRoles]);

  // Get localized title
  const title = item.title[currentLanguage] || item.title.en || "Untitled";

  // Don't render if user doesn't have access
  if (!hasAccess) {
    return null;
  }

  // Determine the URL
  const href = item.url || (item.pageId ? `/page/${item.pageId}` : "#");

  // Handle click
  const handleClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  // Common props for both Link and button
  const commonProps = {
    className: `${
      isMobile
        ? "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        : "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    } ${
      item.isActive ? "bg-accent text-accent-foreground" : "text-foreground"
    } ${item.cssClass || ""}`,
    onClick: handleClick,
    "aria-label": title,
  };

  // If it's an external link or has special behavior
  if (item.openInNewTab) {
    return (
      <a {...commonProps} href={href} target="_blank" rel="noopener noreferrer">
        {item.icon && (
          <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="flex-1">{title}</span>
        {item.openInNewTab && (
          <span className="flex-shrink-0 w-4 h-4 opacity-60" aria-hidden="true">
            ↗
          </span>
        )}
      </a>
    );
  }

  // Internal link
  return (
    <Link {...commonProps} href={href}>
      {item.icon && (
        <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <span className="flex-1">{title}</span>
    </Link>
  );
}

export default NavigationItem;
