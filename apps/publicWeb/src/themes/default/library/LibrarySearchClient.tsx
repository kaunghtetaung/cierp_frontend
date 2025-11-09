'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { searchBooks } from '@/actions/library/books.actions';
import { SearchType, SortBy, SortOrder } from './SimpleSearch';
import { SearchHero } from './SearchHero';
import { SearchResults } from './SearchResults';
import { SearchResultsSkeleton } from './SearchResultsSkeleton';
import { Pagination } from './Pagination';

interface LibrarySearchClientProps {
  initialQuery?: string;
  initialSearchType?: SearchType;
  initialCatalogType?: string;
  initialSortBy?: SortBy;
  initialSortOrder?: SortOrder;
  canAccessEbooks?: boolean;
}

export function LibrarySearchClient({
  initialQuery = '',
  initialSearchType = 'contains',
  initialCatalogType = '',
  initialSortBy = 'year',
  initialSortOrder = 'desc',
  canAccessEbooks = false
}: LibrarySearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
  const [catalogTypeName, setCatalogTypeName] = useState(initialCatalogType);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sync state with URL parameters on mount and when they change
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setSearchType(initialSearchType);
      setCatalogTypeName(initialCatalogType);
      setSortBy(initialSortBy);
      setSortOrder(initialSortOrder);
    }
  }, [initialQuery, initialSearchType, initialCatalogType, initialSortBy, initialSortOrder]);

  // React Query for search
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library-search', query, searchType, catalogTypeName, currentPage, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      try {
        const result = await searchBooks(
          query,
          currentPage,
          pageSize,
          sortBy,
          sortOrder,
          searchType,
          catalogTypeName
        );

        // Check if the API returned an error response
        if (!result.success) {
          throw new Error(result.error || 'Failed to search books');
        }

        return result;
      } catch (err) {
        console.error('Search error:', err);
        throw err;
      }
    },
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    retryDelay: 1000,
  });

  const handleSearch = (
    newQuery: string,
    newSearchType: SearchType,
    newCatalogTypeName: string,
    newSortBy: SortBy,
    newSortOrder: SortOrder
  ) => {
    setQuery(newQuery);
    setSearchType(newSearchType);
    setCatalogTypeName(newCatalogTypeName);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page on new search

    // Build URL with query parameters
    const params = new URLSearchParams();
    params.set('q', newQuery);
    params.set('searchType', newSearchType);
    if (newCatalogTypeName) {
      params.set('catalogType.name', newCatalogTypeName);
    }
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);

    // Update URL without page reload
    router.push(`/library/search?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Collapsible Search Hero */}
      <SearchHero
        onSearch={handleSearch}
        isLoading={isLoading}
        initialQuery={initialQuery}
        initialSearchType={initialSearchType}
        initialCatalogType={initialCatalogType}
        initialSortBy={initialSortBy}
        initialSortOrder={initialSortOrder}
        collapsible={true}
      />

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="py-10 px-8 rounded-xl bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center justify-center py-12">
                <div className="text-center max-w-md">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unable to Load Search Results
                  </h3>
                  <p className="text-sm text-gray-700 mb-1">
                    {error instanceof Error ? error.message : 'An unexpected error occurred'}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Please check your connection and try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading && <SearchResultsSkeleton />}

          {!isLoading && !error && data?.success && query && (
            <>
              <SearchResults
                books={data.data || []}
                query={query}
                total={data.pagination?.total}
                currentPage={currentPage}
                totalPages={data.pagination?.totalPages}
                onPageChange={handlePageChange}
                canAccessEbooks={canAccessEbooks}
              />

              {data.pagination && data.pagination.totalPages && data.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.pagination.totalPages}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  isLoading={isLoading}
                  total={data.pagination.total}
                />
              )}
            </>
          )}

          {!isLoading && !error && !query && (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-16 w-16 text-muted-foreground mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Enter a search term
              </h3>
              <p className="text-muted-foreground">
                Search by title, author, publisher, ISBN, or call number
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
