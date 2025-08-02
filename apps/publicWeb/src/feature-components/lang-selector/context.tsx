'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LangSelectorContextValue, LangSelectorProviderProps, Language } from './types';
import { 
  DEFAULT_LANGUAGES, 
  getDefaultLanguage, 
  getBrowserLanguage, 
  getStoredLanguage, 
  setStoredLanguage,
  changeLanguageAPI,
  isValidLanguageCode
} from './utils';

const LangSelectorContext = createContext<LangSelectorContextValue | undefined>(undefined);

/**
 * Language Selector Provider
 * Manages language state and persistence
 */
export function LangSelectorProvider({ 
  children, 
  languages = DEFAULT_LANGUAGES,
  initialLanguage,
  onLanguageChange
}: LangSelectorProviderProps) {
  // Ensure we always have both languages - fallback for import chain issues
  const ensuredLanguages = languages && languages.length > 1 ? languages : [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' as const },
    { code: 'mm', name: 'Myanmar', nativeName: 'မြန်မာ', flag: '🇲🇲', direction: 'ltr' as const }
  ];

  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // Priority: initialLanguage -> stored -> browser -> default
    if (initialLanguage && isValidLanguageCode(initialLanguage, ensuredLanguages)) {
      return initialLanguage;
    }
    
    const stored = getStoredLanguage();
    if (stored && isValidLanguageCode(stored, ensuredLanguages)) {
      return stored;
    }
    
    const browser = getBrowserLanguage(ensuredLanguages);
    return browser;
  });

  const [isChanging, setIsChanging] = useState(false);

  // Update document language attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  /**
   * Change language with API call and persistence
   */
  const changeLanguage = useCallback(async (languageCode: string) => {
    if (!isValidLanguageCode(languageCode, ensuredLanguages) || languageCode === currentLanguage) {
      return;
    }

    setIsChanging(true);
    
    try {
      // Call API to change language on server
      await changeLanguageAPI(languageCode);
      
      // Update local state
      setCurrentLanguage(languageCode);
      
      // Persist to cookie
      setStoredLanguage(languageCode);
      
      // Call external change handler
      if (onLanguageChange) {
        onLanguageChange(languageCode);
      }
      
      // Reload page to apply language changes throughout the app
      window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
      // Don't update state if API call failed
    } finally {
      setIsChanging(false);
    }
  }, [currentLanguage, ensuredLanguages, onLanguageChange]);

  const contextValue: LangSelectorContextValue = {
    currentLanguage,
    languages: ensuredLanguages,
    changeLanguage,
    isChanging
  };

  return (
    <LangSelectorContext.Provider value={contextValue}>
      {children}
    </LangSelectorContext.Provider>
  );
}

/**
 * Hook to use language selector context
 */
export function useLangSelector(): LangSelectorContextValue {
  const context = useContext(LangSelectorContext);
  
  if (context === undefined) {
    throw new Error('useLangSelector must be used within a LangSelectorProvider');
  }
  
  return context;
}