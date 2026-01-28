'use client';

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Input } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { useAuth } from '@repo/auth';
import {
  Plus,
  RefreshCw,
  Loader2,
  Menu,
  Building2,
  Building,
  Search,
  X,
  LayoutGrid,
} from 'lucide-react';
import {
  getMenuTree,
  getMenuTypes,
  deleteNavigationItem,
  restoreNavigationItem,
  updateNavigationItem,
  reorderNavigationItems,
  moveNavigationItem,
  getOrganizations,
  getDepartments,
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

// Predefined menu types
const PREDEFINED_MENUS = [
  { value: 'header', label: 'Header Menu' },
  { value: 'footer', label: 'Footer Menu' },
  { value: 'sidebar', label: 'Sidebar Menu' },
  { value: 'mobile', label: 'Mobile Menu' },
];
const PREDEFINED_VALUES = new Set(PREDEFINED_MENUS.map((m) => m.value));
const NEW_CUSTOM_SENTINEL = '__new_custom__';

function menuTypeToLabel(menuType: string): string {
  const predefined = PREDEFINED_MENUS.find((m) => m.value === menuType);
  if (predefined) return predefined.label;
  return menuType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function slugifyMenuType(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper to extract org/dept from user role objects
interface OrgOption { value: string; label: string }
interface DeptOption { value: string; label: string }

function extractOrgIdFromRoles(roles: any[]): string | undefined {
  if (!roles || roles.length === 0) return undefined;
  for (const role of roles) {
    if (typeof role === 'object' && role !== null) {
      const orgId = role.organizationId || role.Organization;
      // "*" means all organizations (systemAdmin) — no specific org to auto-select
      if (orgId && orgId !== '*') return String(orgId);
    }
  }
  return undefined;
}

export default function NavigationPage() {
  const { user } = useAuth();
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeMenuType, setActiveMenuType] = useState<MenuType>('header');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Organization & Department selectors
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [orgInitialized, setOrgInitialized] = useState(false);

  // Custom menu type state
  const [customMenuTypes, setCustomMenuTypes] = useState<string[]>([]);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuTreeNode | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuTreeNode | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  // Drag-and-drop state
  const [overId, setOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load organizations and auto-select user's org
  useEffect(() => {
    async function loadOrgs() {
      try {
        const result = await getOrganizations();
        if (result.success && result.data) {
          const opts: OrgOption[] = result.data.map((org: any) => ({
            value: org._id || org.value || '',
            label: (typeof org.displayName === 'object' ? (org.displayName?.en || org.displayName?.mm) : null)
              || org.name || org.fullName || org.label || 'Unknown',
          }));
          setOrganizations(opts);

          // Auto-select user's org from their role
          const userOrgId = user ? extractOrgIdFromRoles(user.roles as any[]) : undefined;
          if (userOrgId && opts.some(o => o.value === userOrgId)) {
            setSelectedOrgId(userOrgId);
          } else if (opts.length > 0) {
            setSelectedOrgId(opts[0].value);
          }
          setOrgInitialized(true);
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
        setOrgInitialized(true);
      }
    }
    loadOrgs();
  }, [user]);

  // Load departments when org changes
  useEffect(() => {
    if (!selectedOrgId) {
      setDepartments([]);
      return;
    }
    async function loadDepts() {
      try {
        const result = await getDepartments(selectedOrgId);
        if (result.success && result.data) {
          const opts: DeptOption[] = result.data.map((dept: any) => ({
            value: dept._id || dept.value || '',
            label: (typeof dept.displayName === 'object' ? (dept.displayName?.en || dept.displayName?.mm) : null)
              || dept.fullName || dept.name || dept.label || 'Unknown',
          }));
          setDepartments(opts);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
      }
    }
    loadDepts();
  }, [selectedOrgId]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedDeptId(''); // Reset department when org changes
  };

  // Load custom menu types from API
  useEffect(() => {
    if (!orgInitialized) return;
    async function loadMenuTypes() {
      const result = await getMenuTypes(selectedDeptId || undefined);
      if (result.success && result.data) {
        setCustomMenuTypes(result.data.filter((t: string) => !PREDEFINED_VALUES.has(t)));
      }
    }
    loadMenuTypes();
  }, [selectedDeptId, orgInitialized]);

  const handleMenuTypeChange = (value: string) => {
    if (value === NEW_CUSTOM_SENTINEL) {
      setIsCreatingCustom(true);
      setNewCustomName('');
      return;
    }
    setIsCreatingCustom(false);
    setActiveMenuType(value);
  };

  const handleCreateCustomMenu = () => {
    const slug = slugifyMenuType(newCustomName);
    if (!slug) {
      toastError('Please enter a valid menu name');
      return;
    }
    if (PREDEFINED_VALUES.has(slug) || customMenuTypes.includes(slug)) {
      toastError('This menu type already exists');
      return;
    }
    setCustomMenuTypes((prev) => [...prev, slug]);
    setActiveMenuType(slug);
    setIsCreatingCustom(false);
    setNewCustomName('');
  };

  // Load menu tree
  const loadMenuTree = useCallback(async () => {
    if (!orgInitialized) return;
    setLoading(true);
    try {
      const result = await getMenuTree(activeMenuType, 'en', selectedDeptId || undefined);
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
        // Show empty state (e.g. for new custom menu types with no items yet)
        setMenuTree([]);
      }
    } catch (error) {
      console.error('Load menu tree error:', error);
      toastError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [activeMenuType, selectedDeptId, orgInitialized]);

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
  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setParentId(undefined);
    loadMenuTree();
    // Refresh custom menu types in case a new custom type was used
    const result = await getMenuTypes(selectedDeptId || undefined);
    if (result.success && result.data) {
      setCustomMenuTypes(result.data.filter((t: string) => !PREDEFINED_VALUES.has(t)));
    }
  };

  // Helper to check if targetId is a descendant of ancestorId
  const isDescendant = (ancestorId: string, targetId: string): boolean => {
    const ancestor = findNodeById(menuTree, ancestorId);
    if (!ancestor || !ancestor.children) return false;

    const checkChildren = (nodes: MenuTreeNode[]): boolean => {
      for (const node of nodes) {
        if (node._id === targetId) return true;
        if (node.children && checkChildren(node.children)) return true;
      }
      return false;
    };

    return checkChildren(ancestor.children);
  };

  // ---- DRAG-AND-DROP: onDragOver for visual feedback ----
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setOverId(null);
      setDropPosition(null);
      return;
    }

    setOverId(over.id as string);

    // Get the DOM element to determine drop position
    const overElement = document.querySelector(`[data-id="${over.id}"]`);
    if (overElement) {
      const rect = overElement.getBoundingClientRect();
      // Use delta instead of activatorEvent for more reliable pointer tracking
      const pointerY = event.delta.y + rect.top + rect.height / 2;
      const relativeY = pointerY - rect.top;
      const heightPercent = relativeY / rect.height;

      if (heightPercent < 0.25) {
        setDropPosition('before');
      } else if (heightPercent > 0.75) {
        setDropPosition('after');
      } else {
        setDropPosition('inside');
      }
    }
  }, []);

  // Helper function to move item to a new parent
  const moveItemToParent = useCallback(async (
    itemId: string,
    newParentId: string | undefined,
    targetOrder: number
  ) => {
    try {
      const result = await moveNavigationItem(itemId, {
        targetParentId: newParentId,
        targetOrder,
      });

      if (result.success) {
        toastSuccess('Item moved successfully');
        await loadMenuTree();
      } else {
        toastError(result.error || 'Failed to move item');
      }
    } catch (error) {
      toastError('Failed to move item');
    }
  }, [loadMenuTree]);

  // ---- NEW DRAG-AND-DROP HANDLER (supports both reorder and parent change) ----
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);
    setDropPosition(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active and over items
    const activeItem = findNodeById(menuTree, activeId);
    const overItem = findNodeById(menuTree, overId);

    if (!activeItem || !overItem) return;

    // Prevent dropping parent into own descendant (circular reference)
    if (isDescendant(activeId, overId)) {
      toastError('Cannot move item into its own descendant');
      return;
    }

    if (dropPosition === 'inside') {
      // Make activeItem a child of overItem
      // Auto-expand the target parent so the moved item is visible
      setExpandedIds((prev) => new Set([...prev, overId]));

      const targetOrder = overItem.children?.length ?? 0;
      await moveItemToParent(activeId, overId, targetOrder);
    } else {
      // Reorder: move activeItem before/after overItem
      const targetParentId = overItem.parentId;
      const siblings = targetParentId
        ? findNodeById(menuTree, targetParentId)?.children
        : menuTree;

      if (!siblings) return;

      const overIndex = siblings.findIndex(s => s._id === overId);
      const targetOrder = dropPosition === 'before' ? overIndex : overIndex + 1;

      // If changing parent, use moveItemToParent
      if (activeItem.parentId !== targetParentId) {
        await moveItemToParent(activeId, targetParentId, targetOrder);
      } else {
        // Same level reorder - use existing reorder logic
        const oldIndex = siblings.findIndex((s) => s._id === activeId);
        if (oldIndex === -1) return;

        const reordered = arrayMove([...siblings], oldIndex, overIndex);

        // Optimistic update
        setMenuTree((prev) => {
          const next = structuredClone(prev);
          if (!targetParentId) {
            return reordered as MenuTreeNode[];
          }
          const parent = findNodeById(next, targetParentId);
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
      }
    }
  }, [menuTree, dropPosition, loadMenuTree, moveItemToParent, isDescendant]);

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

  // ---- FILTER TREE BY SEARCH ----
  const filterTree = (nodes: MenuTreeNode[], query: string): MenuTreeNode[] => {
    if (!query.trim()) return nodes;
    const lowerQuery = query.toLowerCase();

    const filtered: MenuTreeNode[] = [];
    for (const node of nodes) {
      const titleEn = safeString(node.title?.en).toLowerCase();
      const titleMm = safeString(node.title?.mm).toLowerCase();
      const slug = node.slug?.toLowerCase() || '';
      const url = node.url?.toLowerCase() || '';

      const matches = titleEn.includes(lowerQuery) ||
                      titleMm.includes(lowerQuery) ||
                      slug.includes(lowerQuery) ||
                      url.includes(lowerQuery);

      const filteredChildren = node.children ? filterTree(node.children, query) : [];

      if (matches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
    return filtered;
  };

  const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

  // Get filtered tree for display
  const filteredMenuTree = filterTree(menuTree, searchQuery);

  // Flatten all IDs for single SortableContext
  const allIds = useMemo(() => {
    const collectIds = (nodes: MenuTreeNode[]): string[] => {
      return nodes.flatMap(n => [n._id, ...(n.children ? collectIds(n.children) : [])]);
    };
    return collectIds(menuTree);
  }, [menuTree]);

  // Calculate statistics
  const countItems = (nodes: MenuTreeNode[]): number => {
    let count = nodes.length;
    for (const node of nodes) {
      if (node.children?.length) {
        count += countItems(node.children);
      }
    }
    return count;
  };
  const totalItems = countItems(menuTree);
  const visibleItems = menuTree.filter(n => n.isVisible).length;
  const hiddenItems = totalItems - visibleItems;

  // ---- RENDER SIBLING GROUP ----
  // Renders the tree recursively without DndContext (moved to parent wrapper)
  const renderSiblingGroup = (
    siblings: MenuTreeNode[],
    siblingParentId: string | undefined,
    level: number
  ) => {
    if (siblings.length === 0) return null;

    return (
      <>
        {siblings.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedIds.has(item._id);
          const prevSibling = getPreviousSibling(menuTree, item._id);

          return (
            <React.Fragment key={item._id}>
              <div
                data-id={item._id}
                style={{ marginLeft: `${level * 36}px` }}
                className="relative"
              >
                {/* Depth indicator with connection lines */}
                {level > 0 && (
                  <>
                    {/* Vertical line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-border to-border/30"
                      style={{ left: '-18px' }}
                    />
                    {/* Horizontal connector */}
                    <div
                      className="absolute top-1/2 left-0 w-4 h-[2px] bg-border"
                      style={{ left: '-18px', transform: 'translateY(-50%)' }}
                    />
                  </>
                )}
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
                  isDropTarget={item._id === overId}
                  dropPosition={item._id === overId ? dropPosition : null}
                />
              </div>

              {/* Recursively render children */}
              {hasChildren && isExpanded &&
                renderSiblingGroup(item.children, item._id, level + 1)
              }
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <LayoutGrid className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build and organize your website menus
          </p>
        </div>
      </div>

      {/* Filters & Controls Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Top row: Organization, Department, Menu Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 w-full">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Organization
                </label>
                <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.value} value={org.value}>
                        {org.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Department
                </label>
                <Select
                  value={selectedDeptId || '_org_level'}
                  onValueChange={(v) => setSelectedDeptId(v === '_org_level' ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Organization level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_org_level">Organization Level</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Menu className="h-4 w-4 text-muted-foreground" />
                  Menu Type
                </label>
                <Select value={activeMenuType} onValueChange={handleMenuTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select menu type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_MENUS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                    {customMenuTypes.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Custom Menus
                        </div>
                        {customMenuTypes.map((mt) => (
                          <SelectItem key={mt} value={mt}>
                            {menuTypeToLabel(mt)}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    <div className="border-t mt-1 pt-1">
                      <SelectItem value={NEW_CUSTOM_SENTINEL}>
                        + New Custom Menu...
                      </SelectItem>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom menu creation inline */}
            {isCreatingCustom && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
                <Input
                  placeholder="e.g. alumni-menu"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCustomMenu();
                    if (e.key === 'Escape') setIsCreatingCustom(false);
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateCustomMenu}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingCustom(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search menu items by title, slug, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Tree Card */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Menu className="h-4 w-4 text-primary" />
                {menuTypeToLabel(activeMenuType)}
              </CardTitle>
              {searchQuery && filteredMenuTree.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Found {countItems(filteredMenuTree)} item{countItems(filteredMenuTree) !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                </p>
              ) : totalItems > 0 ? (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{totalItems}</span> total
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-green-600">{visibleItems}</span> visible
                  </span>
                  {hiddenItems > 0 && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-muted-foreground">{hiddenItems}</span> hidden
                      </span>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleCreate()} size="icon" className="h-8 w-8">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">Add Menu Item</span>
              </Button>
              <Button variant="outline" onClick={loadMenuTree} disabled={loading} size="icon" className="h-8 w-8">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading menu items...</p>
            </div>
          ) : menuTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Menu className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                This menu is empty. Create your first menu item to start building your navigation structure.
              </p>
              <Button type="button" onClick={() => handleCreate()} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add First Menu Item
              </Button>
            </div>
          ) : filteredMenuTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                No menu items match &quot;{searchQuery}&quot;. Try a different search term.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchQuery('')}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {renderSiblingGroup(filteredMenuTree, undefined, 0)}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

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
            departmentId={selectedDeptId || undefined}
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
