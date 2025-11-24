'use server';

import { getCurrentUser } from '@repo/auth/server';
import { getApiDomain } from '@repo/utils/server';
import { withServerActionErrorHandler } from '@repo/utils/server';
import { createHttpClient } from '@repo/api/client';

export interface BorrowerCardData {
  id: string;
  libraryCardNumber: string;
  status: 'active' | 'suspended' | 'blocked' | 'pending';
  borrowerGroup: string;
  borrowerType: 'student' | 'staff' | 'external';
  membershipStartDate: string;
  membershipEndDate: string;
  isMembershipValid: boolean;
  canBorrow: boolean;
  totalBorrowed: number;
  currentlyBorrowed: number;
  overdueCount: number;
  totalFines: number;
  unpaidFines: number;
  userId?: {
    _id: string;
    username: string;
    displayName: string;
    email: string;
  };
  studentRecordId?: {
    _id: string;
    nameMyanmar: string;
    nameEnglish: string;
    admissionNumber: string;
  };
  batchId?: {
    _id: string;
    name: string;
    code: string;
  };
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface BorrowerCardResponse {
  success: boolean;
  data?: BorrowerCardData;
  error?: string;
}

/**
 * Get current user's borrower card data
 * Requires user to be authenticated
 *
 * Backend endpoint: GET /library/borrowers/my-borrower
 * Requires x-user-id header with the user's ID
 */
export async function getMyBorrowerCard(): Promise<BorrowerCardResponse> {
  return withServerActionErrorHandler(async () => {
    // Get current authenticated user
    const user = await getCurrentUser();

    console.log('🎯 [BORROWER-CARD] getMyBorrowerCard called');
    console.log('   User:', user ? { id: user.id, email: user.email, name: user.displayName || user.username } : 'Not authenticated');

    if (!user || !user.id) {
      console.error('❌ [BORROWER-CARD] User not authenticated');
      return {
        success: false,
        error: 'You must be logged in to view your borrower card'
      };
    }

    // Get API domain
    const apiUrl = await getApiDomain();

    // Create HTTP client with base URL
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // Call the specific my-borrower endpoint with x-user-id header
    const endpoint = '/library/borrowers/my-borrower';

    console.log('📡 [BORROWER-CARD] Making request to:', `${apiUrl}${endpoint}`);
    console.log('   Headers: x-user-id =', user.id);

    try {
      const response = await httpClient.request<BorrowerCardData>(endpoint, {
        method: 'GET',
        userId: user.id, // This will be added as x-user-id header by the header builder
        withAuth: true,
        tokenStrategy: 'auto',
      });

      console.log('📥 [BORROWER-CARD] Response received:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      if (!response.success || !response.data) {
        console.error('❌ [BORROWER-CARD] API error:', response.error);
        return {
          success: false,
          error: response.error || 'No borrower card found for your account'
        };
      }

      console.log('✅ [BORROWER-CARD] Borrower card found:', {
        id: response.data.id,
        libraryCardNumber: response.data.libraryCardNumber,
        status: response.data.status
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [BORROWER-CARD] Error fetching borrower card:', error);
      throw error; // Re-throw to let the error handler deal with it
    }

  }, {
    operation: 'get-my-borrower-card',
    component: 'library-borrower-actions',
    metadata: { userId: (await getCurrentUser())?.id }
  });
}

/**
 * Get borrower card by library card number (for QR code scanning)
 */
export async function getBorrowerByCardNumber(cardNumber: string): Promise<BorrowerCardResponse> {
  return withServerActionErrorHandler(async () => {
    if (!cardNumber) {
      return {
        success: false,
        error: 'Library card number is required'
      };
    }

    // Fetch borrower data by library card number using the standard library wrapper
    const params = {
      page: 1,
      limit: 1,
      filters: {
        libraryCardNumber: cardNumber
      }
    };

    const response = await getLibraryModuleList<BorrowerCardData>('borrowers', params);

    if (!response.data || response.data.length === 0) {
      return {
        success: false,
        error: 'Borrower card not found'
      };
    }

    return {
      success: true,
      data: response.data[0]
    };

  }, {
    operation: 'get-borrower-by-card-number',
    component: 'library-borrower-actions',
    metadata: { cardNumber }
  });
}
