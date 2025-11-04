"use client";

import React, { useState } from "react";
import { HeaderNavigationProps } from "./types";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";

/**
 * Header Navigation Component
 * Responsive navigation that switches between desktop and mobile layouts
 */
export function HeaderNavigation({
  items,
  currentLanguage = "en",
  isAuthenticated = false,
  userRoles = [],
  className,
}: HeaderNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Early return if no navigation items
  if (!items || items.length === 0) {
    return null;
  }

  const commonProps = {
    items,
    currentLanguage,
    isAuthenticated,
    userRoles,
  };

  return (
    <div className={className}>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <DesktopNavigation {...commonProps} />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNavigation
          {...commonProps}
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        />
      </div>
    </div>
  );
}

// Export individual components for flexibility
export { DesktopNavigation } from "./DesktopNavigation";
export { MobileNavigation } from "./MobileNavigation";

// Export types
export type {
  NavigationItem as NavigationItemType,
  HeaderNavigationProps,
  NavigationItemProps,
  MobileNavigationProps,
  DesktopNavigationProps,
  MultiLanguageText,
} from "./types";

// Default export
export default HeaderNavigation;
