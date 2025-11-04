/**
 * Media Preview Component
 * Modal for previewing images, PDFs, audio, and video files
 */

'use client';

import { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import type { MediaFile } from '../../types';
import { PDFViewer } from './PDFViewer';

export interface MediaPreviewProps {
  isOpen: boolean;
  file: MediaFile | null;
  onClose: () => void;
  app?: string; // App identifier for PDF proxy
  basePath?: string; // Base path for constructing full file paths (e.g., "public", "private/common")
}

export function MediaPreview({ isOpen, file, onClose, app = 'core', basePath }: MediaPreviewProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDownload = useCallback(() => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [file]);

  if (!isOpen || !file) return null;

  // Get file extension for fallback when MIME type is missing
  const ext = file.name.toLowerCase().split('.').pop() || '';

  // Determine file type - check MIME type first, then fall back to extension
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'tif'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];

  const isImage = file.type.startsWith('image/') || imageExtensions.includes(ext);
  const isPdf = file.type === 'application/pdf' || ext === 'pdf';
  const isAudio = file.type.startsWith('audio/') || audioExtensions.includes(ext);
  const isVideo = file.type.startsWith('video/') || videoExtensions.includes(ext);

  // Debug logging
  console.log('[MediaPreview] File type detection:', {
    fileName: file.name,
    fileType: file.type,
    ext,
    isImage,
    isPdf,
    isAudio,
    isVideo,
    url: file.url,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{file.name}</h2>
            <p className="text-sm text-gray-500">
              {file.type || 'Unknown type'} • {formatFileSize(file.size)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {isPdf && (
            <div className="w-full h-full">
              <PDFViewer
                fileKey={basePath ? `${basePath}/${file.key}` : file.key}
                fileName={file.name}
                app={app}
              />
            </div>
          )}

          {isAudio && (
            <div className="w-full max-w-2xl">
              <audio controls className="w-full" src={file.url}>
                Your browser does not support the audio element.
              </audio>
              <div className="mt-4 text-center text-gray-500">
                <p className="text-sm">Playing: {file.name}</p>
              </div>
            </div>
          )}

          {isVideo && (
            <video controls className="max-w-full max-h-full" src={file.url}>
              Your browser does not support the video element.
            </video>
          )}

          {!isImage && !isPdf && !isAudio && !isVideo && (
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Preview not available</p>
              <p className="text-sm mt-2">This file type cannot be previewed</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
