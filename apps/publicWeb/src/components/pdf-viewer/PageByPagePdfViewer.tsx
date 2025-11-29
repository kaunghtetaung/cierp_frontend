'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useLangSelector } from '@/feature-components/lang-selector';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker - use local file for reliability (avoid CDN issues in Myanmar)
// The worker file is copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs to public/pdf-worker/
// When upgrading react-pdf/pdfjs-dist, run: cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf-worker/
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

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
// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Debug info interface for dev mode
interface DebugInfo {
  stage: string;
  timestamp: string;
  pdfUrl?: string;
  pageUrl?: string;
  httpStatus?: number;
  errorType?: string;
  errorMessage?: string;
  responseBody?: string;
  metadata?: unknown;
  additionalInfo?: Record<string, unknown>;
}

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1.0); // Zoom scale: 1.0 = 100%
  const [fitToWidth, setFitToWidth] = useState(true); // Fit to width mode
  const [showFooter, setShowFooter] = useState(true); // Footer visibility
  const [footerHoverTimeout, setFooterHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showLeftNav, setShowLeftNav] = useState(false); // Show left navigation hint
  const [showRightNav, setShowRightNav] = useState(false); // Show right navigation hint

  // Dev mode: detailed debug info
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(isDev);

  // Add debug log entry
  const addDebugLog = (info: Omit<DebugInfo, 'timestamp'>) => {
    if (!isDev) return;
    setDebugInfo(prev => [...prev, { ...info, timestamp: new Date().toISOString() }]);
  };

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
    fullscreen: currentLanguage === 'mm' ? 'မျက်နှာပြင်အပြည့်' : 'Fullscreen',
    exitFullscreen: currentLanguage === 'mm' ? 'မျက်နှာပြင်အပြည့်မှ ထွက်ရန်' : 'Exit Fullscreen',
    zoomIn: currentLanguage === 'mm' ? 'ချဲ့ကြည့်ရန်' : 'Zoom In',
    zoomOut: currentLanguage === 'mm' ? 'ချုံ့ကြည့်ရန်' : 'Zoom Out',
    resetZoom: currentLanguage === 'mm' ? 'ပုံမှန်အရွယ်' : 'Reset Zoom',
    fitToWidth: currentLanguage === 'mm' ? 'အကျယ်ကိုက်ညီစေ' : 'Fit to Width',
    customZoom: currentLanguage === 'mm' ? 'ကိုယ်တိုင်ချိန်ညှိ' : 'Custom Zoom',
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
    addDebugLog({
      stage: 'FETCH_METADATA_START',
      pdfUrl,
      additionalInfo: { bookId, userId, watermark }
    });

    try {
      console.log('[PageByPagePdfViewer] Fetching metadata from:', pdfUrl);
      const response = await fetch(pdfUrl);

      addDebugLog({
        stage: 'FETCH_METADATA_RESPONSE',
        pdfUrl,
        httpStatus: response.status,
        additionalInfo: {
          ok: response.ok,
          statusText: response.statusText,
          contentType: response.headers.get('content-type')
        }
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorBody = '';
        try {
          const errorData = await response.json();
          errorBody = JSON.stringify(errorData, null, 2);
          addDebugLog({
            stage: 'FETCH_METADATA_ERROR',
            pdfUrl,
            httpStatus: response.status,
            errorType: 'HTTP_ERROR',
            errorMessage: errorData.error || response.statusText,
            responseBody: errorBody,
            additionalInfo: errorData
          });
          // Set more descriptive error for UI
          setError(`${errorData.error || 'Failed to load PDF'} (HTTP ${response.status})`);
        } catch {
          errorBody = await response.text();
          addDebugLog({
            stage: 'FETCH_METADATA_ERROR',
            pdfUrl,
            httpStatus: response.status,
            errorType: 'HTTP_ERROR',
            errorMessage: response.statusText,
            responseBody: errorBody
          });
          setError(`Failed to fetch metadata: HTTP ${response.status}`);
        }
        setIsLoading(false);
        return;
      }

      const metadata = await response.json();
      console.log('[PageByPagePdfViewer] Metadata received:', metadata);

      addDebugLog({
        stage: 'FETCH_METADATA_SUCCESS',
        pdfUrl,
        metadata,
        additionalInfo: { pageCount: metadata.data?.pageCount }
      });

      if (metadata.success && metadata.data?.pageCount) {
        setTotalPages(metadata.data.pageCount);
        setIsLoading(false);
      } else {
        addDebugLog({
          stage: 'FETCH_METADATA_INVALID_FORMAT',
          pdfUrl,
          errorType: 'INVALID_FORMAT',
          errorMessage: 'Response missing success or pageCount',
          metadata
        });
        setError('Invalid metadata format - missing pageCount');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[PageByPagePdfViewer] Error fetching metadata:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebugLog({
        stage: 'FETCH_METADATA_EXCEPTION',
        pdfUrl,
        errorType: err instanceof Error ? err.name : 'Unknown',
        errorMessage,
        additionalInfo: { stack: err instanceof Error ? err.stack : undefined }
      });
      setError(`Network error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  // Handle document load error (for individual page rendering)
  const onDocumentLoadError = (err: Error) => {
    console.error('[PageByPagePdfViewer] Error loading PDF page:', err);
    addDebugLog({
      stage: 'PAGE_RENDER_ERROR',
      pageUrl: getPageUrl(currentPage),
      errorType: err.name,
      errorMessage: err.message,
      additionalInfo: { currentPage, stack: err.stack }
    });
    setError(`Failed to render page ${currentPage}: ${err.message}`);
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

  // Toggle fullscreen mode
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom functions
  const handleZoomIn = () => {
    setFitToWidth(false); // Disable fit-to-width when manually zooming
    setZoom(prev => Math.min(prev + 0.25, 3.0)); // Max 300%
  };

  const handleZoomOut = () => {
    setFitToWidth(false); // Disable fit-to-width when manually zooming
    setZoom(prev => Math.max(prev - 0.25, 0.5)); // Min 50%
  };

  const handleResetZoom = () => {
    setFitToWidth(false); // Disable fit-to-width when manually zooming
    setZoom(1.0); // Reset to 100%
  };

  // Toggle fit-to-width mode
  const toggleFitToWidth = () => {
    setFitToWidth(prev => !prev);
    if (!fitToWidth) {
      // When enabling fit-to-width, reset zoom to 1.0
      setZoom(1.0);
    }
  };

  // Footer auto-hide logic with mouse movement detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      const footerTriggerZone = 100; // Show footer when cursor is within 100px from bottom

      if (windowHeight - mouseY < footerTriggerZone) {
        // Mouse is near bottom - show footer
        setShowFooter(true);

        // Clear any existing timeout
        if (footerHoverTimeout) {
          clearTimeout(footerHoverTimeout);
        }
      } else {
        // Mouse moved away from bottom - hide footer after delay
        if (footerHoverTimeout) {
          clearTimeout(footerHoverTimeout);
        }

        const timeout = setTimeout(() => {
          setShowFooter(false);
        }, 1000); // Hide after 1 second of inactivity

        setFooterHoverTimeout(timeout);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (footerHoverTimeout) {
        clearTimeout(footerHoverTimeout);
      }
    };
  }, [footerHoverTimeout]);

  // Build URL for current watermarked page
  const currentPageUrl = getPageUrl(currentPage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      {/* Header with Title, Mini Page Indicator, Fullscreen, and Close - Keep Blue */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-400/20" style={{ backgroundColor: '#1F54B5' }}>
        <h2 className="text-lg font-semibold text-white truncate flex-1 mr-4" title={title}>
          {title}
        </h2>

        {/* Mini Page Indicator with Navigation */}
        {totalPages && !error && (
          <div className="flex items-center gap-2 mr-4">
            {/* Previous Button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={texts.previous}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/40 border border-blue-400/30">
              <svg className="w-4 h-4 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-white">
                {currentPage} <span className="text-blue-200">/</span> {totalPages}
              </span>
            </div>

            {/* Next Button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={texts.next}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5 || fitToWidth}
            className="p-2 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={texts.zoomOut}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>

          {/* Zoom Level Display */}
          <button
            onClick={handleResetZoom}
            disabled={fitToWidth}
            className="px-2 py-1 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors text-sm font-medium min-w-[3.5rem] disabled:opacity-30 disabled:cursor-not-allowed"
            title={texts.resetZoom}
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3.0 || fitToWidth}
            className="p-2 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={texts.zoomIn}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-blue-400/30" />

          {/* Fit to Width Toggle Button */}
          <button
            onClick={toggleFitToWidth}
            className={`p-2 rounded-lg transition-colors ${
              fitToWidth
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
            title={fitToWidth ? texts.customZoom : texts.fitToWidth}
          >
            {fitToWidth ? (
              // Active state: Width arrows (horizontal expand)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            ) : (
              // Inactive state: Document with width indicator
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-blue-400/30" />

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-blue-600 text-blue-100 hover:text-white transition-colors"
            title={isFullscreen ? texts.exitFullscreen : texts.fullscreen}
          >
            {isFullscreen ? (
              // Exit Fullscreen Icon
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              // Enter Fullscreen Icon
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5.25 5.25M20 8V4m0 0h-4m4 0l-5.25 5.25M4 16v4m0 0h4m-4 0l5.25-5.25M20 16v4m0 0h-4m4 0l-5.25-5.25" />
              </svg>
            )}
          </button>

          {/* Close Button */}
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
      </div>

      {/* PDF Content Area - Gray */}
      <div id="pdf-container" className="flex-1 overflow-auto bg-gray-50 relative z-10">
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
          <div className="flex flex-col items-center justify-center p-8 min-h-[600px]">
            <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 max-w-md w-full">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                {/* Error Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{error}</h3>

                {/* Error Description */}
                <p className="text-sm text-gray-600 mb-6">
                  {currentLanguage === 'mm'
                    ? 'PDF ဖိုင်ကို ဖွင့်၍မရပါ။ နောက်တစ်ကြိမ် ထပ်စမ်းကြည့်ပါ။'
                    : 'Unable to load the PDF file. Please try again later or contact support if the problem persists.'}
                </p>

                {/* Retry Button */}
                <button
                  onClick={() => {
                    setError(null);
                    setDebugInfo([]);
                    setIsLoading(true);
                    fetchMetadata();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {texts.retry}
                </button>
              </div>
            </div>

            {/* Debug Panel - Only in Development */}
            {isDev && debugInfo.length > 0 && (
              <div className="mt-6 w-full max-w-4xl">
                <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-yellow-400 font-semibold text-sm">Debug Info (Dev Mode Only)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      {showDebugPanel ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showDebugPanel && (
                    <div className="p-4 max-h-96 overflow-auto">
                      <div className="space-y-4">
                        {debugInfo.map((log, index) => (
                          <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                            <div className={`px-3 py-2 text-xs font-mono font-semibold ${
                              log.stage.includes('ERROR') || log.stage.includes('EXCEPTION')
                                ? 'bg-red-900/50 text-red-300'
                                : log.stage.includes('SUCCESS')
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-blue-900/50 text-blue-300'
                            }`}>
                              [{log.timestamp.split('T')[1]?.slice(0, 8)}] {log.stage}
                            </div>
                            <div className="p-3 bg-gray-800/50 text-xs font-mono text-gray-300 space-y-2">
                              {log.pdfUrl && (
                                <div><span className="text-gray-500">URL:</span> {log.pdfUrl}</div>
                              )}
                              {log.pageUrl && (
                                <div><span className="text-gray-500">Page URL:</span> {log.pageUrl}</div>
                              )}
                              {log.httpStatus && (
                                <div>
                                  <span className="text-gray-500">HTTP Status:</span>{' '}
                                  <span className={log.httpStatus >= 400 ? 'text-red-400' : 'text-green-400'}>
                                    {log.httpStatus}
                                  </span>
                                </div>
                              )}
                              {log.errorType && (
                                <div><span className="text-gray-500">Error Type:</span> <span className="text-red-400">{log.errorType}</span></div>
                              )}
                              {log.errorMessage && (
                                <div><span className="text-gray-500">Error Message:</span> <span className="text-red-400">{log.errorMessage}</span></div>
                              )}
                              {log.responseBody && (
                                <div>
                                  <span className="text-gray-500">Response Body:</span>
                                  <pre className="mt-1 p-2 bg-gray-900 rounded text-xs overflow-x-auto">{log.responseBody}</pre>
                                </div>
                              )}
                              {log.additionalInfo && Object.keys(log.additionalInfo).length > 0 && (
                                <div>
                                  <span className="text-gray-500">Additional Info:</span>
                                  <pre className="mt-1 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.additionalInfo, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PDF Rendering */}
        {!error && totalPages && (
          <div className="w-full min-h-full flex items-start justify-center py-8 px-4 relative" onContextMenu={handleContextMenu}>
            {/* Render current watermarked page */}
            <div className="relative shadow-2xl rounded-lg overflow-hidden" style={{ zIndex: 15 }}>
              <Document
                key={`pdf-page-${currentPage}`}
                file={currentPageUrl}
                onLoadSuccess={() => {
                  addDebugLog({
                    stage: 'PAGE_LOAD_SUCCESS',
                    pageUrl: currentPageUrl,
                    additionalInfo: { currentPage }
                  });
                }}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8 min-h-[600px] min-w-[800px]">
                    <div className="text-center">
                      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
                      <p className="text-gray-700 font-medium">{texts.loadingPage}</p>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-8 min-h-[600px] min-w-[800px]">
                    <div className="text-center text-red-500">
                      <p>Failed to load page {currentPage}</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={1}
                  width={fitToWidth ? Math.min(containerWidth, 1200) : Math.min(containerWidth, 1200) * zoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* Left Navigation Zone (for Previous Page) - Behind PDF */}
            {currentPage > 1 && (
              <button
                onClick={goToPreviousPage}
                onMouseEnter={() => setShowLeftNav(true)}
                onMouseLeave={() => setShowLeftNav(false)}
                onTouchStart={() => setShowLeftNav(true)}
                onTouchEnd={() => setShowLeftNav(false)}
                className="absolute left-0 top-0 bottom-0 w-[30%] cursor-pointer group flex items-center justify-start pl-4"
                style={{ zIndex: 5 }}
                aria-label={texts.previous}
              >
                {/* Chevron Icon - Appears on hover/touch */}
                <div
                  className={`
                    bg-black/20 backdrop-blur-sm rounded-full p-4
                    transition-all duration-300 ease-in-out
                    ${showLeftNav ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
                    group-hover:opacity-100 group-hover:scale-100
                    active:scale-90
                  `}
                >
                  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>
            )}

            {/* Right Navigation Zone (for Next Page) - Behind PDF */}
            {currentPage < totalPages && (
              <button
                onClick={goToNextPage}
                onMouseEnter={() => setShowRightNav(true)}
                onMouseLeave={() => setShowRightNav(false)}
                onTouchStart={() => setShowRightNav(true)}
                onTouchEnd={() => setShowRightNav(false)}
                className="absolute right-0 top-0 bottom-0 w-[30%] cursor-pointer group flex items-center justify-end pr-4"
                style={{ zIndex: 5 }}
                aria-label={texts.next}
              >
                {/* Chevron Icon - Appears on hover/touch */}
                <div
                  className={`
                    bg-black/20 backdrop-blur-sm rounded-full p-4
                    transition-all duration-300 ease-in-out
                    ${showRightNav ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
                    group-hover:opacity-100 group-hover:scale-100
                    active:scale-90
                  `}
                >
                  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Auto-hide with hover */}
      {totalPages && !error && (
        <div
          className={`fixed bottom-0 left-0 right-0 px-6 py-4 border-t border-blue-400/20 transition-transform duration-300 ease-in-out ${
            showFooter ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ backgroundColor: '#1F54B5', zIndex: 30 }}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Left: First and Previous */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-50 hover:bg-white text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
                title={texts.firstPage}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-white text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-50 flex items-center gap-2"
                title={texts.previous}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline font-medium">{texts.previous}</span>
              </button>
            </div>

            {/* Center: Page Counter with Input */}
            <div className="flex items-center gap-3 bg-blue-600/30 px-4 py-2 rounded-lg border border-blue-400/30">
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={handlePageInputKeyDown}
                className="w-12 text-center bg-white border border-blue-300 rounded px-2 py-1 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                aria-label="Current page"
              />
              <span className="text-blue-100">/</span>
              <span className="text-white font-medium">
                {totalPages}
              </span>
            </div>

            {/* Right: Next and Last */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-white text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-50 flex items-center gap-2"
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
                className="p-2 rounded-lg bg-gray-50 hover:bg-white text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
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
