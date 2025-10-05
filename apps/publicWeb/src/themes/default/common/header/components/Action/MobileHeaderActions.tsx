"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
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

  return (
    <div
      className={`relative flex items-center w-full ${
        className || ""
      }`}
    >
      {/* Left Side: Hamburger Menu */}
      <div className="flex items-center flex-shrink-0">
        {navigationItems.length > 0 && (
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] touch-manipulation border-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent outline-none flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Center: Title - Flexible width with ellipsis */}
      <div className="flex-1 px-2 min-w-0">
        <h1 className="text-sm sm:text-base font-semibold truncate text-white text-center">
          {title}
        </h1>
      </div>

      {/* Right Side: Actions - Compact on small screens */}
      <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0">
        {showLanguageSelector && (
          <LangSelectorWrapper
            initialLanguage={currentLanguage}
            languages={SUPPORTED_LANGUAGES}
          >
            <LangSelectorIcon
              className="min-h-[44px] min-w-[40px] sm:min-w-[44px]"
              triggerClassName="min-h-[44px] min-w-[40px] sm:min-w-[44px] border-0 shadow-none hover:bg-transparent rounded-md transition-colors touch-manipulation [&_svg]:text-white p-1 sm:p-2"
            />
          </LangSelectorWrapper>
        )}
        {showUserMenu && (
          <UserMenu
            variant="mobile"
            className="min-h-[44px] min-w-[40px] sm:min-w-[44px] touch-manipulation border-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent outline-none flex items-center justify-center"
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
          showSearch={showSearch}
        />
      )}
    </div>
  );
};
