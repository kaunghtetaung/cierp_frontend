/**
 * Context Menu Component
 * Right-click context menu for file operations
 */

import { useEffect, useRef } from 'react';
import { Edit, Trash2, Image, Eye } from 'lucide-react';

export interface ContextMenuProps {
  x: number;
  y: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddThumbnail?: () => void;
  onPreview?: () => void;
  onClose: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showAddThumbnail?: boolean;
  showPreview?: boolean;
}

export function ContextMenu({
  x,
  y,
  onEdit,
  onDelete,
  onAddThumbnail,
  onPreview,
  onClose,
  showEdit = true,
  showDelete = true,
  showAddThumbnail = false,
  showPreview = false,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
      style={{ top: y, left: x }}
    >
      {showPreview && onPreview && (
        <button
          onClick={() => {
            onPreview();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Eye size={16} />
          Preview
        </button>
      )}
      {showEdit && onEdit && (
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Edit size={16} />
          Edit Image
        </button>
      )}
      {showAddThumbnail && onAddThumbnail && (
        <button
          onClick={() => {
            onAddThumbnail();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Image size={16} />
          Add Thumbnail
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete
        </button>
      )}
    </div>
  );
}
