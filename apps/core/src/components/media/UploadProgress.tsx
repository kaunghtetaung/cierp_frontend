/**
 * Upload Progress Indicator
 * Shows progress for file uploads with status
 */

'use client';

import { CheckCircle, XCircle, Loader2, File } from 'lucide-react';

export interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onDismiss?: (id: string) => void;
}

export function UploadProgress({ uploads, onDismiss }: UploadProgressProps) {
  if (uploads.length === 0) {
    return null;
  }

  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const completedUploads = uploads.filter((u) => u.status !== 'uploading');

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">
          {activeUploads.length > 0 ? (
            <span>
              Uploading {activeUploads.length} file{activeUploads.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span>Upload Complete</span>
          )}
        </h3>
      </div>

      {/* Upload Items */}
      <div className="divide-y divide-gray-100">
        {uploads.map((upload) => (
          <div key={upload.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {upload.status === 'uploading' && (
                  <Loader2 size={18} className="text-blue-500 animate-spin" />
                )}
                {upload.status === 'success' && (
                  <CheckCircle size={18} className="text-green-500" />
                )}
                {upload.status === 'error' && (
                  <XCircle size={18} className="text-red-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.fileName}
                  </p>
                  {upload.status !== 'uploading' && onDismiss && (
                    <button
                      onClick={() => onDismiss(upload.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {upload.status === 'uploading' && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{upload.progress}%</p>
                  </div>
                )}

                {/* Error Message */}
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}

                {/* Success Message */}
                {upload.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">Upload complete</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      {completedUploads.length > 0 && activeUploads.length === 0 && (
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2">
          <button
            onClick={() => completedUploads.forEach((u) => onDismiss?.(u.id))}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
