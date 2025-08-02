'use client';

import React from 'react';
import { LangSelectorWrapperProps } from './types';
import { LangSelectorProvider, useLangSelector } from './context';
import { DEFAULT_LANGUAGES } from './utils';

// Re-export everything for convenience
export * from './types';
export * from './utils';
export * from './context';

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

// Hook for easy access
export { useLangSelector } from './context';

// Default export
export default LangSelectorWrapper;