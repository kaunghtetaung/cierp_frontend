'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'mm', name: 'Myanmar', nativeName: 'မြန်မာ', flag: '🇲🇲', direction: 'ltr' }
];

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (langCode: string) => void;
  isLoading?: boolean;
  variant?: 'icon' | 'full';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  isLoading = false,
  variant = 'full',
  showFlag = true,
  showNativeName = true,
  className = ''
}: LanguageSelectorProps) {
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (langCode: string) => {
    if (langCode !== currentLanguage && !isLoading) {
      onLanguageChange(langCode);
    }
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${className}`}
            disabled={isLoading}
            aria-label="Select language"
          >
            {showFlag && currentLang.flag ? (
              <span className="text-sm">{currentLang.flag}</span>
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="min-w-[180px] bg-card border-border">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="cursor-pointer flex items-center gap-3"
            >
              {showFlag && language.flag && (
                <span className="text-sm">{language.flag}</span>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {showNativeName ? language.nativeName : language.name}
                </div>
                {showNativeName && language.name !== language.nativeName && (
                  <div className="text-xs text-muted-foreground">
                    {language.name}
                  </div>
                )}
              </div>
              {language.code === currentLanguage && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 h-8 px-3 text-sm ${className}`}
          disabled={isLoading}
        >
          {showFlag && currentLang.flag && (
            <span className="text-sm">{currentLang.flag}</span>
          )}
          <span className="text-sm">
            {showNativeName ? currentLang.nativeName : currentLang.name}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="min-w-[180px] bg-card border-border">
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="cursor-pointer flex items-center gap-3"
          >
            {showFlag && language.flag && (
              <span className="text-sm">{language.flag}</span>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">
                {showNativeName ? language.nativeName : language.name}
              </div>
              {showNativeName && language.name !== language.nativeName && (
                <div className="text-xs text-muted-foreground">
                  {language.name}
                </div>
              )}
            </div>
            {language.code === currentLanguage && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
          <div className="h-3 w-3 animate-spin border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </DropdownMenu>
  );
}

export default LanguageSelector;