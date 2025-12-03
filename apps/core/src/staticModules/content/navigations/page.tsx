'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import { Button, Badge } from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Menu,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import {
  getMenuTree,
  deleteNavigationItem,
  restoreNavigationItem,
  updateNavigationItem,
} from '../common/actions';
import type { MenuTreeNode, MenuType, EntityStatus } from '../common/types';
import { NavigationForm } from './NavigationForm';

// Menu type labels
const menuTypeLabels: Record<MenuType, string> = {
  header: 'Header Menu',
  footer: 'Footer Menu',
  sidebar: 'Sidebar Menu',
  mobile: 'Mobile Menu',
  custom: 'Custom Menu',
};

export default function NavigationPage() {
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeMenuType, setActiveMenuType] = useState<MenuType>('header');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuTreeNode | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuTreeNode | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  // Load menu tree
  const loadMenuTree = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMenuTree(activeMenuType);
      if (result.success && result.data) {
        setMenuTree(result.data);
        // Expand all by default
        const allIds = new Set<string>();
        const collectIds = (nodes: MenuTreeNode[]) => {
          nodes.forEach((node) => {
            allIds.add(node._id);
            if (node.children?.length) {
              collectIds(node.children);
            }
          });
        };
        collectIds(result.data);
        setExpandedIds(allIds);
      } else {
        toastError(result.error || 'Failed to load menu');
      }
    } catch (error) {
      console.error('Load menu tree error:', error);
      toastError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [activeMenuType]);

  useEffect(() => {
    loadMenuTree();
  }, [loadMenuTree]);

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle create
  const handleCreate = (parentItemId?: string) => {
    console.log('handleCreate called, parentItemId:', parentItemId);
    setEditingItem(null);
    setParentId(parentItemId);
    setIsFormOpen(true);
    console.log('isFormOpen set to true');
  };

  // Handle edit
  const handleEdit = (item: MenuTreeNode) => {
    setEditingItem(item);
    setParentId(item.parentId);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = (item: MenuTreeNode) => {
    setDeletingItem(item);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deletingItem) return;

    startTransition(async () => {
      try {
        const result = await deleteNavigationItem(deletingItem._id);
        if (result.success) {
          toastSuccess('Menu item deleted successfully');
          loadMenuTree();
        } else {
          toastError(result.error || 'Failed to delete menu item');
        }
      } catch (error) {
        console.error('Delete menu item error:', error);
        toastError('Failed to delete menu item');
      } finally {
        setDeletingItem(null);
      }
    });
  };

  // Handle toggle visibility
  const handleToggleVisibility = (item: MenuTreeNode) => {
    startTransition(async () => {
      try {
        const result = await updateNavigationItem(item._id, {
          isVisible: !item.isVisible,
        });
        if (result.success) {
          toastSuccess(`Menu item ${item.isVisible ? 'hidden' : 'shown'} successfully`);
          loadMenuTree();
        } else {
          toastError(result.error || 'Failed to toggle visibility');
        }
      } catch (error) {
        console.error('Toggle visibility error:', error);
        toastError('Failed to toggle visibility');
      }
    });
  };

  // Handle restore
  const handleRestore = (item: MenuTreeNode) => {
    startTransition(async () => {
      try {
        const result = await restoreNavigationItem(item._id);
        if (result.success) {
          toastSuccess('Menu item restored successfully');
          loadMenuTree();
        } else {
          toastError(result.error || 'Failed to restore menu item');
        }
      } catch (error) {
        console.error('Restore menu item error:', error);
        toastError('Failed to restore menu item');
      }
    });
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setParentId(undefined);
    loadMenuTree();
  };

  // Get status badge
  const getStatusBadge = (status: EntityStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" className="text-xs">Active</Badge>;
      case 'Inactive':
        return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // Render menu tree item
  const renderMenuItem = (item: MenuTreeNode, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item._id);

    return (
      <React.Fragment key={item._id}>
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group"
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Drag handle */}
          <div className="cursor-move opacity-0 group-hover:opacity-50">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Expand button */}
          <button
            onClick={() => hasChildren && toggleExpand(item._id)}
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
                {item.title.en || item.title.mm || 'Untitled'}
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
              <Badge variant="secondary" className="text-xs">
                Hidden
              </Badge>
            )}
            {item.requiresAuth && (
              <Badge variant="outline" className="text-xs">
                Auth
              </Badge>
            )}
            {getStatusBadge(item.status)}
          </div>

          {/* Actions */}
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
              <DropdownMenuItem onClick={() => handleCreate(item._id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(item)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleVisibility(item)}>
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
              {item.deletedAt ? (
                <DropdownMenuItem onClick={() => handleRestore(item)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleDelete(item)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <>
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
          <p className="text-muted-foreground">
            Manage website menus and navigation
          </p>
        </div>
        <Button type="button" onClick={() => handleCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Menu Type Tabs */}
      <Tabs value={activeMenuType} onValueChange={(v) => setActiveMenuType(v as MenuType)}>
        <TabsList>
          {Object.entries(menuTypeLabels).map(([type, label]) => (
            <TabsTrigger key={type} value={type}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(menuTypeLabels).map((type) => (
          <TabsContent key={type} value={type}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {menuTypeLabels[type as MenuType]}
                  </CardTitle>
                  <Button variant="outline" onClick={loadMenuTree} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : menuTree.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Menu className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No menu items</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by adding your first menu item
                    </p>
                    <Button type="button" onClick={() => handleCreate()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {menuTree.map((item) => renderMenuItem(item))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the menu item details below'
                : 'Configure your new menu item'}
            </DialogDescription>
          </DialogHeader>
          <NavigationForm
            mode={editingItem ? 'edit' : 'create'}
            menuType={activeMenuType}
            parentId={parentId}
            menuTree={menuTree}
            initialData={editingItem || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.title.en || deletingItem?.title.mm}&quot;?
              {deletingItem?.children && deletingItem.children.length > 0 && (
                <span className="block mt-2 text-amber-600">
                  This item has {deletingItem.children.length} child items that will also be affected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
