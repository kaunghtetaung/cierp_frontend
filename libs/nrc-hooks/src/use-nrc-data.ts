"use client";

import useSWR from 'swr';
import type { NrcState, NrcTownship, NrcType } from './types';

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

/**
 * Hook to fetch NRC states/regions
 *
 * @returns {object} { states, isLoading, error }
 *
 * @example
 * const { states, isLoading } = useNrcStates();
 */
export function useNrcStates() {
  const { data, error, isLoading } = useSWR<NrcState[]>(
    '/api/nrc/states',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    states: data,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch townships for a specific state
 * Only fetches when stateId is provided
 *
 * @param stateId - State ID (1-14), or null to skip fetching
 * @returns {object} { townships, isLoading, error }
 *
 * @example
 * const { townships, isLoading } = useNrcTownships(selectedStateId);
 */
export function useNrcTownships(stateId: string | null) {
  const { data, error, isLoading } = useSWR<NrcTownship[]>(
    stateId ? `/api/nrc/townships/${stateId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    townships: data,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch NRC citizenship types
 *
 * @returns {object} { types, isLoading, error }
 *
 * @example
 * const { types, isLoading } = useNrcTypes();
 */
export function useNrcTypes() {
  const { data, error, isLoading } = useSWR<NrcType[]>(
    '/api/nrc/types',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    types: data,
    isLoading,
    error,
  };
}
