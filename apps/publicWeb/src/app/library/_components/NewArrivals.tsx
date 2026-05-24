'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Bibliography } from '@/actions/library/books.actions';
import { getNewArrivals } from '@/actions/library/books.actions';
import { getAuthorName } from '@/lib/library-utils';
import Link from 'next/link';

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface NewArrivalsProps {
  initialBooks: Bibliography[];
  initialPagination?: PaginationInfo;
  error?: string | null;
}

export function NewArrivals({ initialBooks, initialPagination, error: initialError }: NewArrivalsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const limit = 10;

  // Use React Query for pagination - same pattern as search results
  const { data, isLoading, isFetching, error, isSuccess, dataUpdatedAt } = useQuery({
    queryKey: ['new-arrivals', currentPage, limit],
    queryFn: async () => {
      console.log('🔄 [React Query] Fetching new arrivals:', { currentPage, limit });

      const result = await getNewArrivals(limit, currentPage);

      console.log('📦 [React Query] Response received:', {
        success: result?.success,
        dataLength: result.success ? result.data?.length : 0,
        pagination: result.success ? result.pagination : undefined
      });

      if (!result.success) {
        throw new Error((result as any).error || 'Failed to load new arrivals');
      }

      return result;
    },
    initialData: currentPage === 1 ? {
      success: true,
      data: initialBooks,
      pagination: initialPagination
    } : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes - same as search
    retry: 2,
    retryDelay: 1000,
  });

  // Clear transitioning state when data is updated (dataUpdatedAt changes)
  useEffect(() => {
    if (isTransitioning && dataUpdatedAt) {
      console.log('✅ [useEffect] Data updated, clearing isTransitioning');
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dataUpdatedAt, isTransitioning]);

  // Show loading - ONLY use isTransitioning for reliable loading state
  const showLoading = isTransitioning;

  const books = data?.data || [];
  const pagination = data?.pagination;

  // Debug log whenever showLoading changes
  console.log('🎬 [NewArrivals] Render state:', {
    currentPage,
    isTransitioning,
    isFetching,
    showLoading,
    booksCount: books?.length
  });

  const handlePageChange = async (newPage: number) => {
    console.log('📄 [NewArrivals] Page change requested:', newPage);
    console.log('📄 [NewArrivals] Setting isTransitioning to true');

    // Set transitioning state immediately to show loading
    setIsTransitioning(true);

    // Update page state - this triggers React Query
    setCurrentPage(newPage);

    console.log('📄 [NewArrivals] States set, React Query should start fetching');

    // Scroll to top of section smoothly after a brief delay
    setTimeout(() => {
      const section = document.querySelector('.new-arrivals-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Show error state
  if (error) {
    return (
      <div className="py-10 px-8 rounded-xl bg-gradient-to-br from-[#F6F7FA] to-[#ECEEF5]">
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
              Unable to Load New Arrivals
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="new-arrivals-section space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
          <p className="text-sm text-gray-600 mt-2">
            Recently added to our collection
          </p>
        </div>
        <Link
          href="/library?sortBy=createdAt&sortOrder=desc"
          className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Books Grid Container */}
      <div className="py-10 px-8 rounded-xl bg-gradient-to-br from-[#F6F7FA] to-[#ECEEF5] shadow-lg min-h-[400px] relative">
        {/* Books Grid - Always rendered to maintain height */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 transition-opacity duration-200 ${showLoading ? 'opacity-0' : 'opacity-100'}`}>
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>

        {/* Loading Overlay - Shows on top when loading */}
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F6F7FA] to-[#ECEEF5] rounded-xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div>
              <p className="text-sm font-medium text-gray-600">Loading books...</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls - Separated */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || showLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-lg shadow-md">
            <span className="text-sm text-gray-600">
              Page <span className="font-bold text-primary text-base">{pagination.page}</span> of{' '}
              <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
            </span>
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || showLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            Next
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Book Card for New Arrivals
 */
function BookCard({ book }: { book: Bibliography }) {
  return (
    <Link
      href={`/library/${book._id}`}
      className="group cursor-pointer block bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Book Cover */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-[2/3] overflow-hidden">
        {book.bookCoverImage ? (
          <>
            <img
              src={book.bookCoverImage}
              alt={book.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hover Overlay with Book Info - Only for books with cover images */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end">
              <div className="p-4 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug mb-2">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-xs text-gray-200 line-clamp-1 mb-1">
                    {getAuthorName(book.author)}
                  </p>
                )}
                {book.year && (
                  <p className="text-xs text-gray-300 font-medium">{book.year}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
            <svg
              className="h-16 w-16 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {/* Virtual Cover - Always visible when no image */}
            <div className="w-full">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-3 leading-snug mb-2">
                {book.title}
              </h3>
              {book.author && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                  {getAuthorName(book.author)}
                </p>
              )}
              {book.year && (
                <p className="text-xs text-gray-500 font-medium">{book.year}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
