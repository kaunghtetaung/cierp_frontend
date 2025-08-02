"use client";

import React, { useState } from "react";
import { Button } from "@/styled-components/ui/Button";
import { Menu, Search, X } from "lucide-react";
import { HeaderActionsProps } from "../../types";
import { LangSelectorWrapper } from "@/feature-components/lang-selector";
import { LangSelectorIcon } from "../../../navigation/header/LangSelectorUI";
import { UserMenu } from "./UserMenu";
import { MobileNavigationWithAuth } from "../MobileNavigationWithAuth";

// Define languages directly to avoid import chain issues
const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    direction: "ltr" as const,
  },
  {
    code: "mm",
    name: "Myanmar",
    nativeName: "မြန်မာ",
    flag: "🇲🇲",
    direction: "ltr" as const,
  },
];

/**
 * Mobile Header Actions Component
 * Layout: [☰] | Title | [🔍] [🌐] [👤]
 */
export const MobileHeaderActions: React.FC<HeaderActionsProps> = ({
  className,
  showSearch = false,
  showLanguageSelector = false,
  showUserMenu = false,
  title,
  navigationItems = [],
  currentLanguage = "en",
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search overlay mode for mobile - takes over the entire screen
  if (isSearchOpen) {
    return (
      <div
        className={`fixed top-0 left-0 right-0 bg-background p-4 shadow-md z-50 flex items-center gap-3 ${
          className || ""
        }`}
      >
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-10 px-4 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <button
          type="button"
          className="flex-shrink-0 min-h-[44px] min-w-[44px] border-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent outline-none flex items-center justify-center"
          onClick={() => setIsSearchOpen(false)}
          aria-label="Close search"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-between w-full ${
        className || ""
      }`}
    >
      {/* Left Side: Hamburger Menu */}
      <div className="flex items-center">
        {navigationItems.length > 0 && (
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] touch-manipulation border-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent outline-none flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Center: Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-base font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center gap-1 ml-auto">
        {showSearch && (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search"
            className="min-h-[44px] min-w-[44px] mr-2 touch-manipulation border-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent outline-none flex items-center justify-center"
          >
            <Search className="h-4 w-4 text-foreground" />
          </button>
        )}
        {showLanguageSelector && (
          <LangSelectorWrapper
            initialLanguage={currentLanguage}
            languages={SUPPORTED_LANGUAGES}
          >
            <LangSelectorIcon
              className="min-h-[44px] min-w-[44px]"
              triggerClassName="min-h-[44px] min-w-[44px] border-0 shadow-none hover:bg-transparent rounded-md transition-colors touch-manipulation"
            />
          </LangSelectorWrapper>
        )}
        {showUserMenu && (
          <UserMenu
            variant="mobile"
            className="min-h-[44px] min-w-[44px] mr-2 touch-manipulation border-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent outline-none flex items-center justify-center"
          />
        )}
      </div>

      {/* Mobile Navigation Sidebar - Portal to body */}
      {navigationItems.length > 0 && typeof window !== "undefined" && (
        <MobileNavigationWithAuth
          items={navigationItems}
          currentLanguage={currentLanguage}
          isOpen={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        />
      )}
    </div>
  );
};
