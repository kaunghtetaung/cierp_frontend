'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui';
import { Button, Badge } from '@repo/ui';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  GripVertical,
  Menu,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  CornerUpLeft,
} from 'lucide-react';
import type { MenuTreeNode, EntityStatus } from '../common/types';

interface SortableMenuTreeItemProps {
  item: MenuTreeNode;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleExpand: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onEdit: (item: MenuTreeNode) => void;
  onDelete: (item: MenuTreeNode) => void;
  onToggleVisibility: (item: MenuTreeNode) => void;
  onRestore: (item: MenuTreeNode) => void;
  onMoveUp: (item: MenuTreeNode) => void;
  onMoveDown: (item: MenuTreeNode) => void;
  onMakeSubItem: (item: MenuTreeNode) => void;
  onPromote: (item: MenuTreeNode) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMakeSubItem: boolean;
  canPromote: boolean;
  previousSiblingTitle?: string;
}

function getStatusBadge(status: EntityStatus) {
  switch (status) {
    case 'Active':
      return <Badge variant="success" className="text-xs">Active</Badge>;
    case 'Inactive':
      return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

export function SortableMenuTreeItem({
  item,
  isExpanded,
  hasChildren,
  onToggleExpand,
  onCreateChild,
  onEdit,
  onDelete,
  onToggleVisibility,
  onRestore,
  onMoveUp,
  onMoveDown,
  onMakeSubItem,
  onPromote,
  canMoveUp: canUp,
  canMoveDown: canDown,
  canMakeSubItem: canDemote,
  canPromote: canPromoteItem,
  previousSiblingTitle,
}: SortableMenuTreeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Expand button */}
      <button
        onClick={() => hasChildren && onToggleExpand(item._id)}
        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-muted ${
          !hasChildren ? 'invisible' : ''
        }`}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Icon */}
      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
        <Menu className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${!item.isVisible ? 'text-muted-foreground' : ''}`}>
            {safeString(item.title?.en) || safeString(item.title?.mm) || 'Untitled'}
          </span>
          {item.openInNewTab && (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.type === 'external' && item.url && (
            <span className="truncate">{item.url}</span>
          )}
          {item.type === 'page' && <span>Page Link</span>}
          {item.type === 'post' && <span>Post Link</span>}
          {item.type === 'category' && <span>Category Link</span>}
          {item.type === 'internal' && <span>/{item.slug}</span>}
          {item.type === 'custom' && <span>Custom</span>}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2">
        {!item.isVisible && (
          <Badge variant="secondary" className="text-xs">Hidden</Badge>
        )}
        {item.requiresAuth && (
          <Badge variant="outline" className="text-xs">Auth</Badge>
        )}
        {getStatusBadge(item.status)}
      </div>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onCreateChild(item._id)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleVisibility(item)}>
            {item.isVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Move Up / Move Down */}
          <DropdownMenuItem onClick={() => onMoveUp(item)} disabled={!canUp}>
            <ArrowUp className="h-4 w-4 mr-2" />
            Move Up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMoveDown(item)} disabled={!canDown}>
            <ArrowDown className="h-4 w-4 mr-2" />
            Move Down
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Make Sub-item / Promote */}
          {canDemote && (
            <DropdownMenuItem onClick={() => onMakeSubItem(item)}>
              <CornerDownRight className="h-4 w-4 mr-2" />
              Make sub-item of &quot;{previousSiblingTitle}&quot;
            </DropdownMenuItem>
          )}
          {canPromoteItem && (
            <DropdownMenuItem onClick={() => onPromote(item)}>
              <CornerUpLeft className="h-4 w-4 mr-2" />
              Move to parent level
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete / Restore */}
          {item.deletedAt ? (
            <DropdownMenuItem onClick={() => onRestore(item)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => onDelete(item)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
