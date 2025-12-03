/**
 * Library Reservation Server Actions
 * Next.js 15 Server Actions for admin reservation management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { ReservationService } from '../services/reservation.service';
import type { ApiResponse } from '@repo/types';
import {
  ReservationStatus,
  type Reservation,
  type ReservationAvailability,
  type ReservationStats,
  type ReservationCheckResult,
  type PaginatedReservationResponse,
  type BorrowerReservationSummary,
  type ReservationQueryParams,
  type CreateReservationRequest,
  type UpdateReservationStatusRequest,
} from '../types/reservation.types';

/**
 * Get reservation service instance with proper context
 */
async function getReservationService(): Promise<ReservationService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);

  if (!user || !session) {
    throw new Error('Authentication required');
  }

  const tenantId = headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const apiUrl = await getApiDomain();

  return new ReservationService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Get all reservations with filters
 */
export async function getReservations(
  params?: ReservationQueryParams
): Promise<ApiResponse<PaginatedReservationResponse>> {
  try {
    const service = await getReservationService();
    return await service.getReservations(params);
  } catch (error) {
    console.error('Get reservations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reservations',
      message: 'Failed to fetch reservations',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get a single reservation by ID
 */
export async function getReservationById(
  id: string
): Promise<ApiResponse<Reservation>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Reservation ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.getReservationById(id);
  } catch (error) {
    console.error('Get reservation by ID error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reservation',
      message: 'Failed to fetch reservation',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Create a new reservation (admin can create for any borrower)
 */
export async function createReservation(
  data: CreateReservationRequest
): Promise<ApiResponse<Reservation>> {
  try {
    if (!data.libraryCardNumber) {
      return {
        success: false,
        error: 'Library card number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!data.bibliographyId) {
      return {
        success: false,
        error: 'Book/Bibliography ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.createReservation(data);
  } catch (error) {
    console.error('Create reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reservation',
      message: 'Failed to create reservation',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(
  id: string,
  data: UpdateReservationStatusRequest
): Promise<ApiResponse<Reservation>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Reservation ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!data.status) {
      return {
        success: false,
        error: 'Status is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.updateReservationStatus(id, data);
  } catch (error) {
    console.error('Update reservation status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reservation status',
      message: 'Failed to update reservation status',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Mark reservation as ready for pickup
 */
export async function markReservationAsReady(
  id: string,
  accessionNo: string
): Promise<ApiResponse<Reservation>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Reservation ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!accessionNo) {
      return {
        success: false,
        error: 'Accession number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.markAsReady(id, accessionNo);
  } catch (error) {
    console.error('Mark reservation as ready error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark reservation as ready',
      message: 'Failed to mark reservation as ready',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Assign a specific copy to a reservation
 */
export async function assignCopyToReservation(
  id: string,
  accessionNo: string,
  notes?: string
): Promise<ApiResponse<Reservation>> {
  try {
    if (!id || !accessionNo) {
      return {
        success: false,
        error: 'Reservation ID and accession number are required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.assignCopyToReservation(id, { accessionNo, notes });
  } catch (error) {
    console.error('Assign copy to reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign copy to reservation',
      message: 'Failed to assign copy to reservation',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Cancel a reservation (admin)
 */
export async function cancelReservation(
  id: string,
  reason: string
): Promise<ApiResponse<Reservation>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Reservation ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!reason) {
      return {
        success: false,
        error: 'Cancellation reason is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.cancelReservation(id, { reason, cancelledBy: 'staff' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel reservation',
      message: 'Failed to cancel reservation',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Extend pickup deadline
 */
export async function extendPickupDeadline(
  id: string,
  newDeadline: string,
  notes?: string
): Promise<ApiResponse<Reservation>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Reservation ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!newDeadline) {
      return {
        success: false,
        error: 'New deadline is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.extendPickupDeadline(id, { newDeadline, notes });
  } catch (error) {
    console.error('Extend pickup deadline error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extend pickup deadline',
      message: 'Failed to extend pickup deadline',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Check reservation availability for a book
 */
export async function checkReservationAvailability(
  bibliographyId: string,
  libraryCardNumber?: string
): Promise<ApiResponse<ReservationAvailability>> {
  try {
    if (!bibliographyId) {
      return {
        success: false,
        error: 'Bibliography ID is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.checkAvailability(bibliographyId, libraryCardNumber);
  } catch (error) {
    console.error('Check reservation availability error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check availability',
      message: 'Failed to check availability',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Check if accession has active reservation (for checkout flow)
 */
export async function checkReservationForAccession(
  accessionNo: string
): Promise<ApiResponse<ReservationCheckResult>> {
  try {
    if (!accessionNo) {
      return {
        success: false,
        error: 'Accession number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();
    return await service.checkReservationForAccession(accessionNo);
  } catch (error) {
    console.error('Check reservation for accession error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check reservation',
      message: 'Failed to check reservation',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get borrower's reservation summary (for checkout flow)
 * Transforms PaginatedReservationResponse to BorrowerReservationSummary
 */
export async function getBorrowerReservations(
  libraryCardNumber: string
): Promise<ApiResponse<BorrowerReservationSummary>> {
  try {
    if (!libraryCardNumber) {
      return {
        success: false,
        error: 'Library card number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getReservationService();

    // Get all reservations for this borrower
    const response = await service.getBorrowerReservations(libraryCardNumber);

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch reservations',
        message: 'Failed to fetch borrower reservations',
        data: null as any,
        timestamp: new Date(),
      };
    }

    // Transform PaginatedReservationResponse to BorrowerReservationSummary
    const reservations = response.data.data || [];
    const readyReservations = reservations.filter(r => r.status === ReservationStatus.READY);
    const pendingReservations = reservations.filter(r => r.status === ReservationStatus.PENDING);

    // Get borrower info from first reservation if available
    const firstReservation = reservations[0];
    const borrowerSummary = firstReservation?.borrower || {
      id: '',
      firstName: '',
      lastName: '',
      libraryCardNumber: libraryCardNumber,
    };

    const summary: BorrowerReservationSummary = {
      borrower: borrowerSummary,
      activeReservations: reservations,
      readyForPickup: readyReservations,
      pendingCount: pendingReservations.length,
      readyCount: readyReservations.length,
    };

    return {
      success: true,
      data: summary,
      message: 'Reservations fetched successfully',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Get borrower reservations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch borrower reservations',
      message: 'Failed to fetch borrower reservations',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get reservation statistics
 */
export async function getReservationStats(): Promise<ApiResponse<ReservationStats>> {
  try {
    const service = await getReservationService();
    return await service.getReservationStats();
  } catch (error) {
    console.error('Get reservation stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reservation statistics',
      message: 'Failed to fetch reservation statistics',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get expiring reservations (ready but pickup deadline approaching)
 */
export async function getExpiringReservations(
  withinDays: number = 2
): Promise<ApiResponse<PaginatedReservationResponse>> {
  try {
    const service = await getReservationService();
    return await service.getExpiringReservations(withinDays);
  } catch (error) {
    console.error('Get expiring reservations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch expiring reservations',
      message: 'Failed to fetch expiring reservations',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
