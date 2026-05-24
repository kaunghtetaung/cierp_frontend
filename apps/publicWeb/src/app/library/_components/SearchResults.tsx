'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLangSelector } from '@/feature-components/lang-selector';
import { PublicPdfViewer } from '@/components/pdf-viewer/PublicPdfViewer';
import { getAuthorName } from '@/lib/library-utils';
import type { Bibliography } from '@/actions/library/books.actions';

/**
 * Highlight search terms in text
 * Supports multiple space-separated terms for advanced search
 */
function highlightText(text: string, searchQuery?: string): React.ReactNode {
  if (!searchQuery || !text) return text;

  const query = searchQuery.trim();
  if (!query) return text;

  // Split query into individual terms and filter out empty ones
  const terms = query.split(/\s+/).filter(term => term.length > 0);
  if (terms.length === 0) return text;

  // Escape special regex characters for each term
  const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Create regex that matches any of the terms (case-insensitive)
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  // Split text by any of the search terms
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface SearchResultsProps {
  books: Bibliography[];
  query?: string;
  total?: number;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  canAccessEbooks?: boolean;
}

type ViewMode = 'card' | 'list' | 'table';

export function SearchResults({
  books,
  query,
  total,
  isLoading,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  canAccessEbooks = false
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

  // PDF Viewer state
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
  }>({
    isOpen: false,
    pdfUrl: '',
    title: ''
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
    viewAbstract: currentLanguage === 'mm' ? 'အကျဉ်းချုပ်' : 'Abstract',
    viewContent: currentLanguage === 'mm' ? 'အကြောင်းအရာ' : 'Content',
    readEbook: currentLanguage === 'mm' ? 'eBook ဖတ်ရန်' : 'Read eBook',
    by: currentLanguage === 'mm' ? 'စာရေးသူ:' : 'By:',
    publisher: currentLanguage === 'mm' ? 'ထုတ်ဝေသူ:' : 'Publisher:',
    year: currentLanguage === 'mm' ? 'နှစ်:' : 'Year:',
    isbn: currentLanguage === 'mm' ? 'ISBN:' : 'ISBN:',
    callNo: currentLanguage === 'mm' ? 'Call No:' : 'Call No:',
    searching: currentLanguage === 'mm' ? 'ရှာဖွေနေသည်...' : 'Searching...',
  };

  const handleOpenPdfViewer = (pdfUrl: string, title: string) => {
    setPdfViewerState({
      isOpen: true,
      pdfUrl,
      title
    });
  };

  const handleClosePdfViewer = () => {
    setPdfViewerState({
      isOpen: false,
      pdfUrl: '',
      title: ''
    });
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
      <div className="py-16 px-8 rounded-xl" style={{ background: 'linear-gradient(135deg, #E8EEF8 0%, #D6E2F4 100%)' }}>
        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          {/* Icon Container */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: 'rgba(31, 84, 181, 0.1)' }}>
            <svg
              className="w-10 h-10"
              style={{ color: '#1F54B5' }}
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
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {texts.noBooks}
          </h3>

          {/* Description */}
          <p className="text-center text-gray-600 mb-6">
            {query ? (
              <>
                No results found for <span className="font-semibold" style={{ color: '#1F54B5' }}>"{query}"</span>
                <br />
                {texts.tryDifferent}
              </>
            ) : (
              texts.startSearching
            )}
          </p>

          {/* Suggestions */}
          {query && (
            <div className="w-full bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: '4px solid #1F54B5' }}>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                {currentLanguage === 'mm' ? 'အကြံပြုချက်များ:' : 'Suggestions:'}
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: '#1F54B5' }}>•</span>
                  <span>{currentLanguage === 'mm' ? 'စာလုံးပေါင်းစစ်ဆေးပါ' : 'Check your spelling'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: '#1F54B5' }}>•</span>
                  <span>{currentLanguage === 'mm' ? 'ပိုမိုရိုးရှင်းသောစာလုံးများကို သုံးပါ' : 'Try more general keywords'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: '#1F54B5' }}>•</span>
                  <span>{currentLanguage === 'mm' ? 'ရှာဖွေမှုအမျိုးအစားကို ပြောင်းလဲကြည့်ပါ' : 'Try changing search filters'}</span>
                </li>
              </ul>
            </div>
          )}
        </div>
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
            <BookCard key={book._id} book={book} texts={texts} onOpenPdf={handleOpenPdfViewer} searchQuery={query} canAccessEbooks={canAccessEbooks} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {books.map((book) => (
            <BookListItem key={book._id} book={book} texts={texts} onOpenPdf={handleOpenPdfViewer} searchQuery={query} canAccessEbooks={canAccessEbooks} />
          ))}
        </div>
      ) : (
        <BookTable books={books} texts={texts} onOpenPdf={handleOpenPdfViewer} searchQuery={query} canAccessEbooks={canAccessEbooks} />
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerState.isOpen && (
        <PublicPdfViewer
          pdfUrl={pdfViewerState.pdfUrl}
          title={pdfViewerState.title}
          onClose={handleClosePdfViewer}
        />
      )}
    </div>
  );
}

