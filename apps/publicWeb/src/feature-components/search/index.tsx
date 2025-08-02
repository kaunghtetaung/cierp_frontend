'use client';

import React from 'react';
import { SearchWrapperProps } from './types';
import { SearchProvider } from './context';

// Re-export everything for convenience
export * from './types';
export * from './context';
export { default as SearchBox } from './SearchBox';

/**
 * Search Wrapper Component
 * Provides search context to children
 */
export function SearchWrapper({ 
  children, 
  className = '',
  searchEndpoint = '/api/search',
  debounceMs = 300
}: SearchWrapperProps) {
  return (
    <SearchProvider 
      searchEndpoint={searchEndpoint}
      debounceMs={debounceMs}
    >
      <div className={`search-wrapper ${className}`}>
        {children}
      </div>
    </SearchProvider>
  );
}

// Hook for easy access
export { useSearch } from './context';

// Default export
export default SearchWrapper;