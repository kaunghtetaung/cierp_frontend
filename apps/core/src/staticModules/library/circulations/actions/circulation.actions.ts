/**
 * Library Circulation Server Actions
 * Next.js 15 Server Actions for form handling
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { CirculationService } from '../services/circulation.service';
import type { ApiResponse } from '@repo/types';
import type {
  CheckoutRequest,
  BulkCheckoutRequest,
  CheckinRequest,
  RenewRequest,
  CirculationResponse,
  BulkCheckoutResponse,
  PaginatedCirculationResponse,
  CirculationQueryParams,
} from '../types/circulation.types';

/**
 * Get circulation service instance with proper context
 */
async function getCirculationService(): Promise<CirculationService> {
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

  return new CirculationService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Checkout a single book
 * Server action for form submission
 */
export async function checkoutBook(
  data: CheckoutRequest
): Promise<ApiResponse<CirculationResponse> & { debugUrl?: string }> {
  try {
    // Validate required fields
    if (!data.libraryCardNumber) {
      return {
        success: false,
        error: 'Library card number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!data.accessionNo) {
      return {
        success: false,
        error: 'Accession number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    // Get service instance and call checkout
    const service = await getCirculationService();
    const debugUrl = service.getRequestUrl('checkout');
    const response = await service.checkout(data);

    return {
      ...response,
      debugUrl,
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to checkout book',
      message: 'Checkout failed',
      data: null as any,
      timestamp: new Date(),
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
    if (!data.libraryCardNumber) {
      return {
        success: false,
        error: 'Library card number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!data.accessionNos || data.accessionNos.length === 0) {
      return {
        success: false,
        error: 'At least one accession number is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    // Get service instance and call bulkCheckout
    const service = await getCirculationService();
    const response = await service.bulkCheckout(data);

    return response;
  } catch (error) {
    console.error('Bulk checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk checkout books',
      message: 'Bulk checkout failed',
      data: null as any,
      timestamp: new Date(),
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
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    // Get service instance and call checkin
    const service = await getCirculationService();
    const response = await service.checkin(data);

    return response;
  } catch (error) {
    console.error('Checkin error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to checkin book',
      message: 'Checkin failed',
      data: null as any,
      timestamp: new Date(),
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
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    // Get service instance and call renew
    const service = await getCirculationService();
    const response = await service.renew(data);

    return response;
  } catch (error) {
    console.error('Renewal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to renew book',
      message: 'Renewal failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get circulation history with filters
 * Server action for circulation history table
 */
export async function getCirculationHistory(
  params?: CirculationQueryParams
): Promise<ApiResponse<PaginatedCirculationResponse>> {
  try {
    const service = await getCirculationService();
    const response = await service.getCirculations(params);
    return response;
  } catch (error) {
    console.error('Get circulation history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch circulation history',
      message: 'Failed to fetch circulation history',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
