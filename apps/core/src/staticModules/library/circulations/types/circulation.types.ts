/**
 * Library Circulation TypeScript Types
 * Based on backend API documentation
 */

// ============================================
// ENUMS
// ============================================

export enum CirculationStatus {
  CHECKED_OUT = 'checked_out',
  OVERDUE = 'overdue',
  CHECKED_IN = 'checked_in',
}

// ============================================
// REQUEST DTOs
// ============================================

export interface CheckoutRequest {
  libraryCardNumber: string;  // Library card number of borrower
  accessionNo: string;        // Unique book copy identifier
  notes?: string;             // Optional checkout notes
}

export interface BulkCheckoutRequest {
  libraryCardNumber: string;  // Library card number of borrower
  accessionNos: string[];     // Array of accession numbers (min: 1)
  notes?: string;             // Optional notes applied to all checkouts
}

export interface CheckinRequest {
  accessionNo: string;     // Book to return
  notes?: string;          // Optional checkin notes
}

export interface RenewRequest {
  accessionNo: string;     // Book to renew
  notes?: string;          // Optional renewal notes
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface CirculationQueryParams {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 10)
  borrowerId?: string;     // Filter by borrower
  accessionNo?: string;    // Filter by accession number
  bibliographyId?: string; // Filter by book
  status?: CirculationStatus;
  startDate?: string;      // ISO date - filter checkouts after this date
  endDate?: string;        // ISO date - filter checkouts before this date
  overdue?: boolean;       // Filter overdue books
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface BorrowerInfo {
  id: string;
  firstName: string;
  lastName: string;
  libraryCardNo: string;
}

export interface BibliographyInfo {
  id: string;
  title: string;
  author?: string;
}

export interface LendingPolicyInfo {
  id: string;
  name: string;
}

export interface CirculationResponse {
  id: string;
  borrowerId: string;
  borrowerName: string;            // Denormalized borrower name from backend
  accessionNo: string;
  bibliographyId: string;
  lendingPolicyId: string;
  status: CirculationStatus;
  checkoutDate: string;
  dueDate: string;
  checkinDate?: string;
  renewalCount: number;
  maxRenewals: number;
  overdueDays: number;
  fineAmount: number;              // In cents
  finePerDay: number;              // In cents
  gracePeriodDays: number;
  finePaid: boolean;
  finePaidDate?: string;
  invoiceId?: string;              // Invoice reference
  invoiceNo?: string;              // Human-readable invoice number
  invoiceIssued: boolean;          // Invoice generation flag
  organizationId: string;
  checkedOutBy?: string;
  checkedInBy?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  // Populated fields
  borrower?: BorrowerInfo;
  bibliography?: BibliographyInfo;
  lendingPolicy?: LendingPolicyInfo;
}

export interface PaginatedCirculationResponse {
  data: CirculationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkCheckoutItemResult {
  accessionNo: string;
  success: boolean;
  circulation?: CirculationResponse;
  error?: {
    message: string;
    code?: string;
  };
}

export interface BulkCheckoutResponse {
  total: number;
  successCount: number;
  failureCount: number;
  results: BulkCheckoutItemResult[];
  status: 'all_success' | 'partial_success' | 'all_failed';
}

export interface CirculationCountResponse {
  count: number;
}

export interface UpdateOverdueStatusResponse {
  updatedCount: number;
}

// ============================================
// ERROR CODES
// ============================================

export enum CirculationErrorCode {
  BORROWER_NOT_FOUND = 'BORROWER_NOT_FOUND',
  BORROWER_NOT_ACTIVE = 'BORROWER_NOT_ACTIVE',
  ALREADY_CHECKED_OUT = 'ALREADY_CHECKED_OUT',
  BOOK_NOT_FOUND = 'BOOK_NOT_FOUND',
  BOOK_COPY_NOT_FOUND = 'BOOK_COPY_NOT_FOUND',
  BOOK_NOT_AVAILABLE = 'BOOK_NOT_AVAILABLE',
  BORROWING_LIMIT_EXCEEDED = 'BORROWING_LIMIT_EXCEEDED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NO_ACTIVE_CHECKOUT = 'NO_ACTIVE_CHECKOUT',
  MAX_RENEWALS_REACHED = 'MAX_RENEWALS_REACHED',
}

// ============================================
// UI STATE TYPES
// ============================================

export interface CheckoutFormState {
  libraryCardNumber: string;
  accessionNo: string;
  notes: string;
  isLoading: boolean;
  error: string | null;
}

export interface BulkCheckoutFormState {
  libraryCardNumber: string;
  accessionNos: string[];
  currentInput: string;
  notes: string;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// HELPER TYPES
// ============================================

export interface BookValidationResult {
  valid: boolean;
  book?: BibliographyInfo;
  error?: string;
}

export interface BorrowerValidationResult {
  valid: boolean;
  borrower?: BorrowerInfo;
  activeCheckouts?: number;
  maxCheckouts?: number;
  error?: string;
}
