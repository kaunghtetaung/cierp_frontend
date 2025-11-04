/**
 * File List View Component
 */

import type { MediaFile, MediaFolder } from '../../types';
import { FileIcon } from '../shared/FileIcon';
import { Folder, CheckSquare, Square } from 'lucide-react';
import { formatFileSize, formatDate } from '../../utils/formatters';

export interface FileListProps {
  files: MediaFile[];
  folders: MediaFolder[];
  selectedFiles: MediaFile[];
  onFileClick: (file: MediaFile) => void;
  onFileDoubleClick?: (file: MediaFile) => void;
  onFolderClick: (folderName: string) => void;
  multiSelect?: boolean;
}

export function FileList({
  files,
  folders,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  onFolderClick,
  multiSelect,
}: FileListProps) {
  const isFileSelected = (file: MediaFile) => {
    return selectedFiles.some((f) => f.key === file.key);
  };

  return (
    <div className="divide-y divide-gray-200">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
        {multiSelect && <div className="col-span-1"></div>}
        <div className={multiSelect ? 'col-span-6' : 'col-span-7'}>Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-3">Modified</div>
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onFolderClick(folder.name)}
          className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left"
        >
          {multiSelect && <div className="col-span-1"></div>}
          <div className={`flex items-center ${multiSelect ? 'col-span-6' : 'col-span-7'}`}>
            <Folder size={20} className="text-blue-500 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 truncate">{folder.name}</span>
          </div>
          <div className="col-span-2 text-sm text-gray-500">—</div>
          <div className="col-span-3 text-sm text-gray-500">—</div>
        </button>
      ))}

      {/* Files */}
      {files.map((file) => {
        const selected = isFileSelected(file);

        return (
          <div
            key={file.key}
            onClick={() => onFileClick(file)}
            onDoubleClick={() => onFileDoubleClick?.(file)}
            className={`grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-colors ${
              selected ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            {multiSelect && (
              <div className="col-span-1 flex items-center">
                {selected ? (
                  <CheckSquare size={18} className="text-blue-600" />
                ) : (
                  <Square size={18} className="text-gray-400" />
                )}
              </div>
            )}
            <div className={`flex items-center ${multiSelect ? 'col-span-6' : 'col-span-7'}`}>
              <FileIcon fileName={file.name} mimeType={file.type} size={20} className="mr-3 flex-shrink-0" />
              <span className={`text-sm truncate ${selected ? 'font-medium text-gray-900' : 'text-gray-900'}`}>
                {file.name}
              </span>
            </div>
            <div className="col-span-2 text-sm text-gray-500">{formatFileSize(file.size)}</div>
            <div className="col-span-3 text-sm text-gray-500">{formatDate(file.lastModified)}</div>
          </div>
        );
      })}

      {/* Empty state */}
      {folders.length === 0 && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileIcon size={48} className="mb-2" />
          <p>No files or folders</p>
        </div>
      )}
    </div>
  );
}
