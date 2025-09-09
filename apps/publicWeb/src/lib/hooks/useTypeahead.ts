import { useCallback } from 'react';

interface TypeaheadSearchParams {
  search: string;
  page?: number;
  size?: number;
}

interface TypeaheadOption {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
}

interface TypeaheadResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
}

/**
 * Custom hook for typeahead API calls
 */
export function useTypeahead() {
  
  /**
   * Search authors with typeahead
   */
  const searchAuthors = useCallback(async (searchTerm: string): Promise<TypeaheadOption[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: '1',
        size: '20'
      });

      const response = await fetch(`/api/authors/ref?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search authors: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map the response to TypeaheadOption format
      return (data.data || []).map((item: TypeaheadResponse) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description
      }));
    } catch (error) {
      console.error('Error searching authors:', error);
      return [];
    }
  }, []);

  /**
   * Search publishers with typeahead
   */
  const searchPublishers = useCallback(async (searchTerm: string): Promise<TypeaheadOption[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: '1',
        size: '20'
      });

      const response = await fetch(`/api/publishers/ref?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search publishers: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map the response to TypeaheadOption format
      return (data.data || []).map((item: TypeaheadResponse) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description
      }));
    } catch (error) {
      console.error('Error searching publishers:', error);
      return [];
    }
  }, []);

  /**
   * Search subjects with typeahead
   */
  const searchSubjects = useCallback(async (searchTerm: string): Promise<TypeaheadOption[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: '1',
        size: '20'
      });

      const response = await fetch(`/api/subjects/ref?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search subjects: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map the response to TypeaheadOption format
      return (data.data || []).map((item: TypeaheadResponse) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description
      }));
    } catch (error) {
      console.error('Error searching subjects:', error);
      return [];
    }
  }, []);

  /**
   * Generic search function that can be used with any endpoint
   */
  const searchEndpoint = useCallback(async (
    endpoint: string,
    searchTerm: string,
    options?: {
      pageSize?: number;
      additionalParams?: Record<string, string>;
    }
  ): Promise<TypeaheadOption[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: '1',
        size: String(options?.pageSize || 20),
        ...(options?.additionalParams || {})
      });

      const response = await fetch(`${endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search ${endpoint}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map the response to TypeaheadOption format
      return (data.data || []).map((item: TypeaheadResponse) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description
      }));
    } catch (error) {
      console.error(`Error searching ${endpoint}:`, error);
      return [];
    }
  }, []);

  return {
    searchAuthors,
    searchPublishers,
    searchSubjects,
    searchEndpoint
  };
}