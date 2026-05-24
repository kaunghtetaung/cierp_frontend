/**
 * Media Browser Dialog Component
 * Opens media browser in a dialog for file selection
 * Reuses the exact same UI as the media module
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui';
import { Button } from '@repo/ui';
import { FileBrowser, type MediaFile, type MediaServerActions } from '@repo/media';
import type { MediaBrowserConfig } from '@repo/types';
import { PanelLeftClose, PanelLeft, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Upload progress tracking
interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// Folder tree structure (same as media module)
interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
}

export interface MediaBrowserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: MediaFile[]) => void;
  config: MediaBrowserConfig;
  tenantId: string;
  appId: string;
  username?: string;
  currentLanguage: string;
}

export function MediaBrowserDialog({
  isOpen,
  onClose,
  onSelect,
  config,
  tenantId,
  appId,
  username = 'user',
  currentLanguage,
}: MediaBrowserDialogProps) {
  const [selectedPath, setSelectedPath] = useState(config.basePath || 'public');
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar hidden by default
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);

  // Default expiry options (in seconds)
  const defaultExpiryOptions = [
    { label: 'Permanent', value: 604800 * 520 }, // ~10 years (max S3 allows is 7 days for presigned, but we'll handle permanent differently)
    { label: '1 Month', value: 2592000 }, // 30 days
    { label: '1 Year', value: 31536000 }, // 365 days
  ];

  const expiryOptions = config.expiryOptions || defaultExpiryOptions;
  const [selectedExpiry, setSelectedExpiry] = useState<number>(
    config.signedUrlExpiry || expiryOptions[0].value
  );

  // Build folder tree based on config
  const folderTree: FolderNode[] = buildFolderTree(config, username);

  // Import server actions dynamically
  const mediaActions = useMemo<MediaServerActions>(() => {
    return {
      listMediaAction: async (params) => {
        const actions = await import('@/actions/media');
        return actions.listMediaAction(params);
      },
      uploadMediaAction: async (params) => {
        const actions = await import('@/actions/media');
        return actions.uploadMediaAction(params);
      },
      deleteMediaAction: async (params) => {
        const actions = await import('@/actions/media');
        return actions.deleteMediaAction(params);
      },
      createFolderAction: async (params) => {
        const actions = await import('@/actions/media');
        return actions.createFolderAction(params);
      },
      moveMediaAction: async (params) => {
        const actions = await import('@/actions/media');
        return actions.moveMediaAction(params);
      },
      renameMediaAction: async (params) => {
        const actions = await import('@/actions/media');
        return actions.renameMediaAction(params);
      },
    };
  }, []);

  const handleFileSelect = (file: MediaFile) => {
    if (config.selectionMode === 'single') {
      setSelectedFiles([file]);
    } else {
      // Toggle selection for multiple mode
      setSelectedFiles((prev) =>
        prev.some((f) => f.key === file.key)
          ? prev.filter((f) => f.key !== file.key)
          : prev.length < (config.maxFiles || 10)
          ? [...prev, file]
          : prev
      );
    }
  };

  const handleConfirm = async () => {
    // Process files based on public/private and signed URL configuration
    const processedFiles = await Promise.all(
      selectedFiles.map(async (file) => {
        const isPublicFile = file.key?.startsWith('public/') || file.key?.includes('/public/');

        // If file is in public folder, always use public URL (no signed URL)
        if (isPublicFile) {
          return file; // Keep original public URL
        }

        // For private files, check if we need signed URL
        const useSignedUrl = config.useSignedUrl !== false; // Default: true

        if (useSignedUrl && (file.key?.startsWith('private/') || file.key?.includes('/private/'))) {
          // TODO: Call server action to generate signed URL with selectedExpiry
          // For now, return file with note that it needs signed URL
          return {
            ...file,
            _requiresSignedUrl: true,
            _signedUrlExpiry: selectedExpiry,
          };
        }

        return file;
      })
    );

    onSelect(processedFiles as MediaFile[]);
    setSelectedFiles([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    onClose();
  };

  const handleUpload = useCallback(async (files: File[]) => {
    try {
      const { uploadMediaAction } = await import('@/actions/media');

      // Process files sequentially with progress tracking
      for (const file of files) {
        const uploadId = `${file.name}-${Date.now()}`;

        // Add to upload queue
        setUploadQueue(prev => [...prev, {
          id: uploadId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        }]);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(item =>
            item.id === uploadId && item.progress < 85
              ? { ...item, progress: Math.min(item.progress + 15, 85) }
              : item
          ));
        }, 300);

        try {
          await uploadMediaAction({
            tenantId,
            app: appId,
            path: selectedPath,
            file,
          });

          // Upload successful
          clearInterval(progressInterval);
          setUploadQueue(prev => prev.map(item =>
            item.id === uploadId
              ? { ...item, progress: 100, status: 'success' }
              : item
          ));
        } catch (uploadError) {
          // Upload failed
          clearInterval(progressInterval);
          setUploadQueue(prev => prev.map(item =>
            item.id === uploadId
              ? {
                  ...item,
                  status: 'error',
                  error: uploadError instanceof Error ? uploadError.message : 'Upload failed'
                }
              : item
          ));
        }
      }

      // Refresh the file list after all uploads complete
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [tenantId, appId, selectedPath]);

  const handleDismissUpload = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const getDialogClassName = () => {
    const size = config.dialogSize || 'xl';
    const sizeClasses = {
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-[95vw]',
    };
    return sizeClasses[size];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent className={`${getDialogClassName()} h-[80vh]`}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle Button */}
              {config.showFolderTree !== false && (
                <button
                  type="button"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                  aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                  title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                >
                  {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                </button>
              )}
              <DialogTitle>Select Media File(s)</DialogTitle>
            </div>
          </DialogHeader>

        {/* Main content */}
        <div className="flex h-full overflow-hidden">
          {/* Folder Tree Sidebar (hidden by default, toggleable) */}
          {config.showFolderTree !== false && showSidebar && (
            <div className="w-64 border-r border-gray-200 overflow-auto pr-4">
              <FolderTreeView
                folders={folderTree}
                selectedPath={selectedPath}
                onSelectFolder={setSelectedPath}
              />
            </div>
          )}

          {/* File Browser */}
          <div className={`flex-1 overflow-auto ${showSidebar ? 'pl-4' : ''}`}>
            <FileBrowser
              key={refreshTrigger}
              app={appId}
              tenantId={tenantId}
              basePath={selectedPath}
              viewMode={config.viewMode || 'grid'}
              multiSelect={config.selectionMode === 'multiple'}
              onFileSelect={handleFileSelect}
              allowedTypes={config.allowedTypes}
              maxFileSize={config.maxFileSize}
              actions={mediaActions}
              permissions={{
                canRead: true,
                canWrite: config.allowUpload !== false,
                canDelete: false,
                canCreateFolder: false,
              }}
              onUploadClick={
                config.allowUpload !== false
                  ? () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      if (config.allowedTypes && config.allowedTypes.length > 0) {
                        input.accept = config.allowedTypes.join(',');
                      }
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length > 0) {
                          handleUpload(files);
                        }
                      };
                      input.click();
                    }
                  : undefined
              }
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {selectedFiles.length > 0 && (
                  <span>
                    {selectedFiles.length} file(s) selected
                    {config.maxFiles && config.selectionMode === 'multiple' && (
                      <span className="ml-2 text-gray-500">
                        (max: {config.maxFiles})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Expiry dropdown for private files */}
              {config.allowExpirySelection && selectedFiles.some(f =>
                f.key?.startsWith('private/') || f.key?.includes('/private/')
              ) && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Expiry:</label>
                  <select
                    value={selectedExpiry}
                    onChange={(e) => setSelectedExpiry(Number(e.target.value))}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {expiryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedFiles.length === 0}
              >
                Select
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Upload Progress Indicator - Rendered outside Dialog */}
      {uploadQueue.length > 0 && (
        <UploadProgressIndicator uploads={uploadQueue} onDismiss={handleDismissUpload} />
      )}
    </>
  );
}

/**
 * Upload Progress Indicator Component
 * Shows progress for file uploads with status (same as media module)
 */
function UploadProgressIndicator({
  uploads,
  onDismiss,
}: {
  uploads: UploadItem[];
  onDismiss?: (id: string) => void;
}) {
  if (uploads.length === 0) {
    return null;
  }

  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const completedUploads = uploads.filter((u) => u.status !== 'uploading');

  return (
    <div
      className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200"
      style={{ zIndex: 1080 }}
    >
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
                      type="button"
                      onClick={() => onDismiss(upload.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Dismiss"
                      aria-label="Dismiss upload"
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
            type="button"
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

/**
 * Folder Tree View Component
 */
function FolderTreeView({
  folders,
  selectedPath,
  onSelectFolder,
}: {
  folders: FolderNode[];
  selectedPath: string;
  onSelectFolder: (path: string) => void;
}) {
  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isSelected = selectedPath === folder.path;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.path}>
        <button
          onClick={() => onSelectFolder(folder.path)}
          className={`
            w-full text-left px-3 py-2 rounded-md text-sm
            ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}
          `}
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          {folder.name}
        </button>
        {hasChildren && (
          <div className="mt-1">
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {folders.map((folder) => renderFolder(folder))}
    </div>
  );
}

/**
 * Build folder tree based on configuration
 */
function buildFolderTree(config: MediaBrowserConfig, username: string): FolderNode[] {
  const tree: FolderNode[] = [];

  // Determine which folders to show
  const allowedFolders = config.allowedFolders;
  const basePath = config.basePath;

  // If restrictToPath is true, only show basePath
  if (config.restrictToPath && basePath) {
    return [
      {
        name: basePath.split('/').pop() || basePath,
        path: basePath,
      },
    ];
  }

  // Build full folder tree
  const allFolders: FolderNode[] = [
    {
      name: 'Public',
      path: 'public',
      children: [],
    },
    {
      name: 'Private',
      path: 'private',
      children: [
        {
          name: 'Common',
          path: 'private/common',
        },
        {
          name: 'Departments',
          path: 'private/departments',
        },
      ],
    },
    {
      name: 'Personal',
      path: `personal/${username}`,
      children: [],
    },
  ];

  // Filter by allowedFolders if specified
  if (allowedFolders && allowedFolders.length > 0) {
    return allFolders.filter((folder) =>
      allowedFolders.some((allowed) => folder.path.startsWith(allowed))
    );
  }

  return allFolders;
}
