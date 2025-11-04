/**
 * Delete Confirmation Dialog Component
 */

import { AlertTriangle, X } from 'lucide-react';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  fileName?: string;
  fileCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  fileName,
  fileCount,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  const isMultiple = fileCount !== undefined && fileCount > 1;
  const isSingle = fileName !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle size={24} className="text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {isMultiple ? 'Delete Files' : 'Delete File'}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">
          {isMultiple ? (
            <>
              Are you sure you want to delete <span className="font-medium">{fileCount} files</span>? This action cannot be undone.
            </>
          ) : isSingle ? (
            <>
              Are you sure you want to delete <span className="font-medium">{fileName}</span>? This action cannot be undone.
            </>
          ) : (
            'Are you sure you want to delete the selected file(s)? This action cannot be undone.'
          )}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
