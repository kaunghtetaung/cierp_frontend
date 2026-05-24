/**
 * File Browser Component
 * Main component for browsing and managing files
 */

'use client';

import { useState, useEffect } from 'react';
import type { MediaBrowserProps, MediaServiceConfig, MediaFile } from '../../types';
import type { MediaServerActions } from '../../services/media-service';
import { useFileBrowser } from '../../hooks/useFileBrowser';
import { Breadcrumb } from '../shared/Breadcrumb';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FileActions } from './FileActions';
import { Grid, List, RefreshCw, FolderPlus, Upload, Loader2 } from 'lucide-react';

export interface FileBrowserProps extends MediaBrowserProps {
  app: string;
  tenantId: string;
  apiBasePath?: string;
  actions: MediaServerActions;
  onUploadClick?: () => void;
  onFileEdit?: (file: MediaFile) => void;
  onFileDelete?: (file: MediaFile) => void;
  onAddThumbnail?: (file: MediaFile) => void;
  onPreview?: (file: MediaFile) => void;
  onFileMove?: (fileKeys: string[], destinationFolder: string, sourcePath: string) => void;
  onPathChange?: (newPath: string) => void;
}

export function FileBrowser({
  app,
  tenantId,
  basePath,
  permissions = { canRead: true, canWrite: false, canDelete: false, canCreateFolder: false },
  allowedTypes,
  maxFileSize,
  viewMode: initialViewMode = 'grid',
  onFileSelect,
  multiSelect = false,
  apiBasePath = '/api/media',
  actions,
  onUploadClick,
  onFileEdit,
  onFileDelete,
  onAddThumbnail,
  onPreview,
  onFileMove,
  onPathChange,
}: FileBrowserProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);

  const config: MediaServiceConfig = {
    apiBasePath,
    app,
  };

  const browser = useFileBrowser({
    config,
    tenantId,
    basePath,
    autoLoad: true,
    actions,
  });

  // Notify parent component when path changes
  useEffect(() => {
    if (onPathChange && browser.currentPath) {
      onPathChange(browser.currentPath);
    }
  }, [browser.currentPath, onPathChange]);

  const handleFileClick = (file: any) => {
    if (multiSelect) {
      browser.toggleFileSelection(file);
      // Also notify the parent — without this, the MediaBrowserDialog's own
      // selectedFiles state stays empty in multi-select mode, leaving the
      // Select button disabled forever.
      onFileSelect?.(file);
    } else {
      browser.selectFile(file);
      onFileSelect?.(file);
    }
  };

  const handleFileDoubleClick = (file: any) => {
    if (!multiSelect) {
      onFileSelect?.(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={() => browser.refresh()}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Refresh"
            disabled={browser.isLoading}
          >
            <RefreshCw size={18} className={browser.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Upload */}
          {permissions.canWrite && onUploadClick && (
            <button
              onClick={onUploadClick}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Upload size={16} className="mr-2" />
              Upload
            </button>
          )}

          {/* Create Folder */}
          {permissions.canCreateFolder && (
            <button
              onClick={() => {
                const folderName = window.prompt('Enter folder name:');
                if (folderName) {
                  browser.createFolder(folderName);
                }
              }}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FolderPlus size={16} className="mr-2" />
              New Folder
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-3 border-b border-gray-200">
        <Breadcrumb path={browser.currentPath} onNavigate={browser.navigateToPath} />
      </div>

      {/* File Actions (when files selected) */}
      {browser.selectedFiles.length > 0 && (
        <FileActions
          selectedFiles={browser.selectedFiles}
          permissions={permissions}
          onDelete={() => browser.deleteFiles(browser.selectedFiles.map((f) => f.key))}
          onClearSelection={browser.clearSelection}
        />
      )}

      {/* Error */}
      {browser.error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{browser.error}</p>
        </div>
      )}

      {/* File View */}
      <div className="flex-1 overflow-auto">
        {browser.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : viewMode === 'grid' ? (
          <FileGrid
            files={browser.files}
            folders={browser.folders}
            selectedFiles={browser.selectedFiles}
            currentPath={browser.currentPath}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            onFolderClick={browser.navigateToFolder}
            onFileEdit={onFileEdit}
            onFileDelete={onFileDelete}
            onAddThumbnail={onAddThumbnail}
            onPreview={onPreview}
            onFileMove={onFileMove}
            multiSelect={multiSelect}
          />
        ) : (
          <FileList
            files={browser.files}
            folders={browser.folders}
            selectedFiles={browser.selectedFiles}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            onFolderClick={browser.navigateToFolder}
            multiSelect={multiSelect}
          />
        )}
      </div>
    </div>
  );
}
