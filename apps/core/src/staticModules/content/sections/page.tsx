'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
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
  Layers,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  LayoutGrid,
  Image,
  MessageSquare,
  HelpCircle,
  DollarSign,
  Table,
  Users,
  User,
  Network,
  Star,
  Images,
  Newspaper,
  Folder,
  Tag,
  FileText,
  Menu,
} from 'lucide-react';
import {
  getSections,
  getSectionById,
  deleteSection,
  duplicateSection,
  toggleSectionVisibility,
  restoreSection,
} from '../common/actions';
import type { Section, SectionType, EntityStatus } from '../common/types';
import { SectionEditorPage } from './SectionEditorPage';
import { getClientTenantId } from '@/actions/client-tenant';

// Section type icons
const sectionTypeIcons: Record<SectionType, React.ReactNode> = {
  hero: <Star className="h-4 w-4" />,
  featureList: <LayoutGrid className="h-4 w-4" />,
  contentWithImage: <Image className="h-4 w-4" />,
  cta: <MessageSquare className="h-4 w-4" />,
  testimonials: <MessageSquare className="h-4 w-4" />,
  gallery: <Image className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  pricing: <DollarSign className="h-4 w-4" />,
  dataTable: <Table className="h-4 w-4" />,
  stats: <Users className="h-4 w-4" />,
  rector: <User className="h-4 w-4" />,
  organizationStructure: <Network className="h-4 w-4" />,
  carousel: <Images className="h-4 w-4" />,
  recentPosts: <Newspaper className="h-4 w-4" />,
  categoryList: <Folder className="h-4 w-4" />,
  tagList: <Tag className="h-4 w-4" />,
  postBody: <FileText className="h-4 w-4" />,
  navigationMenu: <Menu className="h-4 w-4" />,
  tabs: <LayoutGrid className="h-4 w-4" />,
};

// Section type labels
const sectionTypeLabels: Record<SectionType, string> = {
  hero: 'Hero Banner',
  featureList: 'Feature List',
  contentWithImage: 'Content with Image',
  cta: 'Call to Action',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  faq: 'FAQ',
  pricing: 'Pricing',
  dataTable: 'Data Table',
  stats: 'Stats Counter',
  rector: 'Rector',
  organizationStructure: 'Organization Structure',
  carousel: 'Carousel',
  recentPosts: 'Recent Posts',
  categoryList: 'Category List',
  tagList: 'Tag List',
  postBody: 'Post Body Placeholder',
  navigationMenu: 'Navigation Menu (Sidebar)',
  tabs: 'Tabs (Horizontal / Vertical)',
};

