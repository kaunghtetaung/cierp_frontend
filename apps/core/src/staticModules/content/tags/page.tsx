'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input, Button, Badge } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Tag as TagIcon,
  Hash,
  RotateCcw,
} from 'lucide-react';
import { getTags, deleteTag, restoreTag } from '../common/actions';
import type { Tag } from '../common/types';
import { TagForm } from './TagForm';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  // Load tags
  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTags({ includePostCount: true });
      if (result.success && result.data) {
        setTags(result.data.data || []);
      } else {
        toastError(result.error || 'Failed to load tags');
      }
    } catch (error) {
      console.error('Load tags error:', error);
      toastError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Filter tags by search
  const filteredTags = tags.filter((tag) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tag.name.en?.toLowerCase().includes(query) ||
      tag.name.mm?.toLowerCase().includes(query) ||
      tag.slug?.toLowerCase().includes(query)
    );
  });

  // Handle create
  const handleCreate = () => {
    setEditingTag(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deletingTag) return;

    startTransition(async () => {
      try {
        const result = await deleteTag(deletingTag._id);
        if (result.success) {
          toastSuccess('Tag deleted successfully');
          loadTags();
        } else {
          toastError(result.error || 'Failed to delete tag');
        }
      } catch (error) {
        console.error('Delete tag error:', error);
        toastError('Failed to delete tag');
      } finally {
        setDeletingTag(null);
      }
    });
  };

  // Handle restore
  const handleRestore = (tag: Tag) => {
    startTransition(async () => {
      try {
        const result = await restoreTag(tag._id);
        if (result.success) {
          toastSuccess('Tag restored successfully');
          loadTags();
        } else {
          toastError(result.error || 'Failed to restore tag');
        }
      } catch (error) {
        console.error('Restore tag error:', error);
        toastError('Failed to restore tag');
      }
    });
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTag(null);
    loadTags();
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Manage content tags for organization
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={loadTags} disabled={loading}>
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
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Hash className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tags found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first tag'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tag
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {filteredTags.map((tag) => (
                <div
                  key={tag._id}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  style={{
                    borderLeftColor: tag.color || '#3b82f6',
                    borderLeftWidth: '3px',
                  }}
                >
                  <TagIcon
                    className="h-4 w-4"
                    style={{ color: tag.color || '#3b82f6' }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {tag.name.en || tag.name.mm || 'Untitled'}
                    </span>
                    {tag.name.mm && tag.name.en && (
                      <span className="text-xs text-muted-foreground">
                        {tag.name.mm}
                      </span>
                    )}
                  </div>
                  {tag.postCount !== undefined && tag.postCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {tag.postCount}
                    </Badge>
                  )}
                  {getStatusBadge(tag.status)}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(tag)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {tag.deletedAt ? (
                        <DropdownMenuItem onClick={() => handleRestore(tag)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleDelete(tag)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total count */}
      {!loading && filteredTags.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredTags.length} of {tags.length} tags
        </p>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Update the tag details below'
                : 'Fill in the details to create a new tag'}
            </DialogDescription>
          </DialogHeader>
          <TagForm
            mode={editingTag ? 'edit' : 'create'}
            initialData={editingTag || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTag} onOpenChange={() => setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTag?.name.en || deletingTag?.name.mm}&quot;?
              {deletingTag?.postCount && deletingTag.postCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  This tag is used in {deletingTag.postCount} posts.
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
