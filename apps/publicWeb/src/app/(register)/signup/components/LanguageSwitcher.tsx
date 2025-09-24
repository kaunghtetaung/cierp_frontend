"use client";

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLang: 'en' | 'mm';
  onLanguageChange: (lang: string) => void;
}

export function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'mm', name: 'မြန်မာ', flag: '🇲🇲' },
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    onLanguageChange(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
      >
        <Globe className="w-4 h-4 hidden sm:block" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown className={`w-4 h-4 hidden sm:block transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`
                  w-full text-left px-4 py-2 text-sm flex items-center gap-3
                  transition-colors duration-150
                  ${lang.code === currentLang 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {lang.code === currentLang && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}