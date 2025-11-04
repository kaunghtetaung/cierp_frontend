/**
 * File Uploader Component
 * Modal for uploading files with drag & drop
 */

'use client';

import { useRef } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { X, Upload, File } from 'lucide-react';

export interface FileUploaderProps {
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  allowedTypes?: string[];
  maxFileSize?: number;
}

export function FileUploader({ onClose, onUpload, allowedTypes, maxFileSize }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useFileUpload({
    allowedTypes,
    maxFileSize,
    onUpload: async (files) => {
      await onUpload(files);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Upload Files</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            onDrop={upload.handleDrop}
            onDragOver={upload.handleDragOver}
            onDragLeave={upload.handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              upload.isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {allowedTypes ? `Allowed types: ${allowedTypes.join(', ')}` : 'All file types allowed'}
            </p>
            {maxFileSize && (
              <p className="text-sm text-gray-500 mb-4">
                Max file size: {formatFileSize(maxFileSize)}
              </p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes?.join(',')}
              onChange={upload.handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error */}
          {upload.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{upload.error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {upload.uploadProgress.length > 0 && (
            <div className="mt-4 space-y-2">
              {upload.uploadProgress.map((progress) => (
                <div key={progress.fileName} className="flex items-center space-x-3">
                  <File size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-900">{progress.fileName}</span>
                      <span className="text-gray-500">{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress.status === 'error'
                            ? 'bg-red-500'
                            : progress.status === 'success'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
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
