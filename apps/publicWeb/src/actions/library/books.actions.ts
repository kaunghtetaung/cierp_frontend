'use server';

import { getLibraryModuleList } from "@/lib/library-module-wrapper";
import { withServerActionErrorHandler } from "@repo/utils/server";

// Types for library data
export interface Author {
  _id: string;
  id?: string;
  name?: string;         // API returns 'name' field
  fullName?: string;     // Some APIs might use 'fullName'
  firstName?: string;
  lastName?: string;
}

export interface Publisher {
  _id: string;
  name: string;
  country?: string;
  city?: string;
}

export interface CatalogType {
  _id: string;
  name: string;
  description?: string;
}

export interface Subject {
  id: string;
  name: string;
  _id?: string;  // Optional: present in list response, missing in by-ID response
}

export interface Degree {
  id: string;
  name: string;
  _id?: string;  // Optional: present in list response, missing in by-ID response
}

export interface Organization {
  _id: string;
  fullName: string;
  shortName: string;
  description?: string;
  displayName?: {
    en: string;
    mm: string;
  };
  status?: string;      // Added: present in by-ID response
  lat?: number | null;  // Added: present in by-ID response
  lng?: number | null;  // Added: present in by-ID response
}

export interface Bibliography {
  _id: string;
  legacyBookId?: string;
  title: string;
  author?: Author;
  publisher?: Publisher;
  catalogType?: CatalogType;
  year?: string;
  isbn?: string;
  callNo?: string;
  status: string;
  bookCoverImage?: string;
  description?: string;
  abstract?: boolean;
  content?: boolean;
  abstractFile?: string;
  contentFile?: string;
  ebookFile?: string; // Private S3 path for eBook (e.g., "/private/library/common/ebook/id.pdf")
  subjects?: Subject[];
  degrees?: Degree[];
  editors?: any[];
  additionalAuthors?: any[];
  accessionNumbers?: any[];
  bookCopyCount?: number;
  varyingTitles?: string[];
  corporateAuthors?: any[];
  organizationId?: Organization;
  slug?: string;
  remark?: string;
  version?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SearchType = 'exact' | 'contains';

/**
 * Search books using general search query
 * Searches across multiple fields: title, note, isbn, issn, callNo, year
 * Example: GET /library/bibliographies?search=medical&searchType=contains&catalogType.name=Thesis&page=1&limit=20
 */
export async function searchBooks(
  query?: string,
  page = 1,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  searchType: SearchType = 'contains',
  catalogTypeName?: string
) {
  return withServerActionErrorHandler(async () => {
    const params: Record<string, any> = {
      page,
      limit,
      sort: sortBy,
      order: sortOrder
    };

    // Build filters as direct string values (not nested objects)
    // This will generate flat query params: search=value&searchType=contains&catalogType.name=Book
    const filters: Record<string, string> = {};

    // Add general search parameter (searches across title, note, isbn, issn, callNo, year)
    if (query && query.trim()) {
      filters.search = query.trim();
      filters.searchType = searchType; // Use selected search type: 'exact' or 'contains'
    }

    // Add catalog type filter by name as a flat parameter (e.g., catalogType.name=Thesis)
    if (catalogTypeName && catalogTypeName.trim()) {
      filters['catalogType.name'] = catalogTypeName.trim();
    }

    // Only add filters if we have any
    if (Object.keys(filters).length > 0) {
      params.filters = filters;
    }

    console.log('[searchBooks] Searching with params:', params);
    const response = await getLibraryModuleList<Bibliography>('bibliographies', params);

    return {
      success: true,
      data: response.data,
      pagination: response.pagination
    };
  }, {
    operation: 'search-books',
    component: 'library-books-actions',
    metadata: { query, catalogTypeName, page }
  });
}

/**
 * Get new arrivals (recently added books)
 */
export async function getNewArrivals(limit = 10, page = 1) {
  return withServerActionErrorHandler(async () => {
    console.log('📖 [getNewArrivals] Called with:', { limit, page });

    const params = {
      page,
      limit,
      sort: 'createdAt',
      order: 'desc' as const
    };

    console.log('📖 [getNewArrivals] Calling getLibraryModuleList with params:', params);

    const response = await getLibraryModuleList<Bibliography>('bibliographies', params);

    console.log('📖 [getNewArrivals] Response:', {
      dataCount: response.data?.length,
      pagination: response.pagination
    });

    return {
      success: true,
      data: response.data,
      pagination: response.pagination
    };
  }, {
    operation: 'get-new-arrivals',
    component: 'library-books-actions',
    metadata: { limit, page }
  });
}

/**
 * Get top reading books (most popular)
 */
export async function getTopReading(limit = 10) {
  return withServerActionErrorHandler(async () => {
    const response = await getLibraryModuleList<Bibliography>('bibliographies', {
      page: 1,
      limit,
      sort: 'title',
      order: 'asc'
    });

    return {
      success: true,
      data: response.data,
      pagination: response.pagination
    };
  }, {
    operation: 'get-top-reading',
    component: 'library-books-actions',
    metadata: { limit }
  });
}

/**
 * Get single book by ID
 */
export async function getBookById(id: string) {
  return withServerActionErrorHandler(async () => {
    // Use the ModuleService getItem method through wrapper
    // For now, we'll fetch all and filter - TODO: implement getLibraryModuleItem
    const response = await getLibraryModuleList<Bibliography>('bibliographies', {
      page: 1,
      limit: 1
    });

    return {
      success: true,
      data: response.data[0] || null
    };
  }, {
    operation: 'get-book-by-id',
    component: 'library-books-actions',
    metadata: { bookId: id }
  });
}

// Note: submitSearchForm removed - now using client-side navigation with React Query
