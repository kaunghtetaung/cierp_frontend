/**
 * Folder Tree Navigation Component
 * Shows hierarchical folder structure with expand/collapse
 */

'use client';

import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useState } from 'react';

export interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
  isExpanded?: boolean;
}

interface FolderTreeProps {
  folders: FolderNode[];
  selectedPath: string;
  onSelectFolder: (path: string) => void;
  username?: string;
}

export function FolderTree({ folders, selectedPath, onSelectFolder, username }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['public', 'private', `personal/${username}`])
  );

  const toggleExpand = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.path);
    const isSelected = selectedPath === folder.path;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.path} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectFolder(folder.path)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.path);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {isExpanded ? (
            <FolderOpen size={18} className="text-blue-500" />
          ) : (
            <Folder size={18} className="text-gray-500" />
          )}

          <span className="text-sm">{folder.name}</span>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto py-2">
      <div className="text-xs font-semibold text-gray-500 px-2 mb-2 uppercase">
        Folders
      </div>
      {folders.map((folder) => renderFolder(folder))}
    </div>
  );
}
