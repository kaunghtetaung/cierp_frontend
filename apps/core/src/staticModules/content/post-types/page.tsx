'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  RotateCcw,
  Settings2,
  Tag,
  FolderTree,
  MessageSquare,
  History,
  Image,
  FileType,
} from 'lucide-react';
import { getPostTypes, deletePostType, restorePostType } from '../common/actions';
import type { PostType } from '../common/types';
import { PostTypeForm } from './PostTypeForm';

export default function PostTypesPage() {
  const { currentLanguage } = useLanguage();
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingPostType, setEditingPostType] = useState<PostType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });

  const fetchPostTypes = async () => {
    setLoading(true);
    try {
      const result = await getPostTypes({ includePostCount: true });
      if (result.success && result.data) {
        // The shared StandardResponseHandler auto-unwraps `body.data`, so
        // `result.data` is already the array. Older code paths returned
        // the full wrapper; handle both for safety.
        const raw: any = result.data;
        const list = Array.isArray(raw) ? raw : raw.data || [];
        setPostTypes(list);
      } else {
        toastError(result.error || 'Failed to load post types');
      }
    } catch (error) {
      toastError('Failed to load post types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostTypes();
  }, []);

  const handleEdit = (postType: PostType) => {
    setEditingPostType(postType);
    setShowFormDialog(true);
  };

  const handleCreate = () => {
    setEditingPostType(null);
    setShowFormDialog(true);
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditingPostType(null);
    fetchPostTypes();
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deletePostType(id);
      if (result.success) {
        toastSuccess('Post type deleted successfully');
        setDeleteDialog({ open: false, id: '', name: '' });
        fetchPostTypes();
      } else {
        toastError(result.error || 'Failed to delete post type');
      }
    });
  };

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      const result = await restorePostType(id);
      if (result.success) {
        toastSuccess('Post type restored successfully');
        fetchPostTypes();
      } else {
        toastError(result.error || 'Failed to restore post type');
      }
    });
  };

  // Filter post types by search query
  const filteredPostTypes = postTypes.filter((pt) => {
    if (!searchQuery) return true;
    const name = getLocalizedText(pt.name, currentLanguage as 'en' | 'mm').toLowerCase();
    const slug = pt.slug.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || slug.includes(query);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'Inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8" />
          Post Types
        </h1>
        <p className="text-muted-foreground">
          Manage custom content types with dynamic attributes
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Post Types</CardTitle>
              <CardDescription>
                {postTypes.length} post types total
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Post Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search post types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPostTypes}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-center">Attributes</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredPostTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery
                          ? 'No post types found matching your search'
                          : 'No post types yet. Create your first post type!'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPostTypes.map((postType) => (
                    <TableRow key={postType._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {postType.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: postType.color }}
                            />
                          )}
                          <div>
                            <div className="font-medium">
                              {getLocalizedText(postType.name, currentLanguage as 'en' | 'mm')}
                            </div>
                            {postType.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {getLocalizedText(postType.description, currentLanguage as 'en' | 'mm')}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {postType.slug}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {postType.supportsCategories && (
                            <Badge variant="outline" className="text-xs">
                              <FolderTree className="h-3 w-3 mr-1" />
                              Categories
                            </Badge>
                          )}
                          {postType.supportsTags && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              Tags
                            </Badge>
                          )}
                          {postType.supportsComments && (
                            <Badge variant="outline" className="text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Comments
                            </Badge>
                          )}
                          {postType.supportsRevisions && (
                            <Badge variant="outline" className="text-xs">
                              <History className="h-3 w-3 mr-1" />
                              Revisions
                            </Badge>
                          )}
                          {postType.enableFeaturedImage && (
                            <Badge variant="outline" className="text-xs">
                              <Image className="h-3 w-3 mr-1" />
                              Image
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {postType.customAttributes?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {postType.postCount || 0}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(postType.status)}
                        {postType.isSystem && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(postType)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(postType)}>
                              <Settings2 className="h-4 w-4 mr-2" />
                              Manage Attributes
                            </DropdownMenuItem>
                            {postType.deletedAt && (
                              <DropdownMenuItem
                                onClick={() => handleRestore(postType._id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  id: postType._id,
                                  name: getLocalizedText(postType.name, currentLanguage as 'en' | 'mm'),
                                })
                              }
                              className="text-destructive"
                              disabled={postType.isSystem}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPostType ? 'Edit Post Type' : 'Create Post Type'}
            </DialogTitle>
          </DialogHeader>
          <PostTypeForm
            mode={editingPostType ? 'edit' : 'create'}
            initialData={editingPostType || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Post Type"
        description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone. All posts of this type will be affected.`}
        confirmText={isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => handleDelete(deleteDialog.id)}
        variant="destructive"
      />
    </div>
  );
}
