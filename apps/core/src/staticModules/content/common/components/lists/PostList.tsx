'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui';
import { Button, Badge, Input, Checkbox } from '@repo/ui';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { ConfirmationDialog, Pagination } from '@repo/ui';
import { toastSuccess, toastError, getLocalizedText } from '@repo/utils';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  RefreshCw,
  Pin,
  Star,
  Calendar,
  Globe,
  Lock,
  Filter,
  Archive,
  Send,
} from 'lucide-react';
import { deletePost, publishPost, unpublishPost, archivePost } from '../../actions';
import type { Post, PostType, Category, ContentStatus, Visibility } from '../../types';

interface PostListProps {
  posts: Post[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  postTypes?: PostType[];
  categories?: Category[];
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onEdit?: (post: Post) => void;
  onView?: (post: Post) => void;
  currentLanguage?: 'en' | 'mm';
}

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
};

const VISIBILITY_ICONS: Record<Visibility, React.ReactNode> = {
  public: <Globe className="h-3 w-3" />,
  private: <Lock className="h-3 w-3" />,
  protected: <Lock className="h-3 w-3" />,
  password: <Lock className="h-3 w-3" />,
};

export function PostList({
  posts,
  totalCount,
  currentPage,
  pageSize,
  postTypes = [],
  categories = [],
  onPageChange,
  onRefresh,
  onEdit,
  onView,
  currentLanguage = 'en',
}: PostListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [postTypeFilter, setPostTypeFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: '', title: '' });

  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p._id)));
    }
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.success) {
        toastSuccess('Post deleted successfully');
        setDeleteDialog({ open: false, id: '', title: '' });
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to delete post');
      }
    });
  };

  const handlePublish = async (id: string) => {
    startTransition(async () => {
      const result = await publishPost(id);
      if (result.success) {
        toastSuccess('Post published successfully');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to publish post');
      }
    });
  };

  const handleUnpublish = async (id: string) => {
    startTransition(async () => {
      const result = await unpublishPost(id);
      if (result.success) {
        toastSuccess('Post unpublished');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to unpublish post');
      }
    });
  };

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      const result = await archivePost(id);
      if (result.success) {
        toastSuccess('Post archived');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to archive post');
      }
    });
  };

  // Filter posts locally (for search)
  const filteredPosts = posts.filter((post) => {
    const title = getLocalizedText(post.title, currentLanguage).toLowerCase();
    return (
      title.includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Posts
            </CardTitle>
            <CardDescription>
              Manage your blog posts and articles
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/content/posts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {postTypes.length > 0 && (
            <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {postTypes.map((pt) => (
                  <SelectItem key={pt._id} value={pt._id}>
                    {getLocalizedText(pt.name, currentLanguage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button variant="outline" size="sm" disabled={isPending}>
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
            <Button variant="outline" size="sm" disabled={isPending}>
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedIds.size === posts.length && posts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[300px]">Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery
                        ? 'No posts found matching your search'
                        : 'No posts yet. Create your first post!'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post._id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(post._id)}
                        onCheckedChange={() => toggleSelect(post._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {post.featuredImage && (
                            <img
                              src={post.featuredImage}
                              alt=""
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {getLocalizedText(post.title, currentLanguage)}
                              {post.isPinned && (
                                <Pin className="h-3 w-3 text-primary" />
                              )}
                              {post.isFeatured && (
                                <Star className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              {VISIBILITY_ICONS[post.visibility]}
                              /{post.slug}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {post.authorName || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.categories?.slice(0, 2).map((cat) => (
                          <Badge key={cat._id} variant="outline" className="text-xs">
                            {getLocalizedText(cat.name, currentLanguage)}
                          </Badge>
                        ))}
                        {(post.categories?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(post.categories?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[post.status]}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt || post.createdAt)}
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
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(post)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(post)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {post.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handlePublish(post._id)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.status === 'published' && (
                            <DropdownMenuItem
                              onClick={() => handleUnpublish(post._id)}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          {post.status !== 'archived' && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(post._id)}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                id: post._id,
                                title: getLocalizedText(post.title, currentLanguage),
                              })
                            }
                            className="text-destructive"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange || (() => {})}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          title="Delete Post"
          description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteDialog.id)}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
}

export default PostList;
