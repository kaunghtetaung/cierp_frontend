'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SearchContextValue, SearchProviderProps, SearchResult } from './types';

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

/**
 * Search Provider
 * Manages search state and API calls
 */
export function SearchProvider({ 
  children, 
  searchEndpoint = '/api/search',
  debounceMs = 300
}: SearchProviderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Perform search
   */
  const search = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      return;
    }

    setQuery(trimmedQuery);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const searchParams = new URLSearchParams({
        q: trimmedQuery,
        limit: '10'
      });

      const response = await fetch(`${searchEndpoint}?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchEndpoint]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsLoading(false);
    setHasSearched(false);
  }, []);

  const contextValue: SearchContextValue = {
    query,
    results,
    isLoading,
    hasSearched,
    search,
    clearSearch
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

/**
 * Hook to use search context
 */
export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  
  return context;
}