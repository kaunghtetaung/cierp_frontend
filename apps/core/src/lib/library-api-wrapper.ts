import { cache } from 'react';
import { getCachedServerHttpClient } from '@repo/api/server-only';
import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import type {
  DashboardSummary,
  CustomStatistics,
  StatisticsFilters
} from '@/types/library-dashboard';

/**
 * Library API wrapper functions (NOT server actions)
 * These are plain async functions that can be:
 * 1. Called directly from Server Components
 * 2. Wrapped in server actions for Client Components
 */

/**
 * Fetch dashboard summary data
 * Uses React.cache for request-level deduplication
 */
export const getDashboardSummaryData = cache(async (limit?: number): Promise<DashboardSummary> => {
  // Get headers and context (same as module-service pattern)
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore)
  ]);

  if (!user || !session) {
    throw new Error('Authentication required');
  }

  const tenantId = headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  // Get the HTTP client with the API domain
  const apiUrl = await getApiDomain();
  const httpClient = getCachedServerHttpClient(apiUrl);

  // Build endpoint with limit parameter
  const endpoint = limit
    ? `/library/bibliographies/dashboard/summary?limit=${limit}`
    : '/library/bibliographies/dashboard/summary';

  // Make the request using the HTTP client (same pattern as ModuleService)
  const response = await httpClient.request<DashboardSummary>(
    endpoint,
    {
      method: 'GET',
      tenantId,
      userSessionId: session.id,
      userId: user.userId || user.id,
      withAuth: true,
      tokenStrategy: 'auto',
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard summary');
  }

  return response.data;
});

/**
 * Fetch custom statistics with filters
 * Uses React.cache for request-level deduplication
 */
export const getCustomStatisticsData = cache(
  async (filters?: StatisticsFilters): Promise<CustomStatistics> => {
    // Get headers and context (same as module-service pattern)
    const headerStore = await headers();
    const [user, session] = await Promise.all([
      getCurrentUser(headerStore),
      getCurrentSession(headerStore)
    ]);

    if (!user || !session) {
      throw new Error('Authentication required');
    }

    const tenantId = headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
    if (!tenantId) {
      throw new Error('Tenant context required');
    }

    // Get the HTTP client with the API domain
    const apiUrl = await getApiDomain();
    const httpClient = getCachedServerHttpClient(apiUrl);

    // Build query parameters
    const params = new URLSearchParams();

    if (filters?.startYear) {
      params.append('startYear', filters.startYear.toString());
    }
    if (filters?.endYear) {
      params.append('endYear', filters.endYear.toString());
    }
    if (filters?.catalogType) {
      params.append('catalogType', filters.catalogType);
    }
    if (filters?.language) {
      params.append('language', filters.language);
    }
    if (filters?.subject) {
      params.append('subject', filters.subject);
    }
    if (filters?.publisher) {
      params.append('publisher', filters.publisher);
    }

    const endpoint = `/library/bibliographies/dashboard/statistics${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    // Make the request using the HTTP client (same pattern as ModuleService)
    const response = await httpClient.request<CustomStatistics>(endpoint, {
      method: 'GET',
      tenantId,
      userSessionId: session.id,
      userId: user.userId || user.id,
      withAuth: true,
      tokenStrategy: 'auto',
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch custom statistics');
    }

    return response.data;
  }
);
