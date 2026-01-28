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
import { cn } from '@repo/utils';
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
  isDropTarget?: boolean;
  dropPosition?: 'before' | 'after' | 'inside' | null;
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
  isDropTarget = false,
  dropPosition = null,
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
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 hover:bg-accent/60 rounded-lg transition-all duration-200 group border border-border/50 hover:border-border hover:shadow-md bg-card/50",
        isDropTarget && dropPosition === 'inside' && "ring-2 ring-primary bg-primary/10 border-primary",
        isDropTarget && dropPosition === 'before' && "border-t-2 border-t-primary",
        isDropTarget && dropPosition === 'after' && "border-b-2 border-b-primary"
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />
      </div>

      {/* Expand button */}
      <button
        type="button"
        onClick={() => hasChildren && onToggleExpand(item._id)}
        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-accent/50 transition-colors ${
          !hasChildren ? 'invisible' : ''
        }`}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Icon with gradient background */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Menu className="h-3.5 w-3.5 text-primary" />
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-medium text-sm leading-tight ${!item.isVisible ? 'text-muted-foreground/70 line-through' : 'text-foreground'}`}>
            {safeString(item.title?.en) || safeString(item.title?.mm) || 'Untitled'}
          </span>
          {item.openInNewTab && (
            <ExternalLink className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5 leading-tight">
          {item.type === 'external' && item.url && (
            <span className="truncate max-w-md font-mono">{item.url}</span>
          )}
          {item.type === 'page' && (
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-blue-500/10">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-blue-700 dark:text-blue-400">Page</span>
            </span>
          )}
          {item.type === 'post' && (
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-purple-500/10">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="text-purple-700 dark:text-purple-400">Post</span>
            </span>
          )}
          {item.type === 'category' && (
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-orange-500/10">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-orange-700 dark:text-orange-400">Category</span>
            </span>
          )}
          {item.type === 'internal' && (
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-green-500/10">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-700 dark:text-green-400 font-mono">/{item.slug}</span>
            </span>
          )}
          {item.type === 'custom' && (
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-gray-500/10">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500" />
              <span className="text-gray-700 dark:text-gray-400">Custom</span>
            </span>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!item.isVisible && (
          <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">Hidden</Badge>
        )}
        {item.requiresAuth && (
          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">Auth</Badge>
        )}
        {getStatusBadge(item.status)}
      </div>

      {/* Quick action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-600"
          onClick={() => onCreateChild(item._id)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only">Add Child Item</span>
        </Button>

        {item.deletedAt ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-green-500/10 hover:text-green-600"
            onClick={() => onRestore(item)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="sr-only">Restore</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        )}

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-accent"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onCreateChild(item._id)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child Item
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleVisibility(item)}>
            {item.isVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide from Menu
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show in Menu
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
    </div>
  );
}
