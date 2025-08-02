'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { languageService } from './service';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

export function LanguageProvider({ children, initialLanguage = 'en' }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize language on mount
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const bestLanguage = await languageService.initializeLanguage(initialLanguage);
        setCurrentLanguage(bestLanguage);
      } catch (err) {
        console.error('Failed to initialize language:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize language');
      }
    };

    initLanguage();
  }, [initialLanguage]);

  const setLanguage = useCallback(async (language: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await languageService.changeLanguage(language);
      
      if (response.success) {
        setCurrentLanguage(language);
        // Optionally reload page to apply language changes
        // window.location.reload();
      } else {
        setError(response.error || 'Failed to change language');
      }
    } catch (err) {
      console.error('Failed to change language:', err);
      setError(err instanceof Error ? err.message : 'Failed to change language');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isLoading,
    error
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageProvider;