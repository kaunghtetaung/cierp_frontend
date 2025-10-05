"use client";

import React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Search } from "lucide-react";
import { Button } from "@/styled-components/ui/Button";
import { MobileNavigationProps } from "./types";
import {
  filterNavigationItems,
  getTitle,
  generateHref,
  getLinkTarget,
  getLinkRel,
} from "./utils";

/**
 * Mobile Navigation Component using shadcn/ui Sidebar
 */
export function MobileNavigation({
  items,
  currentLanguage = "en",
  isAuthenticated = false,
  userRoles = [],
  isOpen,
  onOpenChange,
  showSearch = false,
}: MobileNavigationProps & { showSearch?: boolean }) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const visibleItems = React.useMemo(() => {
    return filterNavigationItems(items, isAuthenticated, userRoles);
  }, [items, isAuthenticated, userRoles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchUrl = new URL("/search", window.location.origin);
      searchUrl.searchParams.set("q", searchQuery.trim());
      window.location.href = searchUrl.toString();
    }
  };

  if (!isOpen || typeof window === "undefined") {
    return null;
  }

  const sidebarContent = (
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border shadow-lg transform transition-transform duration-200 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="px-4 pb-4">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full h-10 pl-10 pr-4 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {visibleItems.map((item) => {
                const title = getTitle(item, currentLanguage);
                const href = generateHref(item);
                const target = getLinkTarget(item);
                const rel = getLinkRel(item);
                const visibleChildren = item.children
                  ? filterNavigationItems(
                      item.children,
                      isAuthenticated,
                      userRoles
                    )
                  : [];

                // Item with children
                if (visibleChildren.length > 0) {
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                        {title}
                      </div>
                      <div className="ml-4 space-y-1">
                        {visibleChildren.map((child) => (
                          <Link
                            key={child.id}
                            href={generateHref(child)}
                            target={getLinkTarget(child)}
                            rel={getLinkRel(child)}
                            className="block px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                            onClick={() => onOpenChange(false)}
                          >
                            {getTitle(child, currentLanguage)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Regular item
                return (
                  <Link
                    key={item.id}
                    href={href}
                    target={target}
                    rel={rel}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    onClick={() => onOpenChange(false)}
                  >
                    {title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sidebarContent, document.body);
}

export default MobileNavigation;
