'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { Input, Button, Badge } from '@repo/ui';
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
  Upload,
  ArrowUpFromLine,
  RotateCcw,
  Copy,
  Home,
  Eye,
  Layers,
} from 'lucide-react';
import {
  getPages,
  deletePage,
  publishPage,
  unpublishPage,
  restorePage,
  duplicatePage,
  setPageAsHomePage,
} from '../common/actions';
import type { Page, ContentStatus } from '../common/types';
import { PageForm } from './PageForm';

export default function PagesPage() {
  const { currentLanguage } = useLanguage();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [deletingPage, setDeletingPage] = useState<Page | null>(null);

  // Load pages
  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPages({});
      console.log('Pages API response:', result);
      if (result.success && result.data) {
        console.log('Pages data:', result.data);
        // Handle both array response and paginated response
        const pagesData = Array.isArray(result.data) ? result.data : (result.data.data || []);
        console.log('Parsed pages:', pagesData);
        setPages(pagesData);
      } else {
        toastError(result.error || 'Failed to load pages');
      }
    } catch (error) {
      console.error('Load pages error:', error);
      toastError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Filter pages by search
  const filteredPages = pages.filter((page) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = getLocalizedText(page.title, currentLanguage as 'en' | 'mm').toLowerCase();
    const slug = page.slug?.toLowerCase() || '';
    return title.includes(query) || slug.includes(query);
  });

  // Handle create
  const handleCreate = () => {
    setEditingPage(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = (page: Page) => {
    setDeletingPage(page);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deletingPage) return;

    startTransition(async () => {
      try {
        const result = await deletePage(deletingPage._id);
        if (result.success) {
          toastSuccess('Page deleted successfully');
          loadPages();
        } else {
          toastError(result.error || 'Failed to delete page');
        }
      } catch (error) {
        console.error('Delete page error:', error);
        toastError('Failed to delete page');
      } finally {
        setDeletingPage(null);
      }
    });
  };

  // Handle publish
  const handlePublish = (page: Page) => {
    startTransition(async () => {
      try {
        const result = await publishPage(page._id);
        if (result.success) {
          toastSuccess('Page published successfully');
          loadPages();
        } else {
          toastError(result.error || 'Failed to publish page');
        }
      } catch (error) {
        console.error('Publish page error:', error);
        toastError('Failed to publish page');
      }
    });
  };

  // Handle unpublish
  const handleUnpublish = (page: Page) => {
    startTransition(async () => {
      try {
        const result = await unpublishPage(page._id);
        if (result.success) {
          toastSuccess('Page unpublished successfully');
          loadPages();
        } else {
          toastError(result.error || 'Failed to unpublish page');
        }
      } catch (error) {
        console.error('Unpublish page error:', error);
        toastError('Failed to unpublish page');
      }
    });
  };

  // Handle duplicate
  const handleDuplicate = (page: Page) => {
    startTransition(async () => {
      try {
        const result = await duplicatePage(page._id, {
          newTitle: {
            en: `${page.title.en || ''} (Copy)`,
            mm: `${page.title.mm || ''} (Copy)`,
          },
          includeSections: true,
        });
        if (result.success) {
          toastSuccess('Page duplicated successfully');
          loadPages();
        } else {
          toastError(result.error || 'Failed to duplicate page');
        }
      } catch (error) {
        console.error('Duplicate page error:', error);
        toastError('Failed to duplicate page');
      }
    });
  };

  // Handle set as home page
  const handleSetAsHomePage = (page: Page) => {
    startTransition(async () => {
      try {
        const result = await setPageAsHomePage(page._id);
        if (result.success) {
          toastSuccess('Home page set successfully');
          loadPages();
        } else {
          toastError(result.error || 'Failed to set as home page');
        }
      } catch (error) {
        console.error('Set home page error:', error);
        toastError('Failed to set as home page');
      }
    });
  };

  // Handle restore
  const handleRestore = (page: Page) => {
    startTransition(async () => {
      try {
        const result = await restorePage(page._id);
        if (result.success) {
          toastSuccess('Page restored successfully');
          loadPages();
        } else {
          toastError(result.error || 'Failed to restore page');
        }
      } catch (error) {
        console.error('Restore page error:', error);
        toastError('Failed to restore page');
      }
    });
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPage(null);
    loadPages();
  };

  // Get status badge
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8" />
          Pages
        </h1>
        <p className="text-muted-foreground">
          Create and manage website pages
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Pages</CardTitle>
              <CardDescription>
                {pages.length} pages total
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Page
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
            <Button
              variant="outline"
              size="sm"
              onClick={loadPages}
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
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-center">Sections</TableHead>
                  <TableHead className="text-center">Views</TableHead>
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
                ) : filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery
                          ? 'No pages found matching your search'
                          : 'No pages yet. Create your first page!'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => (
                    <TableRow key={page._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            {page.isHomePage ? (
                              <Home className="h-4 w-4 text-primary" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getLocalizedText(page.title, currentLanguage as 'en' | 'mm')}
                              {page.isHomePage && (
                                <Badge variant="default" className="text-xs">Home</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        /{page.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {page.template}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Layers className="h-4 w-4" />
                          {page.sectionIds?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {page.viewCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(page.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(page)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {!page.isHomePage && (
                              <DropdownMenuItem onClick={() => handleSetAsHomePage(page)}>
                                <Home className="h-4 w-4 mr-2" />
                                Set as Home
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {page.status === 'Draft' && (
                              <DropdownMenuItem onClick={() => handlePublish(page)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {page.status === 'Published' && (
                              <DropdownMenuItem onClick={() => handleUnpublish(page)}>
                                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {page.deletedAt ? (
                              <DropdownMenuItem onClick={() => handleRestore(page)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleDelete(page)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? 'Edit Page' : 'Create New Page'}
            </DialogTitle>
            <DialogDescription>
              {editingPage
                ? 'Update the page details below'
                : 'Fill in the details to create a new page'}
            </DialogDescription>
          </DialogHeader>
          <PageForm
            mode={editingPage ? 'edit' : 'create'}
            initialData={editingPage || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPage} onOpenChange={() => setDeletingPage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{getLocalizedText(deletingPage?.title || { en: '', mm: '' }, currentLanguage as 'en' | 'mm')}&quot;?
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
