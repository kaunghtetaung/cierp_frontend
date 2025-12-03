/**
 * Library Reservation TypeScript Types
 * Admin/Staff reservation management types
 */

// ============================================
// ENUMS
// ============================================

export enum ReservationStatus {
  PENDING = 'pending',
  READY = 'ready',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum ReservationType {
  TITLE = 'title',  // Any copy of the title
  COPY = 'copy',    // Specific copy
}

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateReservationRequest {
  libraryCardNumber: string;
  bibliographyId: string;
  accessionNo?: string;        // For specific copy reservation
  reservationType: ReservationType;
  notes?: string;
}

export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
  accessionNo?: string;        // When assigning a copy
  notes?: string;
}

export interface AssignCopyRequest {
  accessionNo: string;
  notes?: string;
}

export interface CancelReservationRequest {
  reason: string;
  cancelledBy?: 'staff' | 'borrower' | 'system';
}

export interface ExtendPickupDeadlineRequest {
  newDeadline: string;  // ISO date string
  notes?: string;
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface ReservationQueryParams {
  page?: number;
  limit?: number;
  status?: ReservationStatus | ReservationStatus[];
  borrowerId?: string;
  libraryCardNumber?: string;
  bibliographyId?: string;
  accessionNo?: string;
  startDate?: string;          // Reservation date from
  endDate?: string;            // Reservation date to
  expiringWithinDays?: number; // Ready reservations expiring within N days
  sortBy?: 'reservationDate' | 'queuePosition' | 'pickupDeadline' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface BorrowerSummary {
  id: string;
  firstName: string;
  lastName: string;
  libraryCardNumber: string;
  email?: string;
  phone?: string;
  borrowerType?: string;
  borrowerGroup?: string;
}

export interface BibliographySummary {
  id: string;
  title: string;
  author?: {
    id: string;
    name: string;
  };
  isbn?: string;
  callNumber?: string;
  coverImage?: string;
}

export interface BookCopySummary {
  id: string;
  accessionNo: string;
  status: string;
  location?: string;
  condition?: string;
}

export interface Reservation {
  id: string;
  borrowerId: string;
  libraryCardNumber: string;  // Stored directly for easy lookup
  bibliographyId: string;
  accessionNo?: string;
  reservationType: ReservationType;
  status: ReservationStatus;
  queuePosition: number;
  reservationDate: string;
  readyDate?: string;
  pickupDeadline?: string;
  fulfilledDate?: string;
  cancelledDate?: string;
  cancellationReason?: string;
  cancelledBy?: 'staff' | 'borrower' | 'system';
  expiryDate?: string;
  estimatedWaitTime?: string;
  notes?: string;
  notificationSent?: boolean;
  notificationSentAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  borrower?: BorrowerSummary;
  bibliography?: BibliographySummary;
  bookCopy?: BookCopySummary;
}

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
  maxReservationsPerBorrower?: number;
  currentReservationCount?: number;
}

export interface ReservationQueue {
  bibliographyId: string;
  bibliography: BibliographySummary;
  totalInQueue: number;
  availableCopies: number;
  totalCopies: number;
  reservations: Reservation[];
}

export interface PaginatedReservationResponse {
  data: Reservation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReservationCheckResult {
  hasReservation: boolean;
  reservation?: Reservation;
  isForCurrentBorrower?: boolean;
  conflictMessage?: string;
}

export interface ReservationStats {
  totalPending: number;
  totalReady: number;
  expiringToday: number;
  expiringSoon: number;  // Within 2 days
  averageWaitDays: number;
  fulfillmentRate: number;  // Percentage
}

// ============================================
// UI STATE TYPES
// ============================================

export interface ReservationFilters {
  status: ReservationStatus | 'all';
  searchQuery: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  expiringOnly: boolean;
}

export interface ReservationListState {
  reservations: Reservation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ReservationFilters;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// ALERT/NOTIFICATION TYPES
// ============================================

export interface ReservationAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  reservation?: Reservation;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

export interface BorrowerReservationSummary {
  borrower: BorrowerSummary;
  activeReservations: Reservation[];
  readyForPickup: Reservation[];
  pendingCount: number;
  readyCount: number;
}
