/**
 * Media Browser Dialog Component
 * Opens media browser in a dialog for file selection
 * Reuses the exact same UI as the media module
 */

'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui';
import { Button } from '@repo/ui';
import { FileBrowser, type MediaFile, type MediaServerActions } from '@repo/media';
import type { MediaBrowserConfig } from '@repo/types';

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
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={`${getDialogClassName()} h-[80vh]`}>
        <DialogHeader>
          <DialogTitle>Select Media File(s)</DialogTitle>
        </DialogHeader>

        {/* Main content */}
        <div className="flex h-full overflow-hidden">
          {/* Folder Tree Sidebar (if enabled) */}
          {config.showFolderTree !== false && (
            <div className="w-64 border-r border-gray-200 overflow-auto pr-4">
              <FolderTreeView
                folders={folderTree}
                selectedPath={selectedPath}
                onSelectFolder={setSelectedPath}
              />
            </div>
          )}

          {/* File Browser */}
          <div className="flex-1 overflow-auto pl-4">
            <FileBrowser
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
