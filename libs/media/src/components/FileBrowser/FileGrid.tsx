/**
 * File Grid View Component
 */

import { useState } from 'react';
import type { MediaFile, MediaFolder } from '../../types';
import { Thumbnail } from '../shared/Thumbnail';
import { FileIcon } from '../shared/FileIcon';
import { ContextMenu } from '../shared/ContextMenu';
import { DeleteConfirmDialog } from '../shared/DeleteConfirmDialog';
import { Folder, Check } from 'lucide-react';
import { formatFileSize, formatDate } from '../../utils/formatters';

export interface FileGridProps {
  files: MediaFile[];
  folders: MediaFolder[];
  selectedFiles: MediaFile[];
  currentPath: string;
  onFileClick: (file: MediaFile) => void;
  onFileDoubleClick?: (file: MediaFile) => void;
  onFolderClick: (folderName: string) => void;
  onFileEdit?: (file: MediaFile) => void;
  onFileDelete?: (file: MediaFile) => void;
  onAddThumbnail?: (file: MediaFile) => void;
  onPreview?: (file: MediaFile) => void;
  onFileMove?: (fileKeys: string[], destinationFolder: string, sourcePath: string) => void;
  multiSelect?: boolean;
}

export function FileGrid({
  files,
  folders,
  selectedFiles,
  currentPath,
  onFileClick,
  onFileDoubleClick,
  onFolderClick,
  onFileEdit,
  onFileDelete,
  onAddThumbnail,
  onPreview,
  onFileMove,
  multiSelect,
}: FileGridProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: MediaFile;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<MediaFile | null>(null);
  const [draggedFile, setDraggedFile] = useState<MediaFile | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const isFileSelected = (file: MediaFile) => {
    return selectedFiles.some((f) => f.key === file.key);
  };

  const handleContextMenu = (e: React.MouseEvent, file: MediaFile) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleEdit = () => {
    if (contextMenu?.file && onFileEdit) {
      onFileEdit(contextMenu.file);
    }
  };

  const handleDeleteClick = () => {
    if (contextMenu?.file) {
      setDeleteDialog(contextMenu.file);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog && onFileDelete) {
      onFileDelete(deleteDialog);
      setDeleteDialog(null);
    }
  };

  const isImage = (file: MediaFile) => {
    // Check MIME type first
    if (file.type && file.type.startsWith('image/')) {
      return true;
    }

    // Fallback to file extension check
    const ext = file.name.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'tif'];
    return imageExtensions.includes(ext || '');
  };

  const isPdf = (file: MediaFile) => {
    // Check MIME type first
    if (file.type === 'application/pdf') {
      return true;
    }

    // Fallback to file extension check
    const ext = file.name.toLowerCase().split('.').pop();
    return ext === 'pdf';
  };

  const handleAddThumbnail = () => {
    if (contextMenu?.file && onAddThumbnail) {
      onAddThumbnail(contextMenu.file);
    }
  };

  const handlePreview = () => {
    if (contextMenu?.file && onPreview) {
      onPreview(contextMenu.file);
    }
  };

  // Check if file can be previewed
  const isPreviewable = (file: MediaFile) => {
    // Get file extension for fallback
    const ext = file.name.toLowerCase().split('.').pop() || '';

    // Images - check MIME type first, then extension
    if (file.type?.startsWith('image/')) return true;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'tif'];
    if (imageExtensions.includes(ext)) return true;

    // PDFs - check MIME type first, then extension
    if (file.type === 'application/pdf' || ext === 'pdf') return true;

    // Audio files - check MIME type first, then extension
    if (file.type?.startsWith('audio/')) return true;
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    if (audioExtensions.includes(ext)) return true;

    // Video files - check MIME type first, then extension
    if (file.type?.startsWith('video/')) return true;
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    if (videoExtensions.includes(ext)) return true;

    return false;
  };

  // Find custom thumbnail for PDF files
  // Thumbnails are stored in {directory}/.thumbnails/{pdfname}_small.webp
  const getCustomThumbnail = (file: MediaFile): string | undefined => {
    if (!isPdf(file)) return undefined;

    // Check if file has thumbnails property (added by listMedia)
    if (file.thumbnails?.small) {
      return file.thumbnails.small;
    }

    // Fallback: construct the expected thumbnail URL
    // If PDF is at "core/public/document.pdf", thumbnail is at "core/public/.thumbnails/document_small.webp"
    const pdfBaseName = file.name.replace(/\.pdf$/i, '');
    const pdfDirectory = file.key.substring(0, file.key.lastIndexOf('/'));
    const thumbnailKey = `${pdfDirectory}/.thumbnails/${pdfBaseName}_small.webp`;

    // Construct the thumbnail URL by replacing the file key with thumbnail key
    const thumbnailUrl = file.url.replace(encodeURIComponent(file.key), encodeURIComponent(thumbnailKey));

    return thumbnailUrl;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, file: MediaFile) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folderName);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedFile || !onFileMove) return;

    // If file is selected along with others, move all selected files
    const filesToMove = isFileSelected(draggedFile)
      ? selectedFiles.map((f) => f.key)
      : [draggedFile.key];

    onFileMove(filesToMove, folderName, currentPath);
    setDraggedFile(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {/* Folders */}
        {folders.map((folder) => (
          <button
            key={folder.path}
            onClick={() => onFolderClick(folder.name)}
            onDragOver={(e) => handleDragOver(e, folder.name)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.name)}
            className={`flex flex-col items-center p-4 rounded-lg border transition-colors ${
              dropTarget === folder.name
                ? 'border-blue-500 bg-blue-50 border-2'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Folder size={48} className={dropTarget === folder.name ? 'text-blue-600' : 'text-blue-500'} />
            <span className="text-sm font-medium text-gray-900 truncate w-full text-center">
              {folder.name}
            </span>
            {dropTarget === folder.name && (
              <span className="text-xs text-blue-600 mt-1">Drop here</span>
            )}
          </button>
        ))}

        {/* Files */}
        {files.map((file) => (
          <div
            key={file.key}
            draggable
            onDragStart={(e) => handleDragStart(e, file)}
            onDragEnd={handleDragEnd}
            onClick={() => onFileClick(file)}
            onDoubleClick={() => {
              // If file is previewable and onPreview is available, show preview
              // Otherwise use onFileDoubleClick if provided
              if (isPreviewable(file) && onPreview) {
                onPreview(file);
              } else if (onFileDoubleClick) {
                onFileDoubleClick(file);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, file)}
            className={`relative flex flex-col items-center p-4 rounded-lg border cursor-move transition-colors ${
              isFileSelected(file)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            } ${draggedFile?.key === file.key ? 'opacity-50' : ''}`}
          >
            {/* Selection Checkmark */}
            {isFileSelected(file) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check size={16} className="text-white" />
              </div>
            )}

            <div className="mb-2">
              <Thumbnail
                url={file.thumbnails?.small || file.thumbnail || file.url}
                fileName={file.name}
                mimeType={file.type}
                size={48}
                className="rounded"
                customThumbnailUrl={getCustomThumbnail(file)}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 truncate w-full text-center mb-1">
              {file.name}
            </span>
            <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
          </div>
        ))}

        {/* Empty state */}
        {folders.length === 0 && files.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
            <FileIcon size={48} className="mb-2" />
            <p>No files or folders</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onPreview={isPreviewable(contextMenu.file) && onPreview ? handlePreview : undefined}
          onEdit={isImage(contextMenu.file) && onFileEdit ? handleEdit : undefined}
          onAddThumbnail={isPdf(contextMenu.file) && onAddThumbnail ? handleAddThumbnail : undefined}
          onDelete={onFileDelete ? handleDeleteClick : undefined}
          onClose={() => setContextMenu(null)}
          showPreview={isPreviewable(contextMenu.file)}
          showEdit={isImage(contextMenu.file)}
          showAddThumbnail={isPdf(contextMenu.file)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <DeleteConfirmDialog
          isOpen={true}
          fileName={deleteDialog.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog(null)}
        />
      )}
    </>
  );
}
