/**
 * File Picker Modal Component
 * Modal dialog for selecting files in forms
 */

'use client';

import { useState } from 'react';
import type { FilePickerModalProps, MediaFile } from '../../types';
import { FileBrowser } from '../FileBrowser/FileBrowser';
import { X } from 'lucide-react';

export function FilePickerModal({
  isOpen,
  onClose,
  onSelect,
  basePath,
  accept,
  multiSelect = false,
  title = 'Select File',
}: FilePickerModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  if (!isOpen) return null;

  const handleFileSelect = (file: MediaFile) => {
    if (multiSelect) {
      setSelectedFiles((prev) => {
        const exists = prev.find((f) => f.key === file.key);
        if (exists) {
          return prev.filter((f) => f.key !== file.key);
        }
        return [...prev, file];
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      if (multiSelect) {
        onSelect(selectedFiles);
      } else {
        onSelect(selectedFiles[0]);
      }
      onClose();
      setSelectedFiles([]);
    }
  };

  const handleCancel = () => {
    onClose();
    setSelectedFiles([]);
  };

  // Parse accept prop to allowed types
  const allowedTypes = accept?.split(',').map((type) => type.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* File Browser */}
        <div className="flex-1 overflow-hidden">
          <FileBrowser
            tenantId="tenant-placeholder" // Will be replaced by actual tenant context
            app="core"
            basePath={basePath}
            permissions={{ canRead: true, canWrite: false, canDelete: false, canCreateFolder: false }}
            allowedTypes={allowedTypes}
            multiSelect={multiSelect}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
              : 'No files selected'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
