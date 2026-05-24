/**
 * File Browser Hook
 * Manages file listing, navigation, and operations
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  MediaFile,
  MediaFolder,
  MediaServiceConfig,
  UploadProgress,
} from '../types';
import { createMediaService, type MediaServerActions } from '../services/media-service';

export interface UseFileBrowserOptions {
  config: MediaServiceConfig;
  tenantId: string;
  basePath: string;
  autoLoad?: boolean;
  actions: MediaServerActions;
}

export interface UseFileBrowserResult {
  // State
  files: MediaFile[];
  folders: MediaFolder[];
  currentPath: string;
  isLoading: boolean;
  error: string | null;
  selectedFiles: MediaFile[];
  uploadProgress: UploadProgress[];

  // Actions
  loadFiles: (path?: string) => Promise<void>;
  navigateToFolder: (folderName: string) => void;
  navigateUp: () => void;
  navigateToPath: (path: string) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteFiles: (keys: string[]) => Promise<void>;
  createFolder: (folderName: string) => Promise<void>;
  renameFile: (key: string, newName: string) => Promise<void>;
  selectFile: (file: MediaFile) => void;
  toggleFileSelection: (file: MediaFile) => void;
  clearSelection: () => void;
  refresh: () => Promise<void>;
}

export function useFileBrowser(options: UseFileBrowserOptions): UseFileBrowserResult {
  const { config, tenantId, basePath, autoLoad = true, actions } = options;
  const service = createMediaService(config, tenantId, actions);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(basePath);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  /**
   * Load files and folders
   */
  const loadFiles = useCallback(
    async (path?: string) => {
      const targetPath = path ?? currentPath;
      setIsLoading(true);
      setError(null);

      try {
        const response = await service.listMedia({ path: targetPath });
        setFiles(response.files);
        setFolders(response.folders);
        setCurrentPath(targetPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
      } finally {
        setIsLoading(false);
      }
    },
    [currentPath, service]
  );

  /**
   * Navigate to a folder
   */
  const navigateToFolder = useCallback(
    (folderName: string) => {
      const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      setCurrentPath(newPath);
      loadFiles(newPath);
    },
    [currentPath, loadFiles]
  );

  /**
   * Navigate up one level
   */
  const navigateUp = useCallback(() => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      pathParts.pop();
      const newPath = pathParts.join('/');
      setCurrentPath(newPath);
      loadFiles(newPath);
    }
  }, [currentPath, loadFiles]);

  /**
   * Navigate to specific path
   */
  const navigateToPath = useCallback(
    (path: string) => {
      setCurrentPath(path);
      loadFiles(path);
    },
    [loadFiles]
  );

  /**
   * Upload files
   */
  const uploadFiles = useCallback(
    async (filesToUpload: File[]) => {
      setError(null);

      try {
        await service.uploadFiles({
          path: currentPath,
          files: filesToUpload,
          onProgress: setUploadProgress,
        });

        // Refresh file list after upload
        await loadFiles();
        setUploadProgress([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload files');
      }
    },
    [currentPath, service, loadFiles]
  );

  /**
   * Delete files
   */
  const deleteFiles = useCallback(
    async (keys: string[]) => {
      setError(null);

      try {
        await service.deleteMedia({ path: currentPath, keys });
        await loadFiles();
        setSelectedFiles([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete files');
      }
    },
    [currentPath, service, loadFiles]
  );

  /**
   * Create folder
   */
  const createFolder = useCallback(
    async (folderName: string) => {
      setError(null);

      try {
        await service.createFolder({
          path: currentPath,
          folderName,
        });
        await loadFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create folder');
      }
    },
    [currentPath, service, loadFiles]
  );

  /**
   * Rename file
   */
  const renameFile = useCallback(
    async (key: string, newName: string) => {
      setError(null);

      try {
        await service.renameMedia({ key, newName });
        await loadFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename file');
      }
    },
    [service, loadFiles]
  );

  /**
   * Select a single file (replace selection)
   */
  const selectFile = useCallback((file: MediaFile) => {
    setSelectedFiles([file]);
  }, []);

  /**
   * Toggle file selection (multi-select)
   */
  const toggleFileSelection = useCallback(
    (file: MediaFile) => {
      setSelectedFiles((prev) => {
        const isSelected = prev.some((f) => f.key === file.key);
        if (isSelected) {
          return prev.filter((f) => f.key !== file.key);
        } else {
          return [...prev, file];
        }
      });
    },
    []
  );

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  /**
   * Refresh current view
   */
  const refresh = useCallback(() => {
    return loadFiles();
  }, [loadFiles]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadFiles();
    }
  }, [autoLoad]); // Only run on mount

  // Sync currentPath when basePath prop changes
  useEffect(() => {
    if (basePath !== currentPath) {
      setCurrentPath(basePath);
      loadFiles(basePath);
    }
  }, [basePath]);

  return {
    // State
    files,
    folders,
    currentPath,
    isLoading,
    error,
    selectedFiles,
    uploadProgress,

    // Actions
    loadFiles,
    navigateToFolder,
    navigateUp,
    navigateToPath,
    uploadFiles,
    deleteFiles,
    createFolder,
    renameFile,
    selectFile,
    toggleFileSelection,
    clearSelection,
    refresh,
  };
}
