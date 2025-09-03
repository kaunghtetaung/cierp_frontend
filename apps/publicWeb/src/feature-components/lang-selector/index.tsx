'use client';

import React from 'react';
import { LangSelectorWrapperProps } from './types';
import { LangSelectorProvider, useLangSelector } from './context';
import { DEFAULT_LANGUAGES } from './utils';

// Re-export specific items to avoid duplicates
export type { 
  LangSelectorContextValue,
  LangSelectorWrapperProps,
  LangSelectorProviderProps,
  LangSelectorUIProps
} from './types';

export type { Language } from './utils';

export {
  DEFAULT_LANGUAGES,
  getLanguageByCode,
  getDefaultLanguage,
  isValidLanguageCode,
  getBrowserLanguage,
  getStoredLanguage,
  setStoredLanguage,
  changeLanguageAPI
} from './utils';

export { 
  LangSelectorProvider,
  useLangSelector 
} from './context';

/**
 * Main wrapper component for language selector
 * Provides context and handles render props pattern
 */
export function LangSelectorWrapper({ 
  languages = DEFAULT_LANGUAGES, 
  initialLanguage,
  className, 
  children,
  onLanguageChange
}: LangSelectorWrapperProps) {
  return (
    <LangSelectorProvider 
      languages={languages}
      initialLanguage={initialLanguage}
      onLanguageChange={onLanguageChange}
    >
      <div className={className}>
        {typeof children === 'function' ? (
          <LangSelectorConsumer>
            {children}
          </LangSelectorConsumer>
        ) : (
          children
        )}
      </div>
    </LangSelectorProvider>
  );
}

/**
 * Consumer component for render props pattern
 */
function LangSelectorConsumer({ 
  children 
}: { 
  children: (context: ReturnType<typeof useLangSelector>) => React.ReactNode 
}) {
  const context = useLangSelector();
  return <>{children(context)}</>;
}

// Hook already exported above

// Default export
export default LangSelectorWrapper;