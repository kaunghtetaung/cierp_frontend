"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import styles from '../styles/signup.module.css';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'mm',
    name: 'Myanmar',
    nativeName: 'မြန်မာ',
    flag: '🇲🇲'
  }
];

interface LanguageSwitcherProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLang);

  useEffect(() => {
    setSelectedLang(currentLang);
  }, [currentLang]);

  const currentLanguage = LANGUAGES.find(lang => lang.code === selectedLang) || LANGUAGES[0];

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLang(langCode);
    onLanguageChange(langCode);
    setIsOpen(false);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', langCode);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.languageSwitcher}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={styles.languageSwitcher}>
      <button
        className={styles.languageButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
        title={currentLanguage.name}
      >
        <span className={styles.langFlag}>{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div className={styles.languageDropdown}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`${styles.languageOption} ${lang.code === selectedLang ? styles.selected : ''}`}
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <span className={styles.langFlag}>{lang.flag}</span>
              <div className={styles.langInfo}>
                <div className={styles.langName}>{lang.name}</div>
                <div className={styles.langNative}>{lang.nativeName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}