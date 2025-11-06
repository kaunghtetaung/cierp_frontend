'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useLangSelector } from '@/feature-components/lang-selector';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PageByPagePdfViewerProps {
  pdfUrl: string; // Base URL without page parameter
  title?: string;
  onClose?: () => void;
  watermark?: string;
  bookId?: string; // Unique identifier for the book
  userId?: string; // User ID for localStorage key
}

/**
 * Page-by-Page PDF Viewer Component
 * - Renders PDF pages as canvas (no browser controls, no download)
 * - Fetches pages one at a time with watermarks from server
 * - Each page is watermarked on-demand by the server
 * - Uses react-pdf for rendering
 */
export function PageByPagePdfViewer({
  pdfUrl,
  title = 'PDF Document',
  onClose,
  watermark,
  bookId,
  userId,
}: PageByPagePdfViewerProps) {
  const { currentLanguage } = useLangSelector();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [pageInput, setPageInput] = useState('1');

  // Multilingual text
  const texts = {
    close: currentLanguage === 'mm' ? 'ပိတ်မည်' : 'Close',
    loading: currentLanguage === 'mm' ? 'PDF ဖွင့်နေသည်...' : 'Loading PDF...',
    loadingPage: currentLanguage === 'mm' ? 'စာမျက်နှာ ဖွင့်နေသည်...' : 'Loading page...',
    error: currentLanguage === 'mm' ? 'PDF ဖွင့်၍မရပါ' : 'Failed to load PDF',
    retry: currentLanguage === 'mm' ? 'ထပ်စမ်းကြည့်မည်' : 'Retry',
    page: currentLanguage === 'mm' ? 'စာမျက်နှာ' : 'Page',
    of: currentLanguage === 'mm' ? 'မှ' : 'of',
    previous: currentLanguage === 'mm' ? 'ယခင်' : 'Previous',
    next: currentLanguage === 'mm' ? 'နောက်' : 'Next',
    firstPage: currentLanguage === 'mm' ? 'ပထမစာမျက်နှာ' : 'First Page',
    lastPage: currentLanguage === 'mm' ? 'နောက်ဆုံးစာမျက်နှာ' : 'Last Page',
  };

  // Build URL for specific page
  const getPageUrl = (pageNum: number): string => {
    const url = new URL(pdfUrl, window.location.origin);
    url.searchParams.set('page', pageNum.toString());
    if (watermark) {
      url.searchParams.set('watermark', watermark);
    }
    return url.toString();
  };

  // Fetch PDF metadata (page count) from API
  const fetchMetadata = async () => {
    try {
      console.log('[PageByPagePdfViewer] Fetching metadata from:', pdfUrl);
      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata = await response.json();
      console.log('[PageByPagePdfViewer] Metadata received:', metadata);

      if (metadata.success && metadata.data?.pageCount) {
        setTotalPages(metadata.data.pageCount);
        setIsLoading(false);
      } else {
        throw new Error('Invalid metadata format');
      }
    } catch (err) {
      console.error('[PageByPagePdfViewer] Error fetching metadata:', err);
      setError(texts.error);
      setIsLoading(false);
    }
  };

  // Handle document load success (for individual pages)
  const onDocumentLoadSuccess = () => {
    // Page loaded successfully
  };

  // Handle document load error
  const onDocumentLoadError = (err: Error) => {
    console.error('[PageByPagePdfViewer] Error loading PDF page:', err);
    setError(texts.error);
    setIsLoading(false);
  };

  // Fetch metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, [pdfUrl]);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setContainerWidth(container.clientWidth - 32); // Subtract padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Load last read page from localStorage on mount
  useEffect(() => {
    if (bookId && userId && totalPages) {
      const storageKey = `ebook-bookmark-${userId}-${bookId}`;
      const savedPage = localStorage.getItem(storageKey);
      if (savedPage) {
        const pageNum = parseInt(savedPage, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          console.log('[PageByPagePdfViewer] Restoring bookmark to page:', pageNum);
          setCurrentPage(pageNum);
          setPageInput(pageNum.toString());
        }
      }
    }
  }, [totalPages, bookId, userId]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (bookId && userId && currentPage && totalPages) {
      const storageKey = `ebook-bookmark-${userId}-${bookId}`;
      localStorage.setItem(storageKey, currentPage.toString());
      console.log('[PageByPagePdfViewer] Saved bookmark:', currentPage);
    }
  }, [currentPage, bookId, userId, totalPages]);

  // Navigation handlers
  const goToPage = (pageNum: number) => {
    if (!totalPages) return;
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    setPageInput(pageNum.toString());
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => totalPages && goToPage(totalPages);

  // Handle page input change
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInput(value);
  };

  // Handle page input submit (Enter key or blur)
  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && totalPages) {
      if (pageNum >= 1 && pageNum <= totalPages) {
        goToPage(pageNum);
      } else {
        // Reset to current page if invalid
        setPageInput(currentPage.toString());
      }
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToFirstPage();
      } else if (e.key === 'End') {
        e.preventDefault();
        goToLastPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Prevent right-click to disable save
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Build URL for current watermarked page
  const currentPageUrl = getPageUrl(currentPage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      {/* Header with Title and Close - Keep Blue */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-400/20" style={{ backgroundColor: '#1F54B5' }}>
        <h2 className="text-lg font-semibold text-white truncate flex-1 mr-4" title={title}>
          {title}
        </h2>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors"
            title={texts.close}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* PDF Content Area - Gray */}
      <div id="pdf-container" className="flex-1 overflow-auto bg-gray-50">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
              <p className="text-gray-700 font-medium">{texts.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">{error}</h3>
              <p className="text-sm text-slate-300 mb-4">
                {currentLanguage === 'mm'
                  ? 'PDF ဖိုင်ကို ဖွင့်၍မရပါ။ နောက်တစ်ကြိမ် ထပ်စမ်းကြည့်ပါ။'
                  : 'Unable to load the PDF file. Please try again.'}
              </p>
            </div>
          </div>
        )}

        {/* PDF Rendering */}
        {!error && totalPages && (
          <div className="w-full min-h-full flex items-start justify-center py-8 px-4" onContextMenu={handleContextMenu}>
            {/* Render current watermarked page */}
            {(
              <Document
                file={currentPageUrl}
                loading={
                  <div className="flex items-center justify-center p-8 min-h-[600px] min-w-[800px]">
                    <div className="text-center">
                      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
                      <p className="text-gray-700 font-medium">{texts.loadingPage}</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={1}
                  width={Math.min(containerWidth, 1200)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                />
              </Document>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Fixed at bottom */}
      {totalPages && !error && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Left: First and Previous */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                title={texts.firstPage}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 flex items-center gap-2"
                title={texts.previous}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline font-medium">{texts.previous}</span>
              </button>
            </div>

            {/* Center: Page Counter with Input */}
            <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={handlePageInputKeyDown}
                className="w-12 text-center bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Current page"
              />
              <span className="text-gray-500">/</span>
              <span className="text-gray-600 font-medium">
                {totalPages}
              </span>
            </div>

            {/* Right: Next and Last */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 flex items-center gap-2"
                title={texts.next}
              >
                <span className="hidden sm:inline font-medium">{texts.next}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                title={texts.lastPage}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
