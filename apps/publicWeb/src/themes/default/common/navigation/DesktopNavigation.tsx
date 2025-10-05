"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/utils";
import { IconComponent } from "@repo/ui/components/icons";
import { DesktopNavigationProps } from "./types";
import {
  filterNavigationItems,
  getTitle,
  generateHref,
  getLinkTarget,
  getLinkRel,
} from "./utils";
import { MegaMenu } from "./MegaMenu";

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
  const currentPath = usePathname(); // Get current path from Next.js router

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

          // Check if this should be a mega menu (has nested groups with >6 items)
          // Check the original children (before filtering) to detect nested structure
          const hasNestedGroups = item.children?.some(
            (child) => child.children && child.children.length > 6
          );

          // Use MegaMenu for complex nested structures
          if (hasNestedGroups) {
            const buttonRef = React.useRef<HTMLButtonElement>(null);

            React.useEffect(() => {
              if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                document.documentElement.style.setProperty(
                  '--mega-menu-top',
                  `${rect.bottom + 8}px`
                );
              }
            }, [isOpen]);

            const isActive = currentPath === href || currentPath.startsWith(href + '/');

            return (
              <div key={item.id} className="dropdown-container">
                <button
                  ref={buttonRef}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors min-h-[36px] px-2 py-1.5 touch-manipulation",
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-foreground hover:text-primary"
                  )}
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                  onTouchStart={() => setOpenDropdown(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                >
                  {item.icon && (
                    <IconComponent name={item.icon} size={16} className="flex-shrink-0" />
                  )}
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

                {isOpen && (
                  <MegaMenu
                    item={item}
                    visibleChildren={visibleChildren}
                    currentLanguage={currentLanguage}
                    isOpen={isOpen}
                    onClose={() => setOpenDropdown(null)}
                  />
                )}
              </div>
            );
          }

          // Regular dropdown for simple parent-child relationships
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

          const isActive = currentPath === href || currentPath.startsWith(href + '/');

          return (
            <div key={item.id} className="relative dropdown-container">
              <button
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors min-h-[36px] px-2 py-1.5 touch-manipulation",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-foreground hover:text-primary"
                )}
                type="button"
                onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                onTouchStart={() => setOpenDropdown(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
              >
                {item.icon && (
                  <IconComponent name={item.icon} size={16} className="flex-shrink-0" />
                )}
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
        const isActive = currentPath === href || currentPath.startsWith(href + '/');

        return (
          <Link
            key={item.id}
            href={href}
            target={target}
            rel={rel}
            className={cn(
              "text-sm font-medium transition-colors min-h-[36px] px-2 py-1.5 flex items-center gap-2 touch-manipulation",
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-foreground hover:text-primary"
            )}
          >
            {item.icon && (
              <IconComponent name={item.icon} size={16} className="flex-shrink-0" />
            )}
            {title}
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopNavigation;
