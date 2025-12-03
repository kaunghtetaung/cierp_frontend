'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui';
import { Button, Badge, Input } from '@repo/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { ConfirmationDialog } from '@repo/ui';
import { toastSuccess, toastError, getLocalizedText } from '@repo/utils';
import { useLanguage } from '@repo/language';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FolderTree,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getCategoryTree, deleteCategory } from '../common/actions';
import type { CategoryTreeNode, Category } from '../common/types';
import { CategoryForm } from './CategoryForm';

interface CategoryRowProps {
  category: CategoryTreeNode;
  level: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (id: string, name: string) => void;
  currentLanguage: 'en' | 'mm';
}

function CategoryRow({
  category,
  level,
  expandedIds,
  toggleExpand,
  onEdit,
  onDelete,
  currentLanguage,
}: CategoryRowProps) {
  const isExpanded = expandedIds.has(category._id);
  const hasChildren = category.children && category.children.length > 0;
  const name = getLocalizedText(category.name, currentLanguage);

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category._id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {category.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            )}
            <span className="font-medium">{name}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {category.slug}
        </TableCell>
        <TableCell>
          <Badge
            variant={category.status === 'Active' ? 'default' : 'secondary'}
          >
            {category.status}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          {category.postCount || 0}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {category.isDefault && (
              <Badge variant="outline" className="text-xs">
                Default
              </Badge>
            )}
            {category.isVisible && (
              <Badge variant="outline" className="text-xs">
                Visible
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(category._id, name)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {isExpanded &&
        hasChildren &&
        category.children?.map((child) => (
          <CategoryRow
            key={child._id}
            category={child}
            level={level + 1}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            currentLanguage={currentLanguage}
          />
        ))}
    </>
  );
}

export default function CategoryPage() {
  const router = useRouter();
  const { currentLanguage } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await getCategoryTree();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        toastError(result.error || 'Failed to load categories');
      }
    } catch (error) {
      toastError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const getAllIds = (nodes: CategoryTreeNode[]): string[] => {
      return nodes.flatMap((node) => [
        node._id,
        ...(node.children ? getAllIds(node.children) : []),
      ]);
    };
    setExpandedIds(new Set(getAllIds(categories)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleEdit = (category: CategoryTreeNode) => {
    setEditingCategory(category);
    setShowFormDialog(true);
  };

  const handleCreate = () => {
    console.log('handleCreate called');
    setEditingCategory(null);
    setShowFormDialog(true);
    console.log('showFormDialog set to true');
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        toastSuccess('Category deleted successfully');
        setDeleteDialog({ open: false, id: '', name: '' });
        fetchCategories();
      } else {
        toastError(result.error || 'Failed to delete category');
      }
    });
  };

  // Filter categories by search query
  const filterCategories = (
    nodes: CategoryTreeNode[],
    query: string
  ): CategoryTreeNode[] => {
    if (!query) return nodes;

    return nodes.reduce<CategoryTreeNode[]>((acc, node) => {
      const name = getLocalizedText(node.name, currentLanguage as 'en' | 'mm').toLowerCase();
      const matchesSearch = name.includes(query.toLowerCase()) ||
                           node.slug.toLowerCase().includes(query.toLowerCase());

      const filteredChildren = node.children
        ? filterCategories(node.children, query)
        : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);
  };

  const filteredCategories = filterCategories(categories, searchQuery);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <FolderTree className="w-8 h-8" />
          Categories
        </h1>
        <p className="text-muted-foreground">
          Manage content categories in a hierarchical structure
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>
                {categories.length} categories total
              </CardDescription>
            </div>
            <Button type="button" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery
                          ? 'No categories found matching your search'
                          : 'No categories yet. Create your first category!'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <CategoryRow
                      key={category._id}
                      category={category}
                      level={0}
                      expandedIds={expandedIds}
                      toggleExpand={toggleExpand}
                      onEdit={handleEdit}
                      onDelete={(id, name) =>
                        setDeleteDialog({ open: true, id, name })
                      }
                      currentLanguage={currentLanguage as 'en' | 'mm'}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            mode={editingCategory ? 'edit' : 'create'}
            initialData={editingCategory || undefined}
            parentCategories={categories}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => handleDelete(deleteDialog.id)}
        variant="destructive"
      />
    </div>
  );
}
