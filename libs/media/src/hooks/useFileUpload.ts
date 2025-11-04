/**
 * File Upload Hook
 * Handles file upload with validation and progress tracking
 */

import { useState, useCallback } from 'react';
import type { UploadProgress } from '../types';

export interface UseFileUploadOptions {
  maxFileSize?: number; // bytes
  allowedTypes?: string[]; // MIME types or extensions
  maxFiles?: number;
  onUpload: (files: File[]) => Promise<void>;
}

export interface UseFileUploadResult {
  isDragging: boolean;
  uploadProgress: UploadProgress[];
  error: string | null;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateAndUpload: (files: FileList | File[]) => Promise<void>;
  clearError: () => void;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadResult {
  const { maxFileSize, allowedTypes, maxFiles, onUpload } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate file size
   */
  const validateFileSize = useCallback(
    (file: File): boolean => {
      if (maxFileSize && file.size > maxFileSize) {
        setError(
          `File "${file.name}" exceeds maximum size of ${formatFileSize(maxFileSize)}`
        );
        return false;
      }
      return true;
    },
    [maxFileSize]
  );

  /**
   * Validate file type
   */
  const validateFileType = useCallback(
    (file: File): boolean => {
      if (!allowedTypes || allowedTypes.length === 0) {
        return true;
      }

      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isAllowed = allowedTypes.some((allowed) => {
        if (allowed.includes('*')) {
          const pattern = allowed.replace('*', '.*');
          return new RegExp(pattern).test(file.type);
        }
        if (allowed.startsWith('.')) {
          return allowed === fileExt;
        }
        return allowed === file.type;
      });

      if (!isAllowed) {
        setError(`File type "${file.type}" is not allowed`);
        return false;
      }

      return true;
    },
    [allowedTypes]
  );

  /**
   * Validate and upload files
   */
  const validateAndUpload = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);

      // Check max files
      if (maxFiles && files.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate each file
      for (const file of files) {
        if (!validateFileSize(file) || !validateFileType(file)) {
          return;
        }
      }

      // Clear error and upload
      setError(null);

      try {
        await onUpload(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [maxFiles, validateFileSize, validateFileType, onUpload]
  );

  /**
   * Handle file input change
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndUpload(e.target.files);
      }
    },
    [validateAndUpload]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        validateAndUpload(files);
      }
    },
    [validateAndUpload]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isDragging,
    uploadProgress,
    error,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
    validateAndUpload,
    clearError,
  };
}

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
