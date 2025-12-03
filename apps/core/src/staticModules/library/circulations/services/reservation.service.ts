/**
 * Library Reservation Service
 * Handles all API calls to the reservation module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Reservation,
  ReservationAvailability,
  ReservationStats,
  ReservationCheckResult,
  PaginatedReservationResponse,
  ReservationQueryParams,
  CreateReservationRequest,
  UpdateReservationStatusRequest,
  AssignCopyRequest,
  CancelReservationRequest,
  ExtendPickupDeadlineRequest,
  ReservationStatus,
} from '../types/reservation.types';

// Base endpoint for reservation API
const RESERVATION_BASE = '/library/reservations';

/**
 * Reservation Service Class
 * Follows ModuleService pattern with proper request config
 */
export class ReservationService {
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
   * Get the full URL for a reservation endpoint
   */
  getRequestUrl(action: string): string {
    return `${this.baseURL}${RESERVATION_BASE}/${action}`;
  }

  /**
   * Get all reservations with filters (admin)
   */
  async getReservations(
    params?: ReservationQueryParams
  ): Promise<ApiResponse<PaginatedReservationResponse>> {
    let endpoint = RESERVATION_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.borrowerId) queryParams.set('borrowerId', params.borrowerId);
      // Backend uses libraryCardNo (not libraryCardNumber)
      if (params.libraryCardNumber) queryParams.set('libraryCardNo', params.libraryCardNumber);
      if (params.bibliographyId) queryParams.set('bibliographyId', params.bibliographyId);
      if (params.accessionNo) queryParams.set('accessionNo', params.accessionNo);
      if (params.status) {
        if (Array.isArray(params.status)) {
          params.status.forEach(s => queryParams.append('status', s));
        } else {
          queryParams.set('status', params.status);
        }
      }
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);
      if (params.expiringWithinDays) queryParams.set('expiringWithinDays', String(params.expiringWithinDays));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<PaginatedReservationResponse>(
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
      throw new Error(response.error || 'Failed to fetch reservations');
    }

    return response;
  }

  /**
   * Get a single reservation by ID
   */
  async getReservationById(id: string): Promise<ApiResponse<Reservation>> {
    const response = await this.httpClient.request<Reservation>(
      `${RESERVATION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to fetch reservation');
    }

    return response;
  }

  /**
   * Create a new reservation (admin can create for any borrower)
   */
  async createReservation(
    data: CreateReservationRequest
  ): Promise<ApiResponse<Reservation>> {
    const response = await this.httpClient.request<Reservation>(
      RESERVATION_BASE,
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
      throw new Error(response.error || 'Failed to create reservation');
    }

    return response;
  }

  /**
   * Update reservation status (admin)
   */
  async updateReservationStatus(
    id: string,
    data: UpdateReservationStatusRequest
  ): Promise<ApiResponse<Reservation>> {
    const response = await this.httpClient.request<Reservation>(
      `${RESERVATION_BASE}/${id}/status`,
      {
        method: 'PATCH',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update reservation status');
    }

    return response;
  }

  /**
   * Assign a specific copy to a reservation
   */
  async assignCopyToReservation(
    id: string,
    data: AssignCopyRequest
  ): Promise<ApiResponse<Reservation>> {
    const response = await this.httpClient.request<Reservation>(
      `${RESERVATION_BASE}/${id}/assign-copy`,
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
      throw new Error(response.error || 'Failed to assign copy to reservation');
    }

    return response;
  }

  /**
   * Cancel a reservation (admin)
   */
  async cancelReservation(
    id: string,
    data: CancelReservationRequest
  ): Promise<ApiResponse<Reservation>> {
    const response = await this.httpClient.request<Reservation>(
      `${RESERVATION_BASE}/${id}/cancel`,
      {
        method: 'DELETE',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to cancel reservation');
    }

    return response;
  }

  /**
   * Extend pickup deadline for a ready reservation
   */
  async extendPickupDeadline(
    id: string,
    data: ExtendPickupDeadlineRequest
  ): Promise<ApiResponse<Reservation>> {
    const response = await this.httpClient.request<Reservation>(
      `${RESERVATION_BASE}/${id}/extend-deadline`,
      {
        method: 'PATCH',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to extend pickup deadline');
    }

    return response;
  }

  /**
   * Check reservation availability for a book
   */
  async checkAvailability(
    bibliographyId: string,
    libraryCardNumber?: string
  ): Promise<ApiResponse<ReservationAvailability>> {
    let endpoint = `${RESERVATION_BASE}/availability/${bibliographyId}`;
    if (libraryCardNumber) {
      endpoint += `?libraryCardNumber=${encodeURIComponent(libraryCardNumber)}`;
    }

    const response = await this.httpClient.request<ReservationAvailability>(
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
      throw new Error(response.error || 'Failed to check reservation availability');
    }

    return response;
  }

  /**
   * Get queue position for a specific reservation
   * Uses /:id/queue-position endpoint
   */
  async getQueuePosition(reservationId: string): Promise<ApiResponse<{ position: number; totalInQueue: number }>> {
    const response = await this.httpClient.request<{ position: number; totalInQueue: number }>(
      `${RESERVATION_BASE}/${reservationId}/queue-position`,
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
      throw new Error(response.error || 'Failed to fetch queue position');
    }

    return response;
  }

  /**
   * Get ready reservations (books available for pickup)
   * Uses /status/ready endpoint
   */
  async getReadyReservations(): Promise<ApiResponse<Reservation[]>> {
    const response = await this.httpClient.request<Reservation[]>(
      `${RESERVATION_BASE}/status/ready`,
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
      throw new Error(response.error || 'Failed to fetch ready reservations');
    }

    return response;
  }

  /**
   * Check if a book copy has an active reservation (for checkout flow)
   * Uses the main reservations endpoint with accessionNo filter
   */
  async checkReservationForAccession(accessionNo: string): Promise<ApiResponse<ReservationCheckResult>> {
    // Use the main endpoint with accessionNo filter to check for active reservations
    const response = await this.httpClient.request<PaginatedReservationResponse>(
      `${RESERVATION_BASE}?accessionNo=${encodeURIComponent(accessionNo)}&status=pending&status=ready`,
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
      throw new Error(response.error || 'Failed to check reservation for accession');
    }

    // Transform the response to ReservationCheckResult format
    const reservations = response.data?.data || [];
    const hasReservation = reservations.length > 0;
    const reservation = hasReservation ? reservations[0] : undefined;

    return {
      success: true,
      data: {
        hasReservation,
        reservation,
        canCheckout: !hasReservation,
      } as ReservationCheckResult,
      message: 'Reservation check completed',
      timestamp: new Date(),
    };
  }

  /**
   * Get borrower's ready reservations for desk checkout
   * Uses /my-reservations?libraryCardNumber=...&status=ready endpoint
   */
  async getBorrowerReadyReservations(libraryCardNumber: string): Promise<ApiResponse<PaginatedReservationResponse>> {
    const response = await this.httpClient.request<PaginatedReservationResponse>(
      `${RESERVATION_BASE}/my-reservations?libraryCardNumber=${encodeURIComponent(libraryCardNumber)}&status=ready`,
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
      throw new Error(response.error || 'Failed to fetch borrower reservations');
    }

    return response;
  }

  /**
   * Get all borrower's reservations (any status)
   * Uses /reservations?libraryCardNo=... endpoint
   */
  async getBorrowerReservations(libraryCardNumber: string, status?: ReservationStatus): Promise<ApiResponse<PaginatedReservationResponse>> {
    let endpoint = `${RESERVATION_BASE}?libraryCardNo=${encodeURIComponent(libraryCardNumber)}`;
    if (status) {
      endpoint += `&status=${status}`;
    }

    const response = await this.httpClient.request<PaginatedReservationResponse>(
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
      throw new Error(response.error || 'Failed to fetch borrower reservations');
    }

    return response;
  }

  /**
   * Get reservation statistics (dashboard)
   * Uses /stats/overview endpoint
   */
  async getReservationStats(): Promise<ApiResponse<ReservationStats>> {
    const response = await this.httpClient.request<ReservationStats>(
      `${RESERVATION_BASE}/stats/overview`,
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
      throw new Error(response.error || 'Failed to fetch reservation statistics');
    }

    return response;
  }

  /**
   * Mark reservation as ready (when book is returned and ready for pickup)
   */
  async markAsReady(
    id: string,
    accessionNo: string
  ): Promise<ApiResponse<Reservation>> {
    return this.updateReservationStatus(id, {
      status: 'ready' as any,
      accessionNo,
    });
  }

  /**
   * Get expiring reservations (ready but pickup deadline approaching)
   */
  async getExpiringReservations(
    withinDays: number = 2
  ): Promise<ApiResponse<PaginatedReservationResponse>> {
    return this.getReservations({
      status: 'ready' as any,
      expiringWithinDays: withinDays,
      sortBy: 'pickupDeadline',
      sortOrder: 'asc',
    });
  }
}
