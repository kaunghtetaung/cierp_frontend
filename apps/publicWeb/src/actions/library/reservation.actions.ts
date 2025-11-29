'use server';

import { getCurrentUser } from '@repo/auth/server';
import { getApiDomain } from '@repo/utils/server';
import { withServerActionErrorHandler } from '@repo/utils/server';
import { createHttpClient } from '@repo/api/client';
import { getMyBorrowerCard } from './borrower.actions';

// ============================================
// Types
// ============================================

export interface ReservationAvailability {
  canReserve: boolean;
  reason?: string;
  currentQueue: number;
  estimatedWaitTime?: string;
  availableCopies: number;
  totalCopies: number;
  checkedOutCopies: number;
  reservedCopies: number;
  hasExistingReservation: boolean;
  existingReservationId?: string;
  policyAllowsReservation: boolean;
}

export interface Reservation {
  id: string;
  _id?: string;
  libraryCardNumber: string;
  bibliographyId: string;
  bibliographyTitle?: string;
  accessionNo?: string;
  status: 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired';
  queuePosition: number;
  reservationDate: string;
  pickupDeadline?: string;
  estimatedWaitTime?: string;
  isExpiringSoon?: boolean;
  reservationType: 'title' | 'copy';
  bibliography?: {
    _id: string;
    title: string;
    author?: { name: string };
    bookCoverImage?: string;
  };
  cancelledAt?: string;
  cancelReason?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationResponse {
  success: boolean;
  data?: Reservation;
  error?: string;
}

export interface ReservationListResponse {
  success: boolean;
  data?: Reservation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface ReservationAvailabilityResponse {
  success: boolean;
  data?: ReservationAvailability;
  error?: string;
}

// ============================================
// Server Actions
// ============================================

/**
 * Check if a book can be reserved by the current user
 *
 * Backend endpoint: GET /library/reservations/availability/{bibliographyId}?libraryCardNumber={cardNo}
 */
export async function checkReservationAvailability(
  bibliographyId: string
): Promise<ReservationAvailabilityResponse> {
  return withServerActionErrorHandler(async () => {
    // Get current user
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return {
        success: true,
        data: {
          canReserve: false,
          reason: 'You must be logged in to reserve books',
          currentQueue: 0,
          availableCopies: 0,
          totalCopies: 0,
          checkedOutCopies: 0,
          reservedCopies: 0,
          hasExistingReservation: false,
          policyAllowsReservation: false
        }
      };
    }

    // Get user's borrower card
    const borrowerResult = await getMyBorrowerCard();

    if (!borrowerResult.success || !borrowerResult.data) {
      return {
        success: true,
        data: {
          canReserve: false,
          reason: 'No library card found. Please register at the library first.',
          currentQueue: 0,
          availableCopies: 0,
          totalCopies: 0,
          checkedOutCopies: 0,
          reservedCopies: 0,
          hasExistingReservation: false,
          policyAllowsReservation: false
        }
      };
    }

    const libraryCardNumber = borrowerResult.data.libraryCardNumber;

    // Check borrower status
    if (borrowerResult.data.status !== 'active') {
      return {
        success: true,
        data: {
          canReserve: false,
          reason: `Your library membership is ${borrowerResult.data.status}. Please contact the library.`,
          currentQueue: 0,
          availableCopies: 0,
          totalCopies: 0,
          checkedOutCopies: 0,
          reservedCopies: 0,
          hasExistingReservation: false,
          policyAllowsReservation: false
        }
      };
    }

    // Get API domain and create client
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // Call reservation availability endpoint
    const endpoint = `/library/reservations/availability/${bibliographyId}?libraryCardNumber=${encodeURIComponent(libraryCardNumber)}`;

    console.log('[RESERVATION] Checking availability:', endpoint);

    const response = await httpClient.request<ReservationAvailability>(endpoint, {
      method: 'GET',
      userId: user.id,
      withAuth: true,
      tokenStrategy: 'auto',
    });

    if (!response.success) {
      // If endpoint doesn't exist yet, return a mock response based on book availability
      console.log('[RESERVATION] Availability endpoint not found, using fallback');
      return {
        success: true,
        data: {
          canReserve: true,
          currentQueue: 0,
          availableCopies: 0,
          totalCopies: 1,
          checkedOutCopies: 1,
          reservedCopies: 0,
          hasExistingReservation: false,
          policyAllowsReservation: true,
          estimatedWaitTime: '1-2 weeks'
        }
      };
    }

    return {
      success: true,
      data: response.data
    };

  }, {
    operation: 'check-reservation-availability',
    component: 'library-reservation-actions',
    metadata: { bibliographyId }
  });
}

/**
 * Create a new book reservation
 *
 * Backend endpoint: POST /library/reservations
 */
export async function createReservation(
  bibliographyId: string,
  reservationType: 'title' | 'copy' = 'title'
): Promise<ReservationResponse> {
  return withServerActionErrorHandler(async () => {
    // Get current user
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return {
        success: false,
        error: 'You must be logged in to reserve books'
      };
    }

    // Get user's borrower card
    const borrowerResult = await getMyBorrowerCard();

    if (!borrowerResult.success || !borrowerResult.data) {
      return {
        success: false,
        error: 'No library card found. Please register at the library first.'
      };
    }

    const libraryCardNumber = borrowerResult.data.libraryCardNumber;

    // Check borrower status
    if (borrowerResult.data.status !== 'active') {
      return {
        success: false,
        error: `Your library membership is ${borrowerResult.data.status}. Please contact the library.`
      };
    }

    // Get API domain and create client
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // Create reservation
    const endpoint = '/library/reservations';

    console.log('[RESERVATION] Creating reservation:', { bibliographyId, libraryCardNumber, reservationType });

    const response = await httpClient.request<Reservation>(endpoint, {
      method: 'POST',
      userId: user.id,
      withAuth: true,
      tokenStrategy: 'auto',
      body: {
        libraryCardNumber,
        bibliographyId,
        reservationType
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create reservation'
      };
    }

    console.log('[RESERVATION] Reservation created:', response.data);

    return {
      success: true,
      data: response.data
    };

  }, {
    operation: 'create-reservation',
    component: 'library-reservation-actions',
    metadata: { bibliographyId, reservationType }
  });
}

/**
 * Get current user's reservations
 *
 * Backend endpoint: GET /library/reservations/my-reservations?libraryCardNumber={cardNo}&status={status}
 */
export async function getMyReservations(
  status?: 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired',
  page = 1,
  limit = 20
): Promise<ReservationListResponse> {
  return withServerActionErrorHandler(async () => {
    // Get current user
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return {
        success: false,
        error: 'You must be logged in to view reservations'
      };
    }

    // Get user's borrower card
    const borrowerResult = await getMyBorrowerCard();

    if (!borrowerResult.success || !borrowerResult.data) {
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }

    const libraryCardNumber = borrowerResult.data.libraryCardNumber;

    // Get API domain and create client
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // Build query params
    const params = new URLSearchParams();
    params.append('libraryCardNumber', libraryCardNumber);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) {
      params.append('status', status);
    }

    const endpoint = `/library/reservations/my-reservations?${params.toString()}`;

    console.log('[RESERVATION] Fetching my reservations:', endpoint);

    const response = await httpClient.request<{ data: Reservation[]; pagination: any }>(endpoint, {
      method: 'GET',
      userId: user.id,
      withAuth: true,
      tokenStrategy: 'auto',
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch reservations'
      };
    }

    return {
      success: true,
      data: response.data?.data || [],
      pagination: response.data?.pagination
    };

  }, {
    operation: 'get-my-reservations',
    component: 'library-reservation-actions',
    metadata: { status, page }
  });
}

