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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { Input, Button, Badge } from '@repo/ui';
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
  Eye,
  Archive,
  ArrowUpFromLine,
  RotateCcw,
} from 'lucide-react';
import {
  getPosts,
  deletePost,
  publishPost,
  unpublishPost,
  archivePost,
  restorePost,
  getPostTypeReference,
  getDepartments,
} from '../common/actions';
import { getClientTenantId } from '@/actions/client-tenant';
import type { Post, ContentStatus } from '../common/types';

/**
 * Per-type column override. Each entry adds a column AFTER the Title
 * column and BEFORE the actions menu. When omitted, DefaultPostListView
 * falls back to a sensible generic set (Status + Created).
 *
 * `render` receives the full Post — type-specific views can read
 * `lessonContext`, `eventContext`, etc. and format their badge / chip
 * however they like.
 */
export interface PostListColumnDef {
  key: string;
  header: string;
  /** Tailwind width class, e.g. `w-[150px]` or `w-[120px]`. */
  width?: string;
  /** Cell alignment. Defaults to left. */
  align?: 'left' | 'center' | 'right';
  render: (post: Post) => React.ReactNode;
}

interface DefaultPostListViewProps {
  /** PostType slug filter — narrows the list to posts of this type. */
  postTypeSlug: string;
  /** Display label shown in the page header (e.g., "News", "Articles"). */
  title: string;
  /** Optional appId for routing — defaults to 'core'. */
  appId?: string;
  /** Type-specific columns rendered between Title and the actions menu.
   *  When omitted, falls back to [Status, Created] generic defaults. */
  columns?: PostListColumnDef[];
}

// ─── Reusable cell builders shared with per-type files ───
export function statusBadgeFor(status: string): React.ReactNode {
  switch (status) {
    case 'Published':
      return <Badge>Published</Badge>;
    case 'Draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'Archived':
      return <Badge variant="secondary">Archived</Badge>;
    case 'Scheduled':
      return <Badge variant="secondary">Scheduled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function formatDate(value: any): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
}

const GENERIC_COLUMNS: PostListColumnDef[] = [
  {
    key: 'status',
    header: 'Status',
    width: 'w-[150px]',
    render: (post) => statusBadgeFor(post.status),
  },
  {
    key: 'createdAt',
    header: 'Created',
    width: 'w-[180px]',
    render: (post) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(post.createdAt)}
      </span>
    ),
  },
];

/**
 * Generic per-PostType post list view used by every entry under the
 * "Contents" sidebar group (News, Article, Events, Lessons, Pages,
 * Announcements, …). All filtering lives on `postTypeId` resolved from
 * the slug at mount time. The "+ New" button hands the editor a
 * pre-selected PostType so the author lands on the right form variant
 * immediately.
 */
