'use client';

import { useState } from 'react';
import { useLangSelector } from '@/feature-components/lang-selector';

interface PublicPdfViewerProps {
  pdfUrl: string;
  title?: string;
  onClose?: () => void;
  showDownload?: boolean;
  showPrint?: boolean;
}

/**
 * Public PDF Viewer Component
 * - No authentication required
 * - Supports view and download
 * - Used for library abstracts and content
 */
export function PublicPdfViewer({
  pdfUrl,
  title = 'PDF Document',
  onClose,
  showDownload = true,
  showPrint = true
}: PublicPdfViewerProps) {
  const { currentLanguage } = useLangSelector();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multilingual text
  const texts = {
    close: currentLanguage === 'mm' ? 'ပိတ်မည်' : 'Close',
    download: currentLanguage === 'mm' ? 'ဒေါင်းလုဒ်လုပ်မည်' : 'Download',
    print: currentLanguage === 'mm' ? 'ပရင့်ထုတ်မည်' : 'Print',
    loading: currentLanguage === 'mm' ? 'PDF ဖွင့်နေသည်...' : 'Loading PDF...',
    error: currentLanguage === 'mm' ? 'PDF ဖွင့်၍မရပါ' : 'Failed to load PDF',
    retry: currentLanguage === 'mm' ? 'ထပ်စမ်းကြည့်မည်' : 'Retry',
    openNewTab: currentLanguage === 'mm' ? 'Tab အသစ်တွင် ဖွင့်မည်' : 'Open in New Tab'
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleOpenNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(texts.error);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Force iframe reload by changing src
    const iframe = document.getElementById('pdf-viewer-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = pdfUrl + '?retry=' + Date.now();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <h2 className="text-lg font-semibold text-foreground truncate flex-1 mr-4" title={title}>
          {title}
        </h2>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          {showPrint && (
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center gap-2"
              title={texts.print}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span className="hidden sm:inline">{texts.print}</span>
            </button>
          )}

          {/* Open in New Tab Button */}
          <button
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center gap-2"
            title={texts.openNewTab}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="hidden sm:inline">{texts.openNewTab}</span>
          </button>

          {/* Download Button */}
          {showDownload && (
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center gap-2"
              title={texts.download}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline">{texts.download}</span>
            </button>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors flex items-center gap-2"
              title={texts.close}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="hidden sm:inline">{texts.close}</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading State */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
              <p className="text-muted-foreground">{texts.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center max-w-md px-4">
              <svg
                className="mx-auto h-16 w-16 text-destructive mb-4"
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
              <h3 className="text-lg font-semibold text-foreground mb-2">{error}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {currentLanguage === 'mm'
                  ? 'PDF ဖိုင်ကို ဖွင့်၍မရပါ။ နောက်တစ်ကြိမ် ထပ်စမ်းကြည့်ပါ။'
                  : 'Unable to load the PDF file. Please try again or download it directly.'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                >
                  {texts.retry}
                </button>
                {showDownload && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    {texts.download}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PDF Iframe */}
        <iframe
          id="pdf-viewer-iframe"
          src={pdfUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={title}
        />
      </div>
    </div>
  );
}
