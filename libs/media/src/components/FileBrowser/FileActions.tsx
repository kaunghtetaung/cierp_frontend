/**
 * File Actions Component
 * Shows actions for selected files
 */

import { useState } from 'react';
import type { MediaFile, MediaPermissions } from '../../types';
import { Trash2, X, Download } from 'lucide-react';
import { DeleteConfirmDialog } from '../shared/DeleteConfirmDialog';

export interface FileActionsProps {
  selectedFiles: MediaFile[];
  permissions: MediaPermissions;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function FileActions({
  selectedFiles,
  permissions,
  onDelete,
  onClearSelection,
}: FileActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const handleDownload = () => {
    // Download first selected file
    if (selectedFiles.length > 0) {
      window.open(selectedFiles[0].url, '_blank');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            {selectedFiles.length} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download */}
          {selectedFiles.length === 1 && (
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download size={16} className="mr-1.5" />
              Download
            </button>
          )}

          {/* Delete */}
          {permissions.canDelete && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <Trash2 size={16} className="mr-1.5" />
              Delete
            </button>
          )}

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-1.5 hover:bg-white rounded-md transition-colors"
            aria-label="Clear selection"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        fileCount={selectedFiles.length}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
