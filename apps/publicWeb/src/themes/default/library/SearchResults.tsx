'use client';

import { useState, useEffect } from 'react';
import { useLangSelector } from '@/feature-components/lang-selector';
import type { Bibliography } from '@/actions/library/books.actions';

interface SearchResultsProps {
  books: Bibliography[];
  query?: string;
  total?: number;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

type ViewMode = 'card' | 'list' | 'table';

export function SearchResults({
  books,
  query,
  total,
  isLoading,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: SearchResultsProps) {
  const { currentLanguage } = useLangSelector();

  // Load view mode from localStorage on mount
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('library-view-mode');
      return (saved as ViewMode) || 'card';
    }
    return 'card';
  });

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('library-view-mode', viewMode);
    }
  }, [viewMode]);

  // Multilingual text
  const texts = {
    searchResults: currentLanguage === 'mm' ? 'ရှာဖွေမှုရလဒ်များ' : 'Search Results',
    showingResults: currentLanguage === 'mm' ? 'ရလဒ်များပြသနေသည်' : 'Showing results for',
    noBooks: currentLanguage === 'mm' ? 'စာအုပ်များမတွေ့ပါ' : 'No books found',
    noResultsFor: currentLanguage === 'mm' ? 'အတွက် ရလဒ်မရှိပါ။ အခြားစကားလုံးများဖြင့် ကြိုးစားကြည့်ပါ' : 'No results for',
    tryDifferent: currentLanguage === 'mm' ? 'အခြားစကားလုံးများဖြင့် ကြိုးစားကြည့်ပါ။' : 'Try different keywords.',
    startSearching: currentLanguage === 'mm' ? 'စာအုပ်များရှာရန် စတင်ရှာဖွေပါ' : 'Start searching to find books.',
    viewDetails: currentLanguage === 'mm' ? 'အသေးစိတ်ကြည့်ရှုမည်' : 'View Details',
    by: currentLanguage === 'mm' ? 'စာရေးသူ:' : 'By:',
    publisher: currentLanguage === 'mm' ? 'ထုတ်ဝေသူ:' : 'Publisher:',
    year: currentLanguage === 'mm' ? 'နှစ်:' : 'Year:',
    isbn: currentLanguage === 'mm' ? 'ISBN:' : 'ISBN:',
    callNo: currentLanguage === 'mm' ? 'Call No:' : 'Call No:',
    searching: currentLanguage === 'mm' ? 'ရှာဖွေနေသည်...' : 'Searching...',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-3 text-muted-foreground">{texts.searching}</p>
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-foreground">{texts.noBooks}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {query ? `${texts.noResultsFor} "${query}". ${texts.tryDifferent}` : texts.startSearching}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results Header with Page Navigation and View Toggle */}
      {query && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {texts.searchResults} {total !== undefined && `(${total})`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {texts.showingResults} "{query}"
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Compact Page Navigation */}
            {totalPages > 1 && onPageChange && (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-foreground px-2 min-w-[60px] text-center">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'card'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={currentLanguage === 'mm' ? 'ကဒ်မြင်ကွင်း' : 'Card View'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={currentLanguage === 'mm' ? 'စာရင်းမြင်ကွင်း' : 'List View'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={currentLanguage === 'mm' ? 'ဇယားမြင်ကွင်း' : 'Table View'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book._id} book={book} texts={texts} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {books.map((book) => (
            <BookListItem key={book._id} book={book} texts={texts} />
          ))}
        </div>
      ) : (
        <BookTable books={books} texts={texts} />
      )}
    </div>
  );
}

/**
 * Book Card Component (Grid View)
 */
function BookCard({ book, texts }: { book: Bibliography; texts: any }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
      {/* Book Cover */}
      <div className="bg-muted h-48 flex items-center justify-center">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <svg
            className="h-20 w-20 text-muted-foreground"
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
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2" title={book.title}>
          {book.title}
        </h3>

        {book.author && (
          <p className="text-sm text-muted-foreground mb-1">
            {texts.by} {book.author.fullName || `${book.author.firstName || ''} ${book.author.lastName || ''}`.trim()}
          </p>
        )}

        {book.publisher && (
          <p className="text-sm text-muted-foreground mb-1">
            {texts.publisher} {book.publisher.name}
          </p>
        )}

        <div className="flex gap-2 text-xs text-muted-foreground mb-2">
          {book.year && <span>{texts.year} {book.year}</span>}
          {book.isbn && <span>• {texts.isbn} {book.isbn}</span>}
        </div>

        {book.callNo && (
          <p className="text-xs text-muted-foreground mb-2">
            {texts.callNo} {book.callNo}
          </p>
        )}

        <div className="mt-3">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              book.status === 'Active'
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {book.status}
          </span>
        </div>

        <button className="mt-3 w-full bg-warning text-warning-foreground py-2 rounded-md text-sm font-medium hover:bg-warning/90 transition-colors">
          {texts.viewDetails}
        </button>
      </div>
    </div>
  );
}

/**
 * Book List Item Component (List View)
 */
function BookListItem({ book, texts }: { book: Bibliography; texts: any }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Book Cover Thumbnail */}
        <div className="flex-shrink-0 w-24 h-32 bg-muted rounded flex items-center justify-center">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="h-full w-full object-cover rounded"
            />
          ) : (
            <svg
              className="h-12 w-12 text-muted-foreground"
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
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground mb-2" title={book.title}>
            {book.title}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {book.author && (
              <p>
                {texts.by} {book.author.fullName || `${book.author.firstName || ''} ${book.author.lastName || ''}`.trim()}
              </p>
            )}

            {book.publisher && (
              <p>
                {texts.publisher} {book.publisher.name}
              </p>
            )}

            {book.year && (
              <p>
                {texts.year} {book.year}
              </p>
            )}

            {book.isbn && (
              <p>
                {texts.isbn} {book.isbn}
              </p>
            )}

            {book.callNo && (
              <p>
                {texts.callNo} {book.callNo}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                book.status === 'Active'
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {book.status}
            </span>

            <button className="ml-auto bg-warning text-warning-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-warning/90 transition-colors">
              {texts.viewDetails}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Book Table Component (Table View)
 */
function BookTable({ books, texts }: { books: Bibliography[]; texts: any }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.title || (texts.currentLanguage === 'mm' ? 'ခေါင်းစဉ်' : 'Title')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.author || (texts.currentLanguage === 'mm' ? 'စာရေးသူ' : 'Author')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.publisher}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.year}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.isbn}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.callNo}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.status || (texts.currentLanguage === 'mm' ? 'အခြေအနေ' : 'Status')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                {texts.actions || (texts.currentLanguage === 'mm' ? 'လုပ်ဆောင်ချက်များ' : 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {books.map((book) => (
              <tr key={book._id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm text-foreground max-w-xs">
                  <div className="line-clamp-2" title={book.title}>
                    {book.title}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {book.author
                    ? book.author.fullName ||
                      `${book.author.firstName || ''} ${book.author.lastName || ''}`.trim()
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {book.publisher?.name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{book.year || '-'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{book.isbn || '-'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{book.callNo || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      book.status === 'Active'
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {book.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button className="bg-warning text-warning-foreground px-4 py-1.5 rounded-md text-xs font-medium hover:bg-warning/90 transition-colors">
                    {texts.viewDetails}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
