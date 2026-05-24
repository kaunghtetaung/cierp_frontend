/**
 * Media Client Component
 * Tree view navigation with drag-and-drop upload
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { FileBrowser, type MediaFile, type MediaServerActions } from '@repo/media';
import { ImageEditor } from '@repo/media/components/ImageEditor';
import { MediaPreview } from '@repo/media/components/shared/MediaPreview';
import { FolderTree, type FolderNode } from '@/components/media/FolderTree';
import { DropZone } from '@/components/media/DropZone';
import { UploadProgress, type UploadItem } from '@/components/media/UploadProgress';
import { ThumbnailUploadDialog } from '@/components/media/ThumbnailUploadDialog';
import { Upload } from 'lucide-react';

export interface MediaClientProps {
  appId: string;
  tenantId: string;
  username?: string;
}

export function MediaClient({ appId, tenantId, username = 'user' }: MediaClientProps) {
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
  const [selectedPath, setSelectedPath] = useState<string>('public');
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    file: MediaFile | null;
  }>({ isOpen: false, file: null });
  const [thumbnailDialog, setThumbnailDialog] = useState<{
    isOpen: boolean;
    pdfFile: MediaFile | null;
  }>({ isOpen: false, pdfFile: null });
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  // Build folder tree structure
  const folderTree: FolderNode[] = [
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

  // Build basePath based on selected folder
  const getBasePath = () => {
    if (selectedPath.startsWith('personal/')) {
      return selectedPath;
    }
    return selectedPath;
  };

  // Handle file selection from drag-drop or file input
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;

      console.log('[MediaClient] Starting upload for', files.length, 'files');

      const { uploadMediaAction } = await import('@/actions/media');

      // Add files to upload queue with unique IDs
      const newUploads: UploadItem[] = files.map((file, idx) => ({
        id: `${Date.now()}-${idx}-${file.name}`,
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const,
      }));

      // Add to queue immediately so progress shows
      setUploadQueue((prev) => {
        console.log('[MediaClient] Adding uploads to queue:', newUploads.length);
        return [...prev, ...newUploads];
      });

      // Upload each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        console.log('[MediaClient] Uploading file:', file.name, 'id:', uploadId);

        try {
          // Start progress simulation
          let currentProgress = 0;
          const progressInterval = setInterval(() => {
            currentProgress = Math.min(currentProgress + 15, 85);
            setUploadQueue((prev) =>
              prev.map((u) =>
                u.id === uploadId && u.status === 'uploading'
                  ? { ...u, progress: currentProgress }
                  : u
              )
            );
          }, 300);

          // Upload file via Server Action
          await uploadMediaAction({
            tenantId,
            app: appId,
            path: getBasePath(),
            file,
          });

          // Clear interval and mark complete
          clearInterval(progressInterval);

          console.log('[MediaClient] Upload complete:', file.name);

          setUploadQueue((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? { ...u, progress: 100, status: 'success' as const }
                : u
            )
          );

          // Trigger refresh after successful upload
          setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
          console.error('[MediaClient] Upload failed:', file.name, error);

          setUploadQueue((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? {
                    ...u,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : u
            )
          );
        }
      }

      console.log('[MediaClient] All uploads complete');
    },
    [tenantId, appId, selectedPath]
  );

  const handleDismissUpload = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // Handle folder tree selection (sidebar folders)
  const handleFolderSelect = useCallback((path: string) => {
    console.log('[MediaClient] Sidebar folder selected:', path);
    setSelectedPath(path);
    // Force FileBrowser to remount with new basePath
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const triggerFileInput = () => {
    document.getElementById('file-input-hidden')?.click();
  };

  // Handle edit image
  const handleFileEdit = useCallback((file: MediaFile) => {
    setEditorState({ isOpen: true, file });
  }, []);

  // Handle delete file
  const handleFileDelete = useCallback(
    async (file: MediaFile) => {
      try {
        const { deleteMediaAction } = await import('@/actions/media');
        await deleteMediaAction({
          tenantId,
          app: appId,
          path: getBasePath(),
          keys: [file.key],
        });
        // Refresh file list
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('[MediaClient] Delete failed:', error);
        alert('Failed to delete file');
      }
    },
    [tenantId, appId, selectedPath]
  );

  // Handle move file(s) to folder
  const handleFileMove = useCallback(
    async (fileKeys: string[], destinationFolder: string, sourcePath: string) => {
      try {
        const { moveMediaAction } = await import('@/actions/media');

        // Build full destination path relative to current folder
        const destinationPath = sourcePath
          ? `${sourcePath}/${destinationFolder}`
          : destinationFolder;

        console.log('[MediaClient] handleFileMove called:', {
          fileKeys,
          destinationFolder,
          sourcePath,
          destinationPath,
        });

        // fileKeys are already relative to sourcePath (just filenames like "1.jpg")
        // so we pass them directly without prepending sourcePath
        await moveMediaAction({
          tenantId,
          app: appId,
          sourceKeys: fileKeys,
          destinationPath,
          sourcePath, // Source folder where files currently are
        });

        // Refresh file list
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('[MediaClient] Move failed:', error);
        alert('Failed to move file(s): ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    },
    [tenantId, appId]
  );

  // Handle add thumbnail for PDF
  const handleAddThumbnail = useCallback((file: MediaFile) => {
    setThumbnailDialog({ isOpen: true, pdfFile: file });
  }, []);

  // Handle preview file
  const handlePreview = useCallback((file: MediaFile) => {
    setPreviewFile(file);
  }, []);

  // Handle thumbnail upload
  const handleThumbnailUpload = useCallback(
    async (thumbnailFile: File) => {
      if (!thumbnailDialog.pdfFile) return;

      try {
        const { uploadPdfThumbnailAction } = await import('@/actions/media');

        // Call special action to upload PDF thumbnail
        await uploadPdfThumbnailAction({
          tenantId,
          app: appId,
          pdfKey: thumbnailDialog.pdfFile.key,
          thumbnailFile,
        });

        // Refresh file list
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('[MediaClient] Thumbnail upload failed:', error);
        throw error;
      }
    },
    [thumbnailDialog.pdfFile, tenantId, appId]
  );

  // Handle save edited image
  const handleSaveEditedImage = useCallback(
    async (editedFile: File) => {
      if (!editorState.file) return;

      try {
        // Upload edited image
        const { uploadMediaAction } = await import('@/actions/media');

        // First delete the original
        const { deleteMediaAction } = await import('@/actions/media');
        await deleteMediaAction({
          tenantId,
          app: appId,
          path: getBasePath(),
          keys: [editorState.file.key],
        });

        // Upload the new version
        await uploadMediaAction({
          tenantId,
          app: appId,
          path: getBasePath(),
          file: editedFile,
        });

        // Close editor and refresh
        setEditorState({ isOpen: false, file: null });
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('[MediaClient] Save edited image failed:', error);
        alert('Failed to save edited image');
      }
    },
    [editorState.file, tenantId, appId, selectedPath]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Folder Tree */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
          <p className="text-sm text-gray-600 mt-1">{appId}</p>
        </div>

        <div className="flex-1 overflow-hidden">
          <FolderTree
            folders={folderTree}
            selectedPath={selectedPath}
            onSelectFolder={handleFolderSelect}
            username={username}
          />
        </div>

        {/* Upload Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={triggerFileInput}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload size={18} />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Main Content - File Browser with Drag & Drop */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb / Path */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Current folder:</span>
            <span className="font-medium text-gray-900">
              {selectedPath.replace(/\//g, ' / ')}
            </span>
          </div>
        </div>

        {/* File Browser Area with Drag & Drop */}
        <DropZone onFilesSelected={handleFilesSelected} className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <FileBrowser
              key={refreshTrigger}
              app={appId}
              tenantId={tenantId}
              basePath={selectedPath}
              actions={mediaActions}
              permissions={{
                canRead: true,
                canWrite: true,
                canDelete: true,
                canCreateFolder: true,
              }}
              multiSelect={true}
              viewMode="grid"
              onUploadClick={triggerFileInput}
              onFileEdit={handleFileEdit}
              onFileDelete={handleFileDelete}
              onAddThumbnail={handleAddThumbnail}
              onPreview={handlePreview}
              onFileMove={handleFileMove}
              onPathChange={(newPath) => {
                console.log('[MediaClient] FileBrowser path changed to:', newPath);
                setSelectedPath(newPath);
              }}
            />
          </div>
        </DropZone>
      </div>

      {/* Upload Progress Indicator */}
      <UploadProgress uploads={uploadQueue} onDismiss={handleDismissUpload} />

      {/* Image Editor Modal */}
      {editorState.isOpen && editorState.file && (
        <ImageEditor
          isOpen={editorState.isOpen}
          imageUrl={editorState.file.url}
          fileName={editorState.file.name}
          onSave={handleSaveEditedImage}
          onClose={() => setEditorState({ isOpen: false, file: null })}
        />
      )}

      {/* Thumbnail Upload Dialog */}
      <ThumbnailUploadDialog
        isOpen={thumbnailDialog.isOpen}
        pdfFile={thumbnailDialog.pdfFile}
        onUpload={handleThumbnailUpload}
        onClose={() => setThumbnailDialog({ isOpen: false, pdfFile: null })}
      />

      {/* Media Preview Modal */}
      <MediaPreview
        isOpen={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        app={appId}
        basePath={getBasePath()}
      />

      {/* Hidden File Input */}
      <input
        id="file-input-hidden"
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