export default function SectionPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SectionType | 'all'>('all');

  // Editor states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [selectedType, setSelectedType] = useState<SectionType | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Load sections
  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      // Send `page` (1-indexed) rather than `skip` — the backend
      // service computes its own skip from `page * limit` and
      // ignores any incoming `skip`, so this was the reason the
      // Next/Previous buttons never advanced past page 1.
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const result = await getSections(params);
      if (result.success && result.data) {
        // Backend returns data as direct array, not nested in data.data
        setSections(Array.isArray(result.data) ? result.data : result.data.data || []);
        if (result.data.meta) {
          setTotalPages(result.data.meta.totalPages || 1);
        }
      } else {
        toastError(result.error || 'Failed to load sections');
      }
    } catch (error) {
      console.error('Load sections error:', error);
      toastError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter, searchQuery]);

  // Fetch tenant ID on mount using server action
  useEffect(() => {
    const fetchTenantId = async () => {
      try {
        const id = await getClientTenantId();
        console.log('[SectionPage] Fetched tenantId via server action:', id);
        setTenantId(id);
      } catch (error) {
        console.error('[SectionPage] Failed to fetch tenantId:', error);
      }
    };
    fetchTenantId();
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Auto-open the section editor when `?editId=<id>` is on the URL.
  // The PageLayoutBuilder's "Edit" button on each section ref
  // navigates here with that query param so authors can jump
  // straight from a page's layout to that section's editor
  // (opens in a new tab so the page-builder draft stays intact).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const editId = url.searchParams.get('editId');
    if (!editId) return;

    let cancelled = false;
    (async () => {
      const result = await getSectionById(editId);
      if (cancelled) return;
      if (result.success && result.data) {
        setEditingSection(result.data as any);
        setSelectedType(((result.data as any).type) ?? null);
        setIsEditorOpen(true);
      }
      // Clean the query param so a refresh / back-nav doesn't
      // re-open the editor unexpectedly.
      url.searchParams.delete('editId');
      window.history.replaceState({}, '', url.toString());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle create - show type selector first
  const handleCreate = () => {
    setEditingSection(null);
    setSelectedType(null);
    setIsEditorOpen(true);
  };

  // Handle edit
  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setSelectedType(section.type);
    setIsEditorOpen(true);
  };

  // Handle delete
  const handleDelete = (section: Section) => {
    setDeletingSection(section);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deletingSection) return;

    startTransition(async () => {
      try {
        const result = await deleteSection(deletingSection._id);
        if (result.success) {
          toastSuccess('Section deleted successfully');
          loadSections();
        } else {
          toastError(result.error || 'Failed to delete section');
        }
      } catch (error) {
        console.error('Delete section error:', error);
        toastError('Failed to delete section');
      } finally {
        setDeletingSection(null);
      }
    });
  };

  // Handle duplicate
  const handleDuplicate = (section: Section) => {
    startTransition(async () => {
      try {
        const result = await duplicateSection(section._id, `${section.name} (Copy)`);
        if (result.success) {
          toastSuccess('Section duplicated successfully');
          loadSections();
        } else {
          toastError(result.error || 'Failed to duplicate section');
        }
      } catch (error) {
        console.error('Duplicate section error:', error);
        toastError('Failed to duplicate section');
      }
    });
  };

  // Handle toggle visibility
  const handleToggleVisibility = (section: Section) => {
    startTransition(async () => {
      try {
        const result = await toggleSectionVisibility(section._id);
        if (result.success) {
          toastSuccess(`Section ${section.isVisible ? 'hidden' : 'shown'} successfully`);
          loadSections();
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
  const handleRestore = (section: Section) => {
    startTransition(async () => {
      try {
        const result = await restoreSection(section._id);
        if (result.success) {
          toastSuccess('Section restored successfully');
          loadSections();
        } else {
          toastError(result.error || 'Failed to restore section');
        }
      } catch (error) {
        console.error('Restore section error:', error);
        toastError('Failed to restore section');
      }
    });
  };

  // Handle editor success (called after save completes in SectionForm)
  const handleEditorSuccess = () => {
    setIsEditorOpen(false);
    setEditingSection(null);
    setSelectedType(null);
    loadSections();
  };

  // Handle editor close (cancel)
  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingSection(null);
    setSelectedType(null);
  };

  // Get status badge
  const getStatusBadge = (status: EntityStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter sections
  const filteredSections = sections.filter((section) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.name?.toLowerCase().includes(query) ||
      section.title?.en?.toLowerCase().includes(query) ||
      section.title?.mm?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sections</h1>
          <p className="text-muted-foreground">
            Create and manage reusable content sections
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Section
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as SectionType | 'all');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Section Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(sectionTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSections} disabled={loading}>
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
          ) : filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No sections found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first section'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Section
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSections.map((section) => (
                <div
                  key={section._id}
                  className="group border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        {sectionTypeIcons[section.type]}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {section.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sectionTypeLabels[section.type]}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(section)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(section)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVisibility(section)}>
                          {section.isVisible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {section.deletedAt ? (
                          <DropdownMenuItem onClick={() => handleRestore(section)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleDelete(section)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {section.title?.en || section.title?.mm || 'No title'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(section.status)}
                      {section.isReusable && (
                        <Badge variant="outline" className="text-xs">
                          Reusable
                        </Badge>
                      )}
                      {!section.isVisible && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredSections.length > 0 && totalPages > 1 && (
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

      {/* Type Selector Dialog - Only for new sections */}
      {!editingSection && !selectedType && isEditorOpen && (
        <Dialog open={isEditorOpen} onOpenChange={(open) => !open && handleEditorClose()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Choose Section Type</DialogTitle>
              <DialogDescription>
                Select the type of section you want to create
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4">
              {Object.entries(sectionTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type as SectionType)}
                  className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {sectionTypeIcons[type as SectionType]}
                  </div>
                  <span className="text-sm font-medium text-center">{label}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Full-Page Section Editor */}
      {isEditorOpen && (editingSection || selectedType) && (
        <SectionEditorPage
          mode={editingSection ? 'edit' : 'create'}
          sectionType={selectedType || editingSection?.type || 'hero'}
          initialData={editingSection || undefined}
          onClose={handleEditorClose}
          onSuccess={handleEditorSuccess}
          tenantId={tenantId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSection} onOpenChange={() => setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSection?.name}&quot;?
              {deletingSection?.isReusable && (
                <span className="block mt-2 text-amber-600">
                  This is a reusable section. Deleting it may affect pages that use it.
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