export function DefaultPostListView({
  postTypeSlug,
  title,
  appId = 'core',
  columns,
}: DefaultPostListViewProps) {
  const router = useRouter();
  // Fallback when the per-slug page doesn't pass any columns: keep the
  // original Status + Created display so existing types continue working
  // without each having to opt-in.
  const effectiveColumns: PostListColumnDef[] = columns ?? GENERIC_COLUMNS;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [postTypeId, setPostTypeId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  // Department filter — three states encoded in the dropdown value:
  //   - 'all'     → no filter (default)
  //   - '__org__' → orgLevelOnly=true (posts authored at org scope —
  //                 systemAdmin / orgAdmin posts with departmentId=null)
  //   - <24-hex>  → specific department id
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<
    Array<{ _id: string; label: string }>
  >([]);

  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // ─── Resolve postTypeSlug → postTypeId on mount
  useEffect(() => {
    let cancelled = false;
    setResolveError(null); // clear any stale error from a previous mount
    (async () => {
      try {
        const result = await getPostTypeReference();
        if (cancelled) return;

        // Accept both shapes:
        //  - `result.data = [...]` (unwrapped)
        //  - `result.data = { data: [...] }` (wrapped — happens when
        //    the response handler keeps the wrap for `data + meta`
        //    paginated responses).
        const raw: any = result?.data;
        const list: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];

        // Surface upstream failure verbatim — a generic "not found"
        // message hides cases where the call returned 0 results
        // because the request itself failed (auth / tenant context /
        // gateway error) rather than because the postType genuinely
        // doesn't exist.
        if (result && result.success === false) {
          setResolveError(
            `Failed to load PostTypes: ${result.error || 'unknown error'}`,
          );
          return;
        }

        const match = list.find((pt: any) => pt.slug === postTypeSlug);
        if (match) {
          setPostTypeId(match.id);
        } else if (list.length === 0) {
          setResolveError(
            `No PostTypes returned for this organization. Check that you're logged in to the right org, the content service is running, and the access policy allows "reference" reads.`,
          );
        } else {
          const slugs = list
            .map((p: any) => p.slug)
            .filter(Boolean)
            .join(', ');
          setResolveError(
            `PostType "${postTypeSlug}" not found. Available: ${slugs || '(none)'}.`,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setResolveError(
            err instanceof Error ? err.message : 'Failed to resolve PostType',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postTypeSlug]);

  // ─── Load department reference list once (for the filter dropdown).
  // Failures are silent — the filter just stays at the two built-in
  // options ("All" + "Organization") if the call errors out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tenantId = await getClientTenantId();
        if (!tenantId || cancelled) return;
        const result = await getDepartments(tenantId);
        if (cancelled) return;
        if (result.success && Array.isArray(result.data)) {
          // The `/departments/ref` endpoint returns the
          // already-formatted reference shape `{ id, label, value }`
          // (via the `CommonReferenceService` mapper) — NOT the raw
          // entity. Earlier code read `_id` / `fullName` /
          // `displayName.en` and fell back to `String(undefined).slice(-6)`
          // → "fined" / "undefined" labels in the dropdown.
          const items = (result.data as any[])
            .map((d) => ({
              _id: String(d.id ?? d._id ?? d.value ?? ''),
              label:
                d.label ||
                d.displayName?.en ||
                d.fullName ||
                d.shortName ||
                'Unnamed',
            }))
            .filter((d) => d._id);
          setDepartments(items);
        }
      } catch (err) {
        console.warn('Failed to load departments for filter', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Load posts (only after postTypeId resolved)
  const loadPosts = useCallback(async () => {
    if (!postTypeId) return;
    setLoading(true);
    try {
      const params: any = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        postTypeId,
      };
      // Admin "All status" must include drafts. Backend default
       // filters drafts out for public/non-admin callers; explicit opt-in
       // makes the admin list show everything.
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      } else {
        params.includeDrafts = true;
      }
      if (searchQuery) params.search = searchQuery;
      // Department filter — three-way:
      //   '__org__'  → org-level only (departmentId=null)
      //   '<id>'     → specific department
      //   'all'      → no filter
      if (deptFilter === '__org__') {
        params.orgLevelOnly = true;
      } else if (deptFilter !== 'all') {
        params.departmentId = deptFilter;
      }

      const result = await getPosts(params);
      if (result.success && result.data) {
        setPosts((result.data as any).data || []);
        const meta = (result.data as any).meta;
        if (meta) {
          setTotalPages(meta.totalPages || 1);
          setTotalRecords(meta.total ?? 0);
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
  }, [postTypeId, currentPage, pageSize, statusFilter, searchQuery, deptFilter]);

  useEffect(() => {
    if (postTypeId) loadPosts();
  }, [postTypeId, loadPosts]);

  // ─── Action handlers
  const handleNew = () => {
    // Prefill the post create form with this PostType so the author
    // doesn't have to re-pick "Post as".
    router.push(`/${appId}/post/new?postTypeSlug=${postTypeSlug}`);
  };

  const handleEdit = (post: Post) => {
    // Edit lives at the bare resource URL — `[appId]/[module]/[id]/page.tsx`
    // loads `staticModules/{appId}/{module}/edit.tsx` directly. Adding
    // a trailing `/edit` would route through the catch-all
    // `[...slug]/page.tsx` which looks for an `<id>/edit/` folder
    // that doesn't exist.
    router.push(`/${appId}/post/${post._id}`);
  };

  const handleView = (post: Post) => {
    router.push(`/${appId}/post/${post._id}/view`);
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    startTransition(async () => {
      const result = await deletePost(deletingPost._id);
      if (result.success) {
        toastSuccess('Post deleted');
        setDeletingPost(null);
        loadPosts();
      } else {
        toastError(result.error || 'Delete failed');
      }
    });
  };

  const handlePublish = (post: Post) => {
    startTransition(async () => {
      const result = await publishPost(post._id);
      if (result.success) {
        toastSuccess('Published');
        loadPosts();
      } else {
        toastError(result.error || 'Publish failed');
      }
    });
  };

  const handleUnpublish = (post: Post) => {
    startTransition(async () => {
      const result = await unpublishPost(post._id);
      if (result.success) {
        toastSuccess('Unpublished');
        loadPosts();
      } else {
        toastError(result.error || 'Unpublish failed');
      }
    });
  };

  const handleArchive = (post: Post) => {
    startTransition(async () => {
      const result = await archivePost(post._id);
      if (result.success) {
        toastSuccess('Archived');
        loadPosts();
      } else {
        toastError(result.error || 'Archive failed');
      }
    });
  };

  const handleRestore = (post: Post) => {
    startTransition(async () => {
      const result = await restorePost(post._id);
      if (result.success) {
        toastSuccess('Restored');
        loadPosts();
      } else {
        toastError(result.error || 'Restore failed');
      }
    });
  };

  // ─── Resolve-error state
  if (resolveError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium mb-2">{resolveError}</p>
            <p className="text-sm text-muted-foreground">
              Open the PostType admin to add or activate this type.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push(`/${appId}/post-types`)}
            >
              Manage PostTypes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            All posts of type "{postTypeSlug}"
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          New {title}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {/* Department filter — three modes:
                  • All — every post visible to the user
                  • Organization — posts authored at org scope (no
                    department; typically systemAdmin / orgAdmin posts)
                  • <specific dept> — posts scoped to that department */}
            <Select
              value={deptFilter}
              onValueChange={(v) => {
                setDeptFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                <SelectItem value="__org__">
                  Organization level (no dept)
                </SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Posts per page — applies live, resets to page 1 on change. */}
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v) || 10);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPosts}
              disabled={loading || !postTypeId}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  {effectiveColumns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={[
                        col.width || '',
                        col.align === 'center' ? 'text-center' : '',
                        col.align === 'right' ? 'text-right' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || !postTypeId ? (
                  <TableRow>
                    <TableCell
                      colSpan={effectiveColumns.length + 2}
                      className="text-center py-8"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={effectiveColumns.length + 2}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No posts yet — click "New {title}" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow
                      key={post._id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleEdit(post)}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {(post.title as any)?.en ||
                            (post.title as any)?.mm ||
                            post.slug}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /{post.slug}
                        </div>
                      </TableCell>
                      {effectiveColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={[
                            col.align === 'center' ? 'text-center' : '',
                            col.align === 'right' ? 'text-right' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {col.render(post)}
                        </TableCell>
                      ))}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(post)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(post)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {post.status === 'Draft' && (
                              <DropdownMenuItem
                                onClick={() => handlePublish(post)}
                              >
                                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {post.status === 'Published' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUnpublish(post)}
                                >
                                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                                  Unpublish
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleArchive(post)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                            {post.status === 'Archived' && (
                              <DropdownMenuItem
                                onClick={() => handleRestore(post)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingPost(post)}
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

          {/* Pagination footer — visible whenever there's at least one
              record so authors can see the total count even when
              everything fits on one page. */}
          {totalRecords > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const start =
                    totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
                  const end = Math.min(currentPage * pageSize, totalRecords);
                  return `${start}–${end} of ${totalRecords} · Page ${currentPage} of ${totalPages}`;
                })()}
              </p>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    title="First page"
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    title="Last page"
                  >
                    »
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation — opens when `setDeletingPost(post)` is
           called from the row dropdown's "Delete" item. Without this
           the dropdown click set state but nothing rendered, so
           authors saw "Delete" do nothing. */}
      <AlertDialog
        open={!!deletingPost}
        onOpenChange={(o) => !o && setDeletingPost(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPost ? (
                <>
                  &quot;
                  <span className="font-medium">
                    {deletingPost.title?.en ||
                      deletingPost.title?.mm ||
                      deletingPost.slug ||
                      'Untitled'}
                  </span>
                  &quot; will be moved to trash. You can restore it from
                  the deleted-posts view if needed.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
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
