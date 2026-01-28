'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import { Button } from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  Plus,
  RefreshCw,
  Loader2,
  Menu,
} from 'lucide-react';
import {
  getMenuTree,
  deleteNavigationItem,
  restoreNavigationItem,
  updateNavigationItem,
  reorderNavigationItems,
  moveNavigationItem,
} from '../common/actions';
import type { MenuTreeNode, MenuType } from '../common/types';
import { NavigationForm } from './NavigationForm';
import { SortableMenuTreeItem } from './SortableMenuTreeItem';
import {
  findSiblingsAndIndex,
  findNodeById,
  findParentNode,
  getPreviousSibling,
  canMoveUp as checkCanMoveUp,
  canMoveDown as checkCanMoveDown,
  canMakeSubItem as checkCanMakeSubItem,
  canPromote as checkCanPromote,
  buildReorderIds,
} from './navigation-tree-utils';

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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    setEditingItem(null);
    setParentId(parentItemId);
    setIsFormOpen(true);
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
          version: item.version,
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

  // ---- DRAG-AND-DROP REORDER (same level) ----
  const handleDragEnd = useCallback(
    (siblingParentId: string | undefined) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const siblings = siblingParentId
        ? findNodeById(menuTree, siblingParentId)?.children
        : menuTree;

      if (!siblings) return;

      const oldIndex = siblings.findIndex((s) => s._id === active.id);
      const newIndex = siblings.findIndex((s) => s._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove([...siblings], oldIndex, newIndex);

      // Optimistic update
      setMenuTree((prev) => {
        const next = structuredClone(prev);
        if (!siblingParentId) {
          return reordered as MenuTreeNode[];
        }
        const parent = findNodeById(next, siblingParentId);
        if (parent) {
          parent.children = reordered as MenuTreeNode[];
        }
        return next;
      });

      startTransition(async () => {
        try {
          const navigationIds = buildReorderIds(reordered);
          const result = await reorderNavigationItems({ navigationIds });
          if (!result.success) {
            toastError(result.error || 'Failed to reorder');
            loadMenuTree();
          }
        } catch {
          toastError('Failed to reorder');
          loadMenuTree();
        }
      });
    },
    [menuTree, loadMenuTree]
  );

  // ---- MOVE UP ----
  const handleMoveUp = useCallback(
    (item: MenuTreeNode) => {
      const result = findSiblingsAndIndex(menuTree, item._id);
      if (!result || result.index === 0) return;

      const { siblings, index } = result;
      const reordered = [...siblings];
      [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];

      const itemParentId = item.parentId;

      // Optimistic update
      setMenuTree((prev) => {
        const next = structuredClone(prev);
        if (!itemParentId) return reordered as MenuTreeNode[];
        const parent = findNodeById(next, itemParentId);
        if (parent) parent.children = reordered as MenuTreeNode[];
        return next;
      });

      startTransition(async () => {
        try {
          const navigationIds = buildReorderIds(reordered);
          const res = await reorderNavigationItems({ navigationIds });
          if (!res.success) {
            toastError(res.error || 'Failed to move item');
            loadMenuTree();
          }
        } catch {
          toastError('Failed to move item');
          loadMenuTree();
        }
      });
    },
    [menuTree, loadMenuTree]
  );

  // ---- MOVE DOWN ----
  const handleMoveDown = useCallback(
    (item: MenuTreeNode) => {
      const result = findSiblingsAndIndex(menuTree, item._id);
      if (!result || result.index >= result.siblings.length - 1) return;

      const { siblings, index } = result;
      const reordered = [...siblings];
      [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];

      const itemParentId = item.parentId;

      setMenuTree((prev) => {
        const next = structuredClone(prev);
        if (!itemParentId) return reordered as MenuTreeNode[];
        const parent = findNodeById(next, itemParentId);
        if (parent) parent.children = reordered as MenuTreeNode[];
        return next;
      });

      startTransition(async () => {
        try {
          const navigationIds = buildReorderIds(reordered);
          const res = await reorderNavigationItems({ navigationIds });
          if (!res.success) {
            toastError(res.error || 'Failed to move item');
            loadMenuTree();
          }
        } catch {
          toastError('Failed to move item');
          loadMenuTree();
        }
      });
    },
    [menuTree, loadMenuTree]
  );

  // ---- MAKE SUB-ITEM ----
  const handleMakeSubItem = useCallback(
    (item: MenuTreeNode) => {
      const prevSibling = getPreviousSibling(menuTree, item._id);
      if (!prevSibling) return;

      const targetParentId = prevSibling._id;
      const targetOrder = prevSibling.children?.length ?? 0;

      // Auto-expand the previous sibling so the moved item is visible
      setExpandedIds((prev) => new Set([...prev, targetParentId]));

      startTransition(async () => {
        try {
          const res = await moveNavigationItem(item._id, {
            targetParentId,
            targetOrder,
          });
          if (res.success) {
            toastSuccess('Item moved to sub-menu');
            loadMenuTree();
          } else {
            toastError(res.error || 'Failed to move item');
          }
        } catch {
          toastError('Failed to move item');
        }
      });
    },
    [menuTree, loadMenuTree]
  );

  // ---- PROMOTE (move to parent level) ----
  const handlePromote = useCallback(
    (item: MenuTreeNode) => {
      const parent = findParentNode(menuTree, item._id);
      if (!parent) return;

      const grandparentId = parent.parentId;
      const grandSiblings = grandparentId
        ? findNodeById(menuTree, grandparentId)?.children
        : menuTree;

      if (!grandSiblings) return;

      const parentIndex = grandSiblings.findIndex((n) => n._id === parent._id);
      const targetOrder = parentIndex + 1;

      startTransition(async () => {
        try {
          const res = await moveNavigationItem(item._id, {
            targetParentId: grandparentId || undefined,
            targetOrder,
          });
          if (res.success) {
            toastSuccess('Item promoted to parent level');
            loadMenuTree();
          } else {
            toastError(res.error || 'Failed to promote item');
          }
        } catch {
          toastError('Failed to promote item');
        }
      });
    },
    [menuTree, loadMenuTree]
  );

  // ---- RENDER SIBLING GROUP ----
  // Each group of siblings gets its own DndContext + SortableContext
  // so drag is constrained to same-level reordering.
  const renderSiblingGroup = (
    siblings: MenuTreeNode[],
    siblingParentId: string | undefined,
    level: number
  ) => {
    if (siblings.length === 0) return null;

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd(siblingParentId)}
      >
        <SortableContext
          items={siblings.map((s) => s._id)}
          strategy={verticalListSortingStrategy}
        >
          {siblings.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedIds.has(item._id);
            const prevSibling = getPreviousSibling(menuTree, item._id);

            return (
              <React.Fragment key={item._id}>
                <div style={{ marginLeft: `${level * 24}px` }}>
                  <SortableMenuTreeItem
                    item={item}
                    isExpanded={isExpanded}
                    hasChildren={hasChildren}
                    onToggleExpand={toggleExpand}
                    onCreateChild={handleCreate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                    onRestore={handleRestore}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onMakeSubItem={handleMakeSubItem}
                    onPromote={handlePromote}
                    canMoveUp={checkCanMoveUp(menuTree, item._id)}
                    canMoveDown={checkCanMoveDown(menuTree, item._id)}
                    canMakeSubItem={checkCanMakeSubItem(menuTree, item._id)}
                    canPromote={checkCanPromote(menuTree, item._id)}
                    previousSiblingTitle={
                      prevSibling
                        ? (typeof prevSibling.title?.en === 'string' && prevSibling.title.en)
                          || (typeof prevSibling.title?.mm === 'string' && prevSibling.title.mm)
                          || 'Untitled'
                        : undefined
                    }
                  />
                </div>

                {/* Recursively render children as their own sortable group */}
                {hasChildren && isExpanded &&
                  renderSiblingGroup(item.children, item._id, level + 1)
                }
              </React.Fragment>
            );
          })}
        </SortableContext>
      </DndContext>
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
                    {renderSiblingGroup(menuTree, undefined, 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent closing dialog when clicking inside portaled dropdowns (e.g. IconSelector)
            const target = e.target as HTMLElement | null;
            if (target?.closest?.('[data-icon-selector-portal]')) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            // Allow focus to move to portaled dropdowns (e.g. IconSelector search input)
            const target = e.target as HTMLElement | null;
            if (target?.closest?.('[data-icon-selector-portal]')) {
              e.preventDefault();
            }
          }}
        >
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
              Are you sure you want to delete &quot;{(typeof deletingItem?.title?.en === 'string' && deletingItem.title.en) || (typeof deletingItem?.title?.mm === 'string' && deletingItem.title.mm) || 'Untitled'}&quot;?
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
