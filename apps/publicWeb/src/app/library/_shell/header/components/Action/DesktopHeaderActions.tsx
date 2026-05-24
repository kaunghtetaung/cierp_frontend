"use client";

import React from "react";
import { HeaderActionsProps } from "../../types";
import { LangSelectorWrapper } from "@/feature-components/lang-selector";
import { LangSelectorUI } from "../../../navigation/header/LangSelectorUI";
import { UserMenu } from "./UserMenu";
import { SearchComponent } from "./SearchComponent";

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
 * Desktop Header Actions Component
 * Layout: Search | Language | User
 * Uses CSS classes for styling
 */
export const DesktopHeaderActions: React.FC<HeaderActionsProps> = ({
  className,
  showSearch = false,
  showLanguageSelector = false,
  showUserMenu = false,
  currentLanguage = "en",
}) => {
  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      {showSearch && <SearchComponent variant="desktop" />}

      {showLanguageSelector && (
        <LangSelectorWrapper
          initialLanguage={currentLanguage}
          languages={SUPPORTED_LANGUAGES}
        >
          <LangSelectorUI
            variant="dropdown"
            showFlag={false}
            showNativeName={true}
            showName={false}
            className="relative"
            triggerClassName="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-primary hover:underline underline-offset-2 transition-colors border-0 bg-transparent rounded-none"
            contentClassName="w-48"
          />
        </LangSelectorWrapper>
      )}

      {showUserMenu && <UserMenu variant="desktop" />}
    </div>
  );
};
