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
}

export function LibrarySearchClient({
  initialQuery = '',
  initialSearchType = 'contains',
  initialCatalogType = '',
  initialSortBy = 'year',
  initialSortOrder = 'desc'
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['library-search', query, searchType, catalogTypeName, currentPage, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      const result = await searchBooks(
        query,
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        searchType,
        catalogTypeName
      );
      return result;
    },
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
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
      params.set('catalogType', newCatalogTypeName);
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
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
              <p className="font-medium">Error loading search results</p>
              <p className="text-sm mt-1">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          )}

          {isLoading && <SearchResultsSkeleton />}

          {!isLoading && !error && data?.success && query && (
            <>
              <SearchResults
                books={data.data}
                query={query}
                total={data.pagination?.total}
                currentPage={currentPage}
                totalPages={data.pagination?.totalPages}
                onPageChange={handlePageChange}
              />

              {data.pagination && (
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

          {!isLoading && !error && data?.success && data.data.length === 0 && query && (
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