/**
 * Book Card Component (Grid View)
 */
function BookCard({ book, texts, onOpenPdf, searchQuery, canAccessEbooks }: { book: Bibliography; texts: any; onOpenPdf: (url: string, title: string) => void; searchQuery?: string; canAccessEbooks?: boolean }) {
  // Check if abstract or content files exist
  const hasAbstract = book.abstract && (book as any).abstractFile;
  const hasContent = book.content && (book as any).contentFile;
  const hasEbook = canAccessEbooks && (book as any).ebookFile;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
      {/* Book Cover - Portrait ratio for book covers */}
      <div className="bg-muted aspect-[2/3] flex items-center justify-center relative overflow-hidden">
        {book.bookCoverImage ? (
          <>
            <img
              src={book.bookCoverImage}
              alt={book.title}
              className="h-full w-full object-cover"
            />

            {/* Call Number Badge - Top Left */}
            {book.callNo && (
              <div className="absolute top-2 left-2">
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium shadow-md">
                  {book.callNo}
                </span>
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute top-2 right-2">
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded shadow-md ${
                  book.status === 'Active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}
              >
                {book.status}
              </span>
            </div>

            {/* Title overlay at bottom - always visible */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3">
              <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug" title={book.title}>
                {highlightText(book.title, searchQuery)}
              </h3>
              {book.author && (
                <p className="text-xs text-gray-200 line-clamp-1 mt-1">
                  {highlightText(getAuthorName(book.author), searchQuery)}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
            <svg
              className="h-16 w-16 text-muted-foreground mb-3"
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
            {/* Title for books without cover - always visible */}
            <h3 className="font-semibold text-sm text-foreground line-clamp-3 leading-snug mb-2" title={book.title}>
              {highlightText(book.title, searchQuery)}
            </h3>
            {book.author && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {highlightText(getAuthorName(book.author), searchQuery)}
              </p>
            )}
          </div>
        )}

        {/* PDF Badge - Below Status */}
        {(hasAbstract || hasContent) && (
          <div className="absolute top-10 right-2">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium shadow-md">
              PDF
            </span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        {book.publisher && (
          <p className="text-sm text-muted-foreground mb-2">
            {texts.publisher} {highlightText(book.publisher.name, searchQuery)}
          </p>
        )}

        <div className="flex gap-2 text-xs text-muted-foreground mb-3">
          {book.year && <span>{texts.year} {book.year}</span>}
          {book.isbn && <span>• {texts.isbn} {book.isbn}</span>}
        </div>

        {/* PDF/eBook Buttons */}
        {(hasEbook || hasAbstract || hasContent) && (
          <div className="mt-3 flex flex-col gap-2">
            {hasEbook && (
              <button
                onClick={() => onOpenPdf((book as any).ebookFile, `${book.title} - eBook`)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {texts.readEbook}
              </button>
            )}
            {(hasAbstract || hasContent) && (
              <div className="flex gap-2">
                {hasAbstract && (
                  <button
                    onClick={() => onOpenPdf((book as any).abstractFile, `${book.title} - Abstract`)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {texts.viewAbstract}
                  </button>
                )}
                {hasContent && (
                  <button
                    onClick={() => onOpenPdf((book as any).contentFile, `${book.title} - Content`)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {texts.viewContent}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <Link
          href={`/library/${book._id}`}
          className="mt-3 w-full bg-warning text-warning-foreground py-2 rounded-md text-sm font-medium hover:bg-warning/90 transition-colors block text-center"
        >
          {texts.viewDetails}
        </Link>
      </div>
    </div>
  );
}

/**
 * Book List Item Component (List View)
 */
function BookListItem({ book, texts, onOpenPdf, searchQuery, canAccessEbooks }: { book: Bibliography; texts: any; onOpenPdf: (url: string, title: string) => void; searchQuery?: string; canAccessEbooks?: boolean }) {
  const hasAbstract = book.abstract && (book as any).abstractFile;
  const hasContent = book.content && (book as any).contentFile;
  const hasEbook = canAccessEbooks && (book as any).ebookFile;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Book Cover Thumbnail */}
        <div className="flex-shrink-0 w-24 h-32 bg-muted rounded flex items-center justify-center relative">
          {book.bookCoverImage ? (
            <img
              src={book.bookCoverImage}
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
          {(hasAbstract || hasContent) && (
            <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-md">
              PDF
            </span>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground mb-2" title={book.title}>
            {highlightText(book.title, searchQuery)}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {book.author && (
              <p>
                {texts.by} {highlightText(getAuthorName(book.author), searchQuery)}
              </p>
            )}

            {book.publisher && (
              <p>
                {texts.publisher} {highlightText(book.publisher.name, searchQuery)}
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

          <div className="mt-3 flex items-center justify-between gap-3">
            {/* Status Badge */}
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                book.status === 'Active'
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {book.status}
            </span>

            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-2">
              {hasEbook && (
                <button
                  onClick={() => onOpenPdf((book as any).ebookFile, `${book.title} - eBook`)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {texts.readEbook}
                </button>
              )}
              {hasAbstract && (
                <button
                  onClick={() => onOpenPdf((book as any).abstractFile, `${book.title} - Abstract`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {texts.viewAbstract}
                </button>
              )}
              {hasContent && (
                <button
                  onClick={() => onOpenPdf((book as any).contentFile, `${book.title} - Content`)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {texts.viewContent}
                </button>
              )}
              <Link
                href={`/library/${book._id}`}
                className="bg-warning text-warning-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-warning/90 transition-colors inline-block"
              >
                {texts.viewDetails}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Book Table Component (Table View)
 */
function BookTable({ books, texts, onOpenPdf, searchQuery, canAccessEbooks }: { books: Bibliography[]; texts: any; onOpenPdf: (url: string, title: string) => void; searchQuery?: string; canAccessEbooks?: boolean }) {
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
            {books.map((book) => {
              const hasAbstract = book.abstract && (book as any).abstractFile;
              const hasContent = book.content && (book as any).contentFile;
              const hasEbook = canAccessEbooks && (book as any).ebookFile;

              return (
                <tr key={book._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground max-w-xs">
                    <div className="line-clamp-2" title={book.title}>
                      {highlightText(book.title, searchQuery)}
                      {(hasAbstract || hasContent) && (
                        <span className="ml-2 inline-block bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          PDF
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {highlightText(getAuthorName(book.author), searchQuery)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {book.publisher?.name ? highlightText(book.publisher.name, searchQuery) : '-'}
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
                    <div className="flex gap-1 flex-wrap">
                      {hasEbook && (
                        <button
                          onClick={() => onOpenPdf((book as any).ebookFile, `${book.title} - eBook`)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title={texts.readEbook}
                        >
                          {texts.readEbook}
                        </button>
                      )}
                      {hasAbstract && (
                        <button
                          onClick={() => onOpenPdf((book as any).abstractFile, `${book.title} - Abstract`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title={texts.viewAbstract}
                        >
                          {texts.viewAbstract}
                        </button>
                      )}
                      {hasContent && (
                        <button
                          onClick={() => onOpenPdf((book as any).contentFile, `${book.title} - Content`)}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title={texts.viewContent}
                        >
                          {texts.viewContent}
                        </button>
                      )}
                      <Link
                        href={`/library/${book._id}`}
                        className="bg-warning text-warning-foreground px-2 py-1 rounded text-xs font-medium hover:bg-warning/90 transition-colors inline-block"
                      >
                        {texts.viewDetails}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
