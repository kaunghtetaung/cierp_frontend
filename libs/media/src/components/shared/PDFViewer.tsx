/**
 * PDF Viewer Component
 * Page-by-page PDF preview using iframe with PDF.js
 * Routes through Next.js proxy API for authentication and watermarking
 */

'use client';

import { useEffect, useRef } from 'react';

export interface PDFViewerProps {
  fileKey: string; // S3 file key (e.g., "core/public/document.pdf")
  fileName: string;
  app?: string; // App identifier (default: 'core')
  watermark?: string; // Optional watermark text
}

export function PDFViewer({ fileKey, fileName, app = 'core', watermark = 'CONFIDENTIAL' }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[PDFViewer] Loading PDF via proxy:', { fileName, fileKey, app, watermark });
  }, [fileKey, fileName, app, watermark]);

  // Build the proxy URL with query parameters
  const proxyUrl = `/api/media/pdf-proxy?file=${encodeURIComponent(fileKey)}&app=${encodeURIComponent(app)}&watermark=${encodeURIComponent(watermark)}`;

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-100">
      <iframe
        src={`/pdf-viewer.html?file=${encodeURIComponent(proxyUrl)}`}
        className="w-full h-full border-0"
        title={`PDF Viewer - ${fileName}`}
      />
    </div>
  );
}
