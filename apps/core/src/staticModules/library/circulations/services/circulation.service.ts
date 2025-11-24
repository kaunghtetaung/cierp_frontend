/**
 * Library Circulation Service
 * Handles all API calls to the circulation module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
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
// Backend URL structure: http://api-dev.tenant.com/library/circulation
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = library, module = circulation
const CIRCULATION_BASE = '/library/circulation';

/**
 * Circulation Service Class
 * Follows ModuleService pattern with proper request config
 */
export class CirculationService {
  private httpClient;
  private baseURL: string;
  private tenantId?: string;
  private userSessionId?: string;
  private userId?: string;

  constructor(
    baseURL: string,
    options?: {
      tenantId?: string;
      userSessionId?: string;
      userId?: string;
    }
  ) {
    this.baseURL = baseURL;
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
  }

  /**
   * Get the full URL for a circulation endpoint
   * @param action The action endpoint (e.g., 'checkout', 'checkin')
   * @returns Full URL string
   */
  getRequestUrl(action: string): string {
    return `${this.baseURL}${CIRCULATION_BASE}/${action}`;
  }

  /**
   * Checkout a single book
   * @param data Checkout request data
   * @returns Circulation record
   */
  async checkout(
    data: CheckoutRequest
  ): Promise<ApiResponse<CirculationResponse>> {
    const response = await this.httpClient.request<CirculationResponse>(
      `${CIRCULATION_BASE}/checkout`,
      {
        method: 'POST',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to checkout book');
    }

    return response;
  }

  /**
   * Bulk checkout multiple books for a single borrower
   * @param data Bulk checkout request data
   * @returns Bulk checkout results
   */
  async bulkCheckout(
    data: BulkCheckoutRequest
  ): Promise<ApiResponse<BulkCheckoutResponse>> {
    const response = await this.httpClient.request<BulkCheckoutResponse>(
      `${CIRCULATION_BASE}/checkout/bulk`,
      {
        method: 'POST',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to bulk checkout books');
    }

    return response;
  }

  /**
   * Checkin (return) a book
   * @param data Checkin request data
   * @returns Updated circulation record with fine calculation
   */
  async checkin(
    data: CheckinRequest
  ): Promise<ApiResponse<CirculationResponse>> {
    const response = await this.httpClient.request<CirculationResponse>(
      `${CIRCULATION_BASE}/checkin`,
      {
        method: 'POST',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to checkin book');
    }

    return response;
  }

  /**
   * Renew a checked-out book
   * @param data Renewal request data
   * @returns Updated circulation record with new due date
   */
  async renew(
    data: RenewRequest
  ): Promise<ApiResponse<CirculationResponse>> {
    const response = await this.httpClient.request<CirculationResponse>(
      `${CIRCULATION_BASE}/renew`,
      {
        method: 'POST',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to renew book');
    }

    return response;
  }

  /**
   * Get paginated list of circulation records with optional filters
   * @param params Query parameters for filtering and pagination
   * @returns Paginated circulation records
   */
  async getCirculations(
    params?: CirculationQueryParams
  ): Promise<ApiResponse<PaginatedCirculationResponse>> {
    // Build query string
    let endpoint = CIRCULATION_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.borrowerId) queryParams.set('borrowerId', params.borrowerId);
      if (params.accessionNo) queryParams.set('accessionNo', params.accessionNo);
      if (params.bibliographyId) queryParams.set('bibliographyId', params.bibliographyId);
      if (params.status) queryParams.set('status', params.status);
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);
      if (params.overdue !== undefined) queryParams.set('overdue', String(params.overdue));
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<PaginatedCirculationResponse>(
      endpoint,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
        timeout: 25000,
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch circulation records');
    }

    return response;
  }

  /**
   * Get a single circulation record by ID
   * @param id Circulation record ID
   * @returns Single circulation record
   */
  async getCirculationById(
    id: string
  ): Promise<ApiResponse<CirculationResponse>> {
    const response = await this.httpClient.request<CirculationResponse>(
      `${CIRCULATION_BASE}/${id}`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch circulation record');
    }

    return response;
  }

  /**
   * Get count of circulation records matching filters
   * @param params Query parameters for filtering
   * @returns Count of matching records
   */
  async getCirculationCount(
    params?: CirculationQueryParams
  ): Promise<ApiResponse<CirculationCountResponse>> {
    let endpoint = `${CIRCULATION_BASE}/count`;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.borrowerId) queryParams.set('borrowerId', params.borrowerId);
      if (params.accessionNo) queryParams.set('accessionNo', params.accessionNo);
      if (params.bibliographyId) queryParams.set('bibliographyId', params.bibliographyId);
      if (params.status) queryParams.set('status', params.status);
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);
      if (params.overdue !== undefined) queryParams.set('overdue', String(params.overdue));
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<CirculationCountResponse>(
      endpoint,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch circulation count');
    }

    return response;
  }

  /**
   * Update overdue status for all checked-out books (typically called by cron)
   * @returns Number of records updated
   */
  async updateOverdueStatus(): Promise<ApiResponse<UpdateOverdueStatusResponse>> {
    const response = await this.httpClient.request<UpdateOverdueStatusResponse>(
      `${CIRCULATION_BASE}/update-overdue-status`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update overdue status');
    }

    return response;
  }

  /**
   * Get active checkouts for a borrower
   * @param borrowerId Borrower ID
   * @returns Active circulation records
   */
  async getBorrowerActiveCheckouts(
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
  async getOverdueBooks(
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
