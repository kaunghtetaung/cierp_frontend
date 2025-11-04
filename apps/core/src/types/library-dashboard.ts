/**
 * Dashboard Summary Response Types
 */
export interface DashboardSummary {
  totalBooks: number;
  totalCopies?: number;
  totalAuthors?: number;
  totalPublishers?: number;
  totalSubjects?: number;
  totalDegrees?: number;
  recentAdditions?: RecentAddition[];
  totalByYear?: TotalByYear[];
  totalByCatalogType?: TotalByCatalogType[];
  totalByPublisher?: TotalByPublisher[];
  totalBySubject?: TotalBySubject[];
  totalByAccessionGroup?: TotalByAccessionGroup[];
  totalByStatus?: TotalByStatus[];
  totalByMediaType?: TotalByMediaType[];
  totalByLanguage?: TotalByLanguage[];
  // Legacy field names for backward compatibility
  booksByYear?: BooksByYear[];
  booksByType?: BooksByType[];
  booksByLanguage?: BooksByLanguage[];
}

export interface RecentAddition {
  _id: string;
  title: string;
  author?: string | { id: string; name: string };
  publishedYear?: number;
  catalogType?: string | { id: string; name: string };
  addedAt: string;
  createdAt: string;
}

export interface TotalByYear {
  count: number;
  year: string | number;
}

export interface TotalByCatalogType {
  count: number;
  copyCount: number;
  catalogTypeId: string;
  catalogType: string;
}

export interface TotalByPublisher {
  count: number;
  copyCount: number;
  publisherId: string;
  publisher: string;
}

export interface TotalBySubject {
  count: number;
  copyCount: number;
  subjectId: string;
  subject: string;
}

export interface TotalByAccessionGroup {
  count: number;
  copyCount: number;
  accessionGroupId: string;
  accessionGroup: string;
  description?: string;
}

export interface TotalByStatus {
  count: number;
  status: string;
}

export interface TotalByMediaType {
  count: number;
  mediaType: string;
}

export interface TotalByLanguage {
  count: number;
  languageId?: string;
  language: string;
}

// Legacy interfaces for backward compatibility
export interface BooksByYear {
  _id: number;
  count: number;
}

export interface BooksByType {
  _id: string;
  count: number;
}

export interface BooksByLanguage {
  _id: string;
  count: number;
}

/**
 * Custom Statistics Response Types
 */
export interface CustomStatistics {
  totalBooks: number;
  booksByYear: BooksByYear[];
  booksByType: BooksByType[];
  booksByLanguage: BooksByLanguage[];
  booksBySubject: BooksBySubject[];
  booksByPublisher: BooksByPublisher[];
}

export interface BooksBySubject {
  _id: string;
  count: number;
}

export interface BooksByPublisher {
  _id: string;
  count: number;
}

/**
 * Filter options for custom statistics
 */
export interface StatisticsFilters {
  startYear?: number;
  endYear?: number;
  catalogType?: string;
  language?: string;
  subject?: string;
  publisher?: string;
}

/**
 * Action Response Type
 */
export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
