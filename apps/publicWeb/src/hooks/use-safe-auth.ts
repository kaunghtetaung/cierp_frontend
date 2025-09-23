// Safe auth hook for public pages that doesn't trigger redirects
'use client';

import { useState, useEffect } from 'react';
import type { User } from '@repo/types';

interface SafeAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Safe auth hook that doesn't trigger redirects or errors
 * Used for public pages that need to show different content based on auth state
 * but should never force authentication
 */
export function useSafeAuth(): SafeAuthState {
  const [state, setState] = useState<SafeAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check auth status without triggering redirects
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setState({
            user: data.user || null,
            isAuthenticated: !!data.user,
            isLoading: false,
          });
        } else {
          // Not authenticated, but that's okay for public pages
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        // Silently handle errors - user is simply not authenticated
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  return state;
}