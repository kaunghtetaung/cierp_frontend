/**
 * Thumbnail Upload Dialog
 * Dialog for uploading custom thumbnails for PDF files
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import type { MediaFile } from '@repo/media';

export interface ThumbnailUploadDialogProps {
  isOpen: boolean;
  pdfFile: MediaFile | null;
  onClose: () => void;
  onUpload: (thumbnailFile: File) => Promise<void>;
}

export function ThumbnailUploadDialog({
  isOpen,
  pdfFile,
  onClose,
  onUpload,
}: ThumbnailUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      // Reset and close on success
      setSelectedFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onUpload, onClose]);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    onClose();
  }, [isUploading, onClose]);

  if (!isOpen || !pdfFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Thumbnail</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* PDF Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
            <FileImage size={24} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {pdfFile.name}
              </p>
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Thumbnail Image
            </label>

            {!preview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Thumbnail preview"
                  className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Thumbnail'}
          </button>
        </div>
      </div>
    </div>
  );
}
