"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@repo/utils";
import { DesktopNavigationProps } from "./types";
import {
  filterNavigationItems,
  getTitle,
  generateHref,
  getLinkTarget,
  getLinkRel,
} from "./utils";

/**
 * Simple Desktop Navigation Component
 * Pure HTML navigation with CSS hover dropdowns
 */
export function DesktopNavigation({
  items,
  currentLanguage = "en",
  isAuthenticated = false,
  userRoles = [],
  className,
}: DesktopNavigationProps) {
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const visibleItems = React.useMemo(() => {
    return filterNavigationItems(items, isAuthenticated, userRoles);
  }, [items, isAuthenticated, userRoles]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-6", className)}>
      {visibleItems.map((item) => {
        const title = getTitle(item, currentLanguage);
        const href = generateHref(item);
        const target = getLinkTarget(item);
        const rel = getLinkRel(item);
        const visibleChildren = item.children
          ? filterNavigationItems(item.children, isAuthenticated, userRoles)
          : [];

        // Item with dropdown children
        if (visibleChildren.length > 0) {
          const isOpen = openDropdown === item.id;
          // Dynamic grid columns based on number of children
          const getGridCols = (count: number) => {
            if (count < 6) return "grid-cols-1";
            if (count <= 8) return "grid-cols-2";
            if (count <= 12) return "grid-cols-3";
            return "grid-cols-4";
          };

          const getWidth = (count: number) => {
            if (count < 6) return "w-64";
            if (count <= 8) return "w-96";
            if (count <= 12) return "w-[600px]";
            return "w-[800px]";
          };

          return (
            <div key={item.id} className="relative dropdown-container">
              <button
                className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] px-2 py-2 touch-manipulation"
                type="button"
                onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                onTouchStart={() => setOpenDropdown(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
              >
                <span>{title}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div
                  className={cn(
                    "absolute left-0 top-full mt-2 bg-background border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95",
                    getWidth(visibleChildren.length)
                  )}
                >
                  <div
                    className={cn(
                      "grid gap-1 p-3",
                      getGridCols(visibleChildren.length)
                    )}
                  >
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.id}
                        href={generateHref(child)}
                        target={getLinkTarget(child)}
                        rel={getLinkRel(child)}
                        className="block px-3 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors min-h-[44px] touch-manipulation"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {getTitle(child, currentLanguage)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Regular navigation item
        return (
          <Link
            key={item.id}
            href={href}
            target={target}
            rel={rel}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] px-2 py-2 flex items-center touch-manipulation"
          >
            {title}
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopNavigation;
