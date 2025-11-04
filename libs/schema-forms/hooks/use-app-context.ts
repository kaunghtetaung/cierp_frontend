'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';

export interface AppContextData {
  tenantId: string | null;
  appId: string | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get app context (tenantId, appId, username) from various sources
 * Priority:
 * 1. API call to /api/auth/session (gets from cookies/headers)
 * 2. URL params (appId from route)
 * 3. Cookies (x-tenant-id, x-app-id)
 */
export function useAppContext(): AppContextData {
  const params = useParams();
  const pathname = usePathname();
  const [context, setContext] = useState<AppContextData>({
    tenantId: null,
    appId: null,
    username: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchContext() {
      try {
        // Get appId from URL params
        const appIdFromParams = params?.appId as string | undefined;

        // Get tenantId from cookies
        const tenantIdFromCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('x-tenant-id='))
          ?.split('=')[1] || null;

        // Try to fetch session info from API
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const sessionData = await response.json();

            // Extract username from session data
            const username = sessionData?.user?.email?.split('@')[0] ||
                           sessionData?.user?.username ||
                           sessionData?.user?.id ||
                           'user';

            setContext({
              tenantId: sessionData?.tenant?.tenantId || tenantIdFromCookie,
              appId: appIdFromParams || sessionData?.appId || 'core',
              username,
              isLoading: false,
              error: null,
            });
            return;
          }
        } catch (apiError) {
          console.warn('Failed to fetch session from API:', apiError);
        }

        // Fallback to cookie-based context
        setContext({
          tenantId: tenantIdFromCookie,
          appId: appIdFromParams || 'core',
          username: 'user',
          isLoading: false,
          error: tenantIdFromCookie ? null : 'Missing tenant context',
        });
      } catch (error) {
        console.error('Error fetching app context:', error);
        setContext({
          tenantId: null,
          appId: null,
          username: null,
          isLoading: false,
          error: 'Failed to load app context',
        });
      }
    }

    fetchContext();
  }, [params, pathname]);

  return context;
}
