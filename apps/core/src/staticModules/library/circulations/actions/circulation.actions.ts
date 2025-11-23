/**
 * Library Circulation Server Actions
 * Next.js 15 Server Actions for form handling
 */

'use server';

import { circulationService } from '../services/circulation.service';
import type { ApiResponse } from '@repo/types';
import type {
  CheckoutRequest,
  BulkCheckoutRequest,
  CheckinRequest,
  RenewRequest,
  CirculationResponse,
  BulkCheckoutResponse,
} from '../types/circulation.types';

/**
 * Checkout a single book
 * Server action for form submission
 */
export async function checkoutBook(
  data: CheckoutRequest
): Promise<ApiResponse<CirculationResponse>> {
  try {
    // Validate required fields
    if (!data.borrowerId) {
      return {
        success: false,
        error: 'Borrower ID is required',
        data: null,
      };
    }

    if (!data.accessionNo) {
      return {
        success: false,
        error: 'Accession number is required',
        data: null,
      };
    }

    // Call service
    const response = await circulationService.checkout(data);

    return response;
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to checkout book',
      data: null,
    };
  }
}

/**
 * Bulk checkout multiple books
 * Server action for bulk checkout form
 */
export async function bulkCheckoutBooks(
  data: BulkCheckoutRequest
): Promise<ApiResponse<BulkCheckoutResponse>> {
  try {
    // Validate required fields
    if (!data.borrowerId) {
      return {
        success: false,
        error: 'Borrower ID is required',
        data: null,
      };
    }

    if (!data.accessionNos || data.accessionNos.length === 0) {
      return {
        success: false,
        error: 'At least one accession number is required',
        data: null,
      };
    }

    // Call service
    const response = await circulationService.bulkCheckout(data);

    return response;
  } catch (error) {
    console.error('Bulk checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk checkout books',
      data: null,
    };
  }
}

/**
 * Checkin (return) a book
 * Server action for checkin form
 */
export async function checkinBook(
  data: CheckinRequest
): Promise<ApiResponse<CirculationResponse>> {
  try {
    // Validate required fields
    if (!data.accessionNo) {
      return {
        success: false,
        error: 'Accession number is required',
        data: null,
      };
    }

    // Call service
    const response = await circulationService.checkin(data);

    return response;
  } catch (error) {
    console.error('Checkin error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to checkin book',
      data: null,
    };
  }
}

/**
 * Renew a book
 * Server action for renewal form
 */
export async function renewBook(
  data: RenewRequest
): Promise<ApiResponse<CirculationResponse>> {
  try {
    // Validate required fields
    if (!data.accessionNo) {
      return {
        success: false,
        error: 'Accession number is required',
        data: null,
      };
    }

    // Call service
    const response = await circulationService.renew(data);

    return response;
  } catch (error) {
    console.error('Renewal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to renew book',
      data: null,
    };
  }
}
