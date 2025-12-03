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
import { ConfirmationDialog } from '@repo/ui';
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
  ChevronRight,
  ChevronDown,
  Home,
  Globe,
  Lock,
  LayoutTemplate,
  Copy,
  Send,
  Archive,
} from 'lucide-react';
import {
  deletePage,
  publishPage,
  unpublishPage,
  duplicatePage,
  setPageAsHomePage,
} from '../../actions';
import type { PageTreeNode, Page, PageTemplate, ContentStatus, Visibility } from '../../types';

interface PageListProps {
  pages: PageTreeNode[];
  onRefresh?: () => void;
  onEdit?: (page: Page) => void;
  onView?: (page: Page) => void;
  currentLanguage?: 'en' | 'mm';
}

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
};

const TEMPLATE_LABELS: Record<PageTemplate, string> = {
  default: 'Default',
  fullWidth: 'Full Width',
  sidebar: 'Sidebar',
  landing: 'Landing',
  blog: 'Blog',
  blank: 'Blank',
};

const VISIBILITY_ICONS: Record<Visibility, React.ReactNode> = {
  public: <Globe className="h-3 w-3" />,
  private: <Lock className="h-3 w-3" />,
  protected: <Lock className="h-3 w-3" />,
  password: <Lock className="h-3 w-3" />,
};

interface PageRowProps {
  page: PageTreeNode;
  level: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit?: (page: Page) => void;
  onView?: (page: Page) => void;
  onDelete: (id: string, title: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetHomePage: (id: string) => void;
  currentLanguage: 'en' | 'mm';
}

function PageRow({
  page,
  level,
  expandedIds,
  toggleExpand,
  onEdit,
  onView,
  onDelete,
  onPublish,
  onUnpublish,
  onDuplicate,
  onSetHomePage,
  currentLanguage,
}: PageRowProps) {
  const isExpanded = expandedIds.has(page._id);
  const hasChildren = page.children && page.children.length > 0;
  const title = getLocalizedText(page.title, currentLanguage);

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
                onClick={() => toggleExpand(page._id)}
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
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium flex items-center gap-2">
                {title}
                {page.isHomePage && (
                  <Badge variant="default" className="text-xs">
                    <Home className="h-3 w-3 mr-1" />
                    Home
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {VISIBILITY_ICONS[page.visibility]}
                /{page.slug}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">
            <LayoutTemplate className="h-3 w-3 mr-1" />
            {TEMPLATE_LABELS[page.template]}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={STATUS_COLORS[page.status]}>{page.status}</Badge>
        </TableCell>
        <TableCell className="text-center text-sm text-muted-foreground">
          {page.viewCount || 0}
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
                <DropdownMenuItem onClick={() => onView(page as unknown as Page)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(page as unknown as Page)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {page.status === 'draft' && (
                <DropdownMenuItem onClick={() => onPublish(page._id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </DropdownMenuItem>
              )}
              {page.status === 'published' && (
                <DropdownMenuItem onClick={() => onUnpublish(page._id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(page._id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {!page.isHomePage && page.status === 'published' && (
                <DropdownMenuItem onClick={() => onSetHomePage(page._id)}>
                  <Home className="h-4 w-4 mr-2" />
                  Set as Home Page
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(page._id, title)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {/* Render children if expanded */}
      {isExpanded &&
        hasChildren &&
        page.children?.map((child) => (
          <PageRow
            key={child._id}
            page={child}
            level={level + 1}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
            onDuplicate={onDuplicate}
            onSetHomePage={onSetHomePage}
            currentLanguage={currentLanguage}
          />
        ))}
    </>
  );
}

export function PageList({
  pages,
  onRefresh,
  onEdit,
  onView,
  currentLanguage = 'en',
}: PageListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: '', title: '' });

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
    const getAllIds = (nodes: PageTreeNode[]): string[] => {
      return nodes.flatMap((node) => [
        node._id,
        ...(node.children ? getAllIds(node.children) : []),
      ]);
    };
    setExpandedIds(new Set(getAllIds(pages)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deletePage(id);
      if (result.success) {
        toastSuccess('Page deleted successfully');
        setDeleteDialog({ open: false, id: '', title: '' });
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to delete page');
      }
    });
  };

  const handlePublish = async (id: string) => {
    startTransition(async () => {
      const result = await publishPage(id);
      if (result.success) {
        toastSuccess('Page published successfully');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to publish page');
      }
    });
  };

  const handleUnpublish = async (id: string) => {
    startTransition(async () => {
      const result = await unpublishPage(id);
      if (result.success) {
        toastSuccess('Page unpublished');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to unpublish page');
      }
    });
  };

  const handleDuplicate = async (id: string) => {
    startTransition(async () => {
      const result = await duplicatePage(id, {});
      if (result.success) {
        toastSuccess('Page duplicated successfully');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to duplicate page');
      }
    });
  };

  const handleSetHomePage = async (id: string) => {
    startTransition(async () => {
      const result = await setPageAsHomePage(id);
      if (result.success) {
        toastSuccess('Home page updated');
        onRefresh?.();
      } else {
        toastError(result.error || 'Failed to set home page');
      }
    });
  };

  // Filter pages by search query
  const filterPages = (
    nodes: PageTreeNode[],
    query: string
  ): PageTreeNode[] => {
    if (!query) return nodes;

    return nodes.reduce<PageTreeNode[]>((acc, node) => {
      const title = getLocalizedText(node.title, currentLanguage).toLowerCase();
      const matchesSearch =
        title.includes(query.toLowerCase()) ||
        node.slug.toLowerCase().includes(query.toLowerCase());

      const filteredChildren = node.children
        ? filterPages(node.children, query)
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

  const filteredPages = filterPages(pages, searchQuery);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pages
            </CardTitle>
            <CardDescription>
              Manage your website pages in a hierarchical structure
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/content/pages/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
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
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Title</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery
                        ? 'No pages found matching your search'
                        : 'No pages yet. Create your first page!'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPages.map((page) => (
                  <PageRow
                    key={page._id}
                    page={page}
                    level={0}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                    onEdit={onEdit}
                    onView={onView}
                    onDelete={(id, title) =>
                      setDeleteDialog({ open: true, id, title })
                    }
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                    onDuplicate={handleDuplicate}
                    onSetHomePage={handleSetHomePage}
                    currentLanguage={currentLanguage}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          title="Delete Page"
          description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteDialog.id)}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
}

export default PageList;
