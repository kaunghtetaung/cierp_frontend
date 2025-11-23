/**
 * Library Circulation Service
 * Handles all API calls to the circulation module
 * Uses HttpClient from @repo/api following project standards
 */

import { httpClient } from '@repo/api/client';
import type { ApiResponse } from '@repo/types';
import type {
  CheckoutRequest,
  BulkCheckoutRequest,
  CheckinRequest,
  RenewRequest,
  CirculationResponse,
  BulkCheckoutResponse,
  PaginatedCirculationResponse,
  CirculationCountResponse,
  UpdateOverdueStatusResponse,
  CirculationQueryParams,
} from '../types/circulation.types';

// Base endpoint for circulation API
const CIRCULATION_BASE = '/core/library/circulation';

/**
 * Circulation Service Class
 * Follows project patterns with HttpClient and proper error handling
 */
export class CirculationService {
  /**
   * Checkout a single book
   * @param data Checkout request data
   * @returns Circulation record
   */
  static async checkout(
    data: CheckoutRequest
  ): Promise<ApiResponse<CirculationResponse>> {
    return httpClient.post<CirculationResponse>(
      `${CIRCULATION_BASE}/checkout`,
      data
    );
  }

  /**
   * Bulk checkout multiple books for a single borrower
   * @param data Bulk checkout request data
   * @returns Bulk checkout results
   */
  static async bulkCheckout(
    data: BulkCheckoutRequest
  ): Promise<ApiResponse<BulkCheckoutResponse>> {
    return httpClient.post<BulkCheckoutResponse>(
      `${CIRCULATION_BASE}/checkout/bulk`,
      data
    );
  }

  /**
   * Checkin (return) a book
   * @param data Checkin request data
   * @returns Updated circulation record with fine calculation
   */
  static async checkin(
    data: CheckinRequest
  ): Promise<ApiResponse<CirculationResponse>> {
    return httpClient.post<CirculationResponse>(
      `${CIRCULATION_BASE}/checkin`,
      data
    );
  }

  /**
   * Renew a checked-out book
   * @param data Renewal request data
   * @returns Updated circulation record with new due date
   */
  static async renew(
    data: RenewRequest
  ): Promise<ApiResponse<CirculationResponse>> {
    return httpClient.post<CirculationResponse>(
      `${CIRCULATION_BASE}/renew`,
      data
    );
  }

  /**
   * Get paginated list of circulation records with optional filters
   * @param params Query parameters for filtering and pagination
   * @returns Paginated circulation records
   */
  static async getCirculations(
    params?: CirculationQueryParams
  ): Promise<ApiResponse<PaginatedCirculationResponse>> {
    // Convert params to query string format
    const queryParams: Record<string, string | number | boolean> = {};

    if (params) {
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.borrowerId) queryParams.borrowerId = params.borrowerId;
      if (params.accessionNo) queryParams.accessionNo = params.accessionNo;
      if (params.bibliographyId) queryParams.bibliographyId = params.bibliographyId;
      if (params.status) queryParams.status = params.status;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.overdue !== undefined) queryParams.overdue = params.overdue;
    }

    return httpClient.get<PaginatedCirculationResponse>(
      CIRCULATION_BASE,
      queryParams
    );
  }

  /**
   * Get a single circulation record by ID
   * @param id Circulation record ID
   * @returns Single circulation record
   */
  static async getCirculationById(
    id: string
  ): Promise<ApiResponse<CirculationResponse>> {
    return httpClient.get<CirculationResponse>(
      `${CIRCULATION_BASE}/${id}`
    );
  }

  /**
   * Get count of circulation records matching filters
   * @param params Query parameters for filtering
   * @returns Count of matching records
   */
  static async getCirculationCount(
    params?: CirculationQueryParams
  ): Promise<ApiResponse<CirculationCountResponse>> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params) {
      if (params.borrowerId) queryParams.borrowerId = params.borrowerId;
      if (params.accessionNo) queryParams.accessionNo = params.accessionNo;
      if (params.bibliographyId) queryParams.bibliographyId = params.bibliographyId;
      if (params.status) queryParams.status = params.status;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.overdue !== undefined) queryParams.overdue = params.overdue;
    }

    return httpClient.get<CirculationCountResponse>(
      `${CIRCULATION_BASE}/count`,
      queryParams
    );
  }

  /**
   * Update overdue status for all checked-out books (typically called by cron)
   * @returns Number of records updated
   */
  static async updateOverdueStatus(): Promise<ApiResponse<UpdateOverdueStatusResponse>> {
    return httpClient.post<UpdateOverdueStatusResponse>(
      `${CIRCULATION_BASE}/update-overdue-status`
    );
  }

  /**
   * Get active checkouts for a borrower
   * @param borrowerId Borrower ID
   * @returns Active circulation records
   */
  static async getBorrowerActiveCheckouts(
    borrowerId: string
  ): Promise<ApiResponse<PaginatedCirculationResponse>> {
    return this.getCirculations({
      borrowerId,
      status: 'checked_out' as any,
      page: 1,
      limit: 100,
    });
  }

  /**
   * Get overdue books
   * @param page Page number
   * @param limit Items per page
   * @returns Overdue circulation records
   */
  static async getOverdueBooks(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedCirculationResponse>> {
    return this.getCirculations({
      overdue: true,
      page,
      limit,
    });
  }
}

// Export singleton instance for convenience
export const circulationService = CirculationService;