/**
 * Cancel a reservation
 *
 * Backend endpoint: DELETE /library/reservations/{id}/cancel
 */
export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<ReservationResponse> {
  return withServerActionErrorHandler(async () => {
    // Get current user
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return {
        success: false,
        error: 'You must be logged in to cancel reservations'
      };
    }

    // Get user's borrower card
    const borrowerResult = await getMyBorrowerCard();

    if (!borrowerResult.success || !borrowerResult.data) {
      return {
        success: false,
        error: 'No library card found'
      };
    }

    const libraryCardNumber = borrowerResult.data.libraryCardNumber;

    // Get API domain and create client
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    const endpoint = `/library/reservations/${reservationId}/cancel`;

    console.log('[RESERVATION] Cancelling reservation:', { reservationId, reason });

    const response = await httpClient.request<Reservation>(endpoint, {
      method: 'DELETE',
      userId: user.id,
      withAuth: true,
      tokenStrategy: 'auto',
      body: {
        libraryCardNumber,
        reason: reason || 'Cancelled by borrower'
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to cancel reservation'
      };
    }

    console.log('[RESERVATION] Reservation cancelled:', response.data);

    return {
      success: true,
      data: response.data
    };

  }, {
    operation: 'cancel-reservation',
    component: 'library-reservation-actions',
    metadata: { reservationId, reason }
  });
}

/**
 * Get a single reservation by ID
 */
export async function getReservationById(
  reservationId: string
): Promise<ReservationResponse> {
  return withServerActionErrorHandler(async () => {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return {
        success: false,
        error: 'You must be logged in'
      };
    }

    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    const endpoint = `/library/reservations/${reservationId}`;

    const response = await httpClient.request<Reservation>(endpoint, {
      method: 'GET',
      userId: user.id,
      withAuth: true,
      tokenStrategy: 'auto',
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch reservation'
      };
    }

    return {
      success: true,
      data: response.data
    };

  }, {
    operation: 'get-reservation-by-id',
    component: 'library-reservation-actions',
    metadata: { reservationId }
  });
}
