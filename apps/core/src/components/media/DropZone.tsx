/**
 * Drag and Drop Upload Zone
 * Supports file drag-and-drop with visual feedback
 */

'use client';

import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  children?: React.ReactNode;
  className?: string;
}

export function DropZone({ onFilesSelected, children, className = '' }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Check if drag is from external source (file system) or internal (file move)
  const isExternalDrag = useCallback((e: React.DragEvent) => {
    // If dataTransfer has types including 'Files', it's external
    // If it has custom types like 'text/plain', it's internal
    return e.dataTransfer.types.includes('Files');
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    // Only handle external file drags
    if (!isExternalDrag(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [isExternalDrag]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Only handle external file drags
    if (!isExternalDrag(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  }, [isExternalDrag]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      // Only handle external file drags
      if (!isExternalDrag(e)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, isExternalDrag]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <div
      className={`relative h-full ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-95 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Upload size={48} className="mx-auto text-blue-500 mb-4" />
            <p className="text-lg font-medium text-blue-700">Drop files here to upload</p>
            <p className="text-sm text-blue-600 mt-2">Release to start uploading</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-input-hidden"
      />
    </div>
  );
}
