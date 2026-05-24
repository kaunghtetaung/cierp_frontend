'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { Input, Button, Badge } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  Eye,
  Archive,
  Upload,
  ArrowUpFromLine,
  RotateCcw,
  Calendar,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { getPosts, deletePost, publishPost, unpublishPost, archivePost, restorePost } from '../common/actions';
import type { Post, ContentStatus } from '../common/types';

interface PostPageProps {
  appId: string;
}

export default function PostPage({ appId }: PostPageProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');

  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const result = await getPosts(params);
      if (result.success && result.data) {
        setPosts(result.data.data || []);
        if (result.data.meta) {
          setTotalPages(result.data.meta.totalPages || 1);
        }
      } else {
        toastError(result.error || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Load posts error:', error);
      toastError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle create — navigate to the full-page create route.
  const handleCreate = () => {
    router.push(`/${appId}/post/new`);
  };

  // Handle edit — navigate to the full-page edit route.
  const handleEdit = (post: Post) => {
    router.push(`/${appId}/post/${post._id}`);
  };

  // Handle delete
  const handleDelete = (post: Post) => {
    setDeletingPost(post);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deletingPost) return;

    startTransition(async () => {
      try {
        const result = await deletePost(deletingPost._id);
        if (result.success) {
          toastSuccess('Post deleted successfully');
          loadPosts();
        } else {
          toastError(result.error || 'Failed to delete post');
        }
      } catch (error) {
        console.error('Delete post error:', error);
        toastError('Failed to delete post');
      } finally {
        setDeletingPost(null);
      }
    });
  };

  // Handle publish
  const handlePublish = (post: Post) => {
    startTransition(async () => {
      try {
        const result = await publishPost(post._id);
        if (result.success) {
          toastSuccess('Post published successfully');
          loadPosts();
        } else {
          toastError(result.error || 'Failed to publish post');
        }
      } catch (error) {
        console.error('Publish post error:', error);
        toastError('Failed to publish post');
      }
    });
  };

  // Handle unpublish
  const handleUnpublish = (post: Post) => {
    startTransition(async () => {
      try {
        const result = await unpublishPost(post._id);
        if (result.success) {
          toastSuccess('Post unpublished successfully');
          loadPosts();
        } else {
          toastError(result.error || 'Failed to unpublish post');
        }
      } catch (error) {
        console.error('Unpublish post error:', error);
        toastError('Failed to unpublish post');
      }
    });
  };

  // Handle archive
  const handleArchive = (post: Post) => {
    startTransition(async () => {
      try {
        const result = await archivePost(post._id);
        if (result.success) {
          toastSuccess('Post archived successfully');
          loadPosts();
        } else {
          toastError(result.error || 'Failed to archive post');
        }
      } catch (error) {
        console.error('Archive post error:', error);
        toastError('Failed to archive post');
      }
    });
  };

  // Handle restore
  const handleRestore = (post: Post) => {
    startTransition(async () => {
      try {
        const result = await restorePost(post._id);
        if (result.success) {
          toastSuccess('Post restored successfully');
          loadPosts();
        } else {
          toastError(result.error || 'Failed to restore post');
        }
      } catch (error) {
        console.error('Restore post error:', error);
        toastError('Failed to restore post');
      }
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'Published':
        return <Badge variant="success">Published</Badge>;
      case 'Draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'Archived':
        return <Badge variant="outline">Archived</Badge>;
      case 'Scheduled':
        return <Badge variant="default">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            Create and manage content posts
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ContentStatus | 'all');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadPosts} disabled={loading}>
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
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first post'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post._id}>
                    <TableCell>
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {post.title.en || post.title.mm || 'Untitled'}
                        </span>
                        {post.title.mm && post.title.en && (
                          <span className="text-xs text-muted-foreground">
                            {post.title.mm}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          /{post.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{post.authorName || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(post.publishedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{post.viewCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(post)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {post.status === 'Draft' && (
                            <DropdownMenuItem onClick={() => handlePublish(post)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.status === 'Published' && (
                            <DropdownMenuItem onClick={() => handleUnpublish(post)}>
                              <ArrowUpFromLine className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          {post.status !== 'Archived' && (
                            <DropdownMenuItem onClick={() => handleArchive(post)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {post.deletedAt ? (
                            <DropdownMenuItem onClick={() => handleRestore(post)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleDelete(post)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && posts.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPost} onOpenChange={() => setDeletingPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingPost?.title.en || deletingPost?.title.mm}&quot;?
              This action cannot be undone.
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
