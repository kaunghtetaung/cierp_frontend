'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Layout,
  LayoutDashboard,
} from 'lucide-react';
import { toastSuccess, toastError } from '@repo/utils';
import {
  getTemplates,
  deleteTemplate,
} from '../common/actions';
import type { Template } from '../common/types';
import type { EntityStatus } from '../common/types/common.types';
import { TemplateEditorPage } from './TemplateEditorPage';
import { getClientTenantId } from '@/actions/client-tenant';

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All Categories' },
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'program', label: 'Program' },
  { value: 'contact', label: 'Contact' },
  { value: 'landing', label: 'Landing' },
  { value: 'generic', label: 'Generic' },
];

/**
 * Templates admin list — mirrors the Sections list pattern but for
 * authorable Page Templates. Each template is a reusable layout tree
 * (containers > rows > columns > sectionRefs) authored via
 * `TemplateEditorPage` (which embeds `PageLayoutBuilder`).
 */
export default function TemplatePage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<EntityStatus | 'all'>('all');

  // Editor states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(
    null,
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const result = await getTemplates(params);
      if (result.success && result.data) {
        const data: any = result.data;
        setTemplates(Array.isArray(data) ? data : data.data || []);
        if (data.meta) setTotalPages(data.meta.totalPages || 1);
      } else {
        toastError(result.error || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Load templates error:', error);
      toastError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [currentPage, categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    (async () => {
      try {
        setTenantId(await getClientTenantId());
      } catch (err) {
        console.error('[TemplatePage] Failed to fetch tenantId:', err);
      }
    })();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDelete = (template: Template) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = () => {
    if (!deletingTemplate) return;
    startTransition(async () => {
      try {
        const result = await deleteTemplate(deletingTemplate._id);
        if (result.success) {
          toastSuccess('Template deleted successfully');
          loadTemplates();
        } else {
          toastError(result.error || 'Failed to delete template');
        }
      } catch (error) {
        console.error('Delete template error:', error);
        toastError('Failed to delete template');
      } finally {
        setDeletingTemplate(null);
      }
    });
  };

  const handleEditorSuccess = () => {
    setIsEditorOpen(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const getStatusBadge = (status: EntityStatus) => {
    if (status === 'Active') return <Badge variant="default">Active</Badge>;
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Page Templates
          </h1>
          <p className="text-muted-foreground">
            Author reusable layout templates that pages can reference
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTERS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as EntityStatus | 'all');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadTemplates}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ||
                categoryFilter !== 'all' ||
                statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first template to get started'}
              </p>
              {!searchQuery &&
                categoryFilter === 'all' &&
                statusFilter === 'all' && (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <article
                  key={t._id}
                  className="group rounded-md border bg-card overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                    {t.previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.previewImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layout className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(t.status)}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {t.title?.en || t.title?.mm || t.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.name}
                          {t.slug ? ` · ${t.slug}` : ''}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(t)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(t)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {t.description?.en && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t.description.en}
                      </p>
                    )}
                    <div className="mt-auto pt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {t.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {t.category}
                        </Badge>
                      )}
                      <span className="ml-auto">
                        {(t.layout?.containers?.[0]?.rows?.length ?? 0)} rows
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      {isEditorOpen && (
        <TemplateEditorPage
          mode={editingTemplate ? 'edit' : 'create'}
          initialData={editingTemplate ?? undefined}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTemplate(null);
          }}
          onSuccess={handleEditorSuccess}
          tenantId={tenantId}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(o) => !o && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTemplate ? (
                <>
                  &quot;
                  <span className="font-medium">
                    {deletingTemplate.title?.en ||
                      deletingTemplate.title?.mm ||
                      deletingTemplate.name}
                  </span>
                  &quot; will be moved to trash. Pages currently referencing
                  it will fall back to their own layout.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
