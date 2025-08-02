"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/styled-components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/styled-components/ui/DropdownMenu";
import { ChevronDown, Check } from "lucide-react";
import { useLangSelector, Language } from "@/feature-components/lang-selector";

interface LangSelectorUIProps {
  variant?: "dropdown" | "select";
  showFlag?: boolean;
  showNativeName?: boolean;
  showName?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

// Helper component for displaying the selected language in the trigger
const LanguageDisplay = ({
  language,
  showFlag,
  showName,
  showNativeName,
}: {
  language: Language;
  showFlag?: boolean;
  showName?: boolean;
  showNativeName?: boolean;
}) => (
  <div className="flex items-center gap-2">
    {showFlag && language.flag && (
      <span className="text-sm">{language.flag}</span>
    )}
    {showName && (
      <span className="text-sm">
        {showNativeName ? language.nativeName : language.name}
      </span>
    )}
  </div>
);

// Helper component for displaying a language in the dropdown list
const LanguageItem = ({
  language,
  showFlag,
  showName,
  showNativeName,
  isSelected,
}: {
  language: Language;
  showFlag?: boolean;
  showName?: boolean;
  showNativeName?: boolean;
  isSelected: boolean;
}) => (
  <div className="flex items-center gap-3 w-full">
    {showFlag && language.flag && (
      <span className="text-sm">{language.flag}</span>
    )}
    <div className="flex-1">
      <div className="text-sm font-medium">
        {showNativeName ? language.nativeName : language.name}
      </div>
      {showName && showNativeName && language.name !== language.nativeName && (
        <div className="text-xs text-muted-foreground">{language.name}</div>
      )}
    </div>
    {isSelected && <Check className="h-4 w-4 text-primary" />}
  </div>
);

const SelectLangSelector: React.FC<
  Omit<LangSelectorUIProps, "variant"> & {
    currentLanguage: string;
    languages: Language[];
    currentLang: Language;
    isChanging: boolean;
    changeLanguage: (code: string) => void;
  }
> = ({
  currentLanguage,
  languages,
  currentLang,
  isChanging,
  changeLanguage,
  showFlag,
  showNativeName,
  showName,
  className,
  triggerClassName,
  contentClassName,
}) => {
  return (
    <div className={className}>
      <Select
        value={currentLanguage}
        onValueChange={isChanging ? undefined : changeLanguage}
      >
        <SelectTrigger
          className={`flex items-center gap-2 ${triggerClassName}`}
        >
          <div className="flex items-center gap-2">
            {showFlag && currentLang.flag && (
              <span className="text-sm">{currentLang.flag}</span>
            )}
            {showName && (
              <span className="text-sm">
                {showNativeName ? currentLang.nativeName : currentLang.name}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <LanguageItem
                language={language}
                showFlag={showFlag}
                showNativeName={showNativeName}
                showName={showName}
                isSelected={language.code === currentLanguage}
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const DropdownLangSelector: React.FC<
  Omit<LangSelectorUIProps, "variant"> & {
    currentLanguage: string;
    languages: Language[];
    currentLang: Language;
    isChanging: boolean;
    changeLanguage: (code: string) => void;
  }
> = ({
  currentLanguage,
  languages,
  currentLang,
  isChanging,
  changeLanguage,
  showFlag,
  showNativeName,
  showName,
  className,
  triggerClassName,
  contentClassName,
}) => {
  return (
    <div className={`relative ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`group flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation ${triggerClassName}`}
            disabled={isChanging}
            aria-haspopup="menu"
            aria-label="Select language"
            type="button"
          >
            <LanguageDisplay
              language={currentLang}
              showFlag={showFlag}
              showNativeName={showNativeName}
              showName={showName}
            />
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className={`min-w-[180px] bg-card border border-border shadow-lg rounded-md z-[9999] ${contentClassName}`}
        >
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`cursor-pointer hover:bg-accent hover:text-accent-foreground p-3 min-h-[44px] touch-manipulation ${
                language.code === currentLanguage
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
            >
              <LanguageItem
                language={language}
                showFlag={showFlag}
                showName={showName}
                showNativeName={showNativeName}
                isSelected={language.code === currentLanguage}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {isChanging && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-md z-[10000]">
          <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
};

export function LangSelectorUI({
  variant = "dropdown",
  showFlag = true,
  showNativeName = true,
  showName = true,
  className = "",
  triggerClassName = "",
  contentClassName = "",
}: LangSelectorUIProps) {
  const { currentLanguage, languages, changeLanguage, isChanging } =
    useLangSelector();

  const currentLang =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  if (!languages || languages.length === 0) {
    return null;
  }

  const commonProps = {
    currentLanguage,
    languages,
    currentLang,
    isChanging,
    changeLanguage,
    showFlag,
    showNativeName,
    showName,
    className,
    triggerClassName,
    contentClassName,
  };

  if (variant === "select") {
    return <SelectLangSelector {...commonProps} />;
  }

  return <DropdownLangSelector {...commonProps} />;
}

// Compact version for mobile
export function LangSelectorCompact({
  className = "",
  ...props
}: LangSelectorUIProps) {
  return (
    <LangSelectorUI
      {...props}
      showNativeName={false}
      showName={false}
      showFlag={true}
      className={className}
      triggerClassName="min-h-[44px] min-w-[44px] p-2 justify-center hover:bg-accent rounded-md transition-colors"
    />
  );
}

// Icon-only version
export function LangSelectorIcon({
  className = "",
  ...props
}: LangSelectorUIProps) {
  return (
    <LangSelectorUI
      {...props}
      variant="dropdown"
      showNativeName={false}
      showName={false}
      showFlag={true}
      className={className}
      triggerClassName="min-h-[44px] min-w-[44px] p-2 justify-center hover:bg-accent rounded-md transition-colors"
    />
  );
}

export default LangSelectorUI;
