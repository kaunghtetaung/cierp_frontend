'use server';

import { getDashboardSummaryData, getCustomStatisticsData } from '@/lib/library-api-wrapper';
import type {
  ActionResponse,
  DashboardSummary,
  CustomStatistics,
  StatisticsFilters,
} from '@/types/library-dashboard';

/**
 * Server action: Get Dashboard Summary
 * Fetches overall statistics and charts for the library dashboard
 * @param limit - Optional limit for the number of items to return in each category
 */
export async function getDashboardSummary(limit?: number): Promise<ActionResponse<DashboardSummary>> {
  try {
    const data = await getDashboardSummaryData(limit);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('[DASHBOARD_SUMMARY] Error fetching dashboard summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary'
    };
  }
}

/**
 * Server action: Get Custom Statistics
 * Fetches filtered statistics based on user-selected criteria
 */
export async function getCustomStatistics(
  filters?: StatisticsFilters
): Promise<ActionResponse<CustomStatistics>> {
  try {
    const data = await getCustomStatisticsData(filters);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('[CUSTOM_STATISTICS] Error fetching custom statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch custom statistics'
    };
  }
}
