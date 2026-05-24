'use client';

import React, { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import { Input, Button, Checkbox, Badge, IconSelector } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  Loader2,
  Save,
  X,
  Search,
  FileText,
  FolderTree,
  Newspaper,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  createNavigationItem,
  updateNavigationItem,
  getPages,
  getCategoryTree,
  getPostTypes,
  getPosts,
  getPostTypeReference,
} from '../common/actions';
import type {
  Navigation,
  MenuTreeNode,
  MenuType,
  NavigationType,
  Page,
  CategoryTreeNode,
  PostType,
  Post,
} from '../common/types';
import { generateSlug } from '../common/utils';

// Navigation form schema
const navigationFormSchema = z.object({
  title: z.object({
    en: z.string().min(1, 'English title is required'),
    mm: z.string().optional().default(''),
  }),
  slug: z.string().optional(),
  url: z.string().optional(),
  type: z.enum([
    'internal',
    'external',
    'page',
    'post',
    'posts',
    'category',
    'custom',
  ]),
  pageId: z.string().optional(),
  categoryId: z.string().optional(),
  postId: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().min(0).optional(),
  icon: z.string().optional(),
  isVisible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
  // 'dropdown' (default) renders children as a vertical drop panel.
  // 'mega' renders a wide multi-column panel — each direct child
  // becomes a column header, its grandchildren become the column's
  // links. Ignored when the item has no children.
  displayType: z.enum(['dropdown', 'mega']).default('dropdown'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

type NavigationFormData = z.infer<typeof navigationFormSchema>;

interface NavigationFormProps {
  mode: 'create' | 'edit';
  menuType: MenuType;
  parentId?: string;
  departmentId?: string;
  menuTree?: MenuTreeNode[];
  initialData?: Partial<Navigation> | MenuTreeNode;
  onSuccess?: (item: Navigation) => void;
  onCancel?: () => void;
}

// Navigation type labels
const navigationTypeLabels: Record<NavigationType, string> = {
  internal: 'Internal Link',
  external: 'External URL',
  page: 'Page',
  post: 'Post',
  // "Posts by type" — links to the public list page for one
  // post type (e.g. /post/news, /post/announcements). Different
  // from `post` which links to one specific post.
  posts: 'Posts by type (list page)',
  category: 'Category',
  custom: 'Custom',
};

// ─── Category Tree Item ─────────────────────────────────
interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  level: number;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (node: CategoryTreeNode) => void;
}

function CategoryTreeItem({
  node,
  level,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
}: CategoryTreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node._id);
  const isSelected = selectedId === node._id;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left ${
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-muted/50'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node._id);
            }}
            className="shrink-0 p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}
        {node.color && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: node.color }}
          />
        )}
        <span className="truncate flex-1">{String(node.name?.en || node.name?.mm || node.slug || '')}</span>
        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
      </button>
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <CategoryTreeItem
            key={child._id}
            node={child}
            level={level + 1}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

// ─── Main NavigationForm ────────────────────────────────
export function NavigationForm({
  mode,
  menuType,
  parentId: defaultParentId,
  departmentId,
  menuTree = [],
  initialData,
  onSuccess,
  onCancel,
}: NavigationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  // Data lists for pickers
  const [pages, setPages] = useState<Page[]>([]);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostTypeId, setSelectedPostTypeId] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Search / filter states for pickers
  const [pageSearch, setPageSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [categoryExpandedIds, setCategoryExpandedIds] = useState<Set<string>>(new Set());

  const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

  // The API may return populated objects (e.g. { _id, title, slug }) for
  // pageId / categoryId / postId instead of plain string IDs.  Extract the
  // string ID defensively so the form (and React rendering) never receives
  // a non-string value.
  const extractId = (val: unknown): string | undefined => {
    if (typeof val === 'string' && val) return val;
    if (val && typeof val === 'object' && '_id' in val) return String((val as { _id: unknown })._id);
    return undefined;
  };

  // Similarly, title could be a populated object instead of { en, mm }.
  const extractTitle = (val: unknown): { en: string; mm: string } => {
    if (val && typeof val === 'object' && ('en' in val || 'mm' in val)) {
      const t = val as Record<string, unknown>;
      return { en: safeString(t.en), mm: safeString(t.mm) };
    }
    return { en: '', mm: '' };
  };

  const form = useForm<NavigationFormData>({
    resolver: zodResolver(navigationFormSchema),
    defaultValues: {
      title: extractTitle(initialData?.title),
      slug: safeString(initialData?.slug),
      url: safeString(initialData?.url),
      type: initialData?.type || 'internal',
      pageId: extractId((initialData as Navigation)?.pageId),
      categoryId: extractId((initialData as Navigation)?.categoryId),
      postId: extractId((initialData as Navigation)?.postId),
      parentId: extractId(initialData?.parentId) || defaultParentId || undefined,
      order: initialData?.order || 0,
      icon: safeString(initialData?.icon),
      isVisible: initialData?.isVisible ?? true,
      openInNewTab: initialData?.openInNewTab ?? false,
      requiresAuth: initialData?.requiresAuth ?? false,
      displayType:
        ((initialData as any)?.displayType as 'dropdown' | 'mega') ||
        'dropdown',
      status: initialData?.status || 'Active',
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch('title.en');
  const navigationType = watch('type');
  const selectedPageId = watch('pageId');
  const selectedCategoryId = watch('categoryId');
  const selectedPostId = watch('postId');

  // Whether the current type needs a picker panel
  const needsPicker = navigationType === 'page' || navigationType === 'category' || navigationType === 'post';

  // In edit mode with an existing selection, start on form view (not picker)
  const hasExistingSelection = mode === 'edit' && (
    extractId((initialData as Navigation)?.pageId) ||
    extractId((initialData as Navigation)?.categoryId) ||
    extractId((initialData as Navigation)?.postId)
  );

  // Track whether we're showing picker or form when in picker mode
  const [showingPicker, setShowingPicker] = useState(needsPicker && !hasExistingSelection);

  // When type changes, auto-show picker if it's a picker type
  // But skip if we already have a selection for this type (edit mode)
  useEffect(() => {
    if (needsPicker) {
      const hasSelection =
        (navigationType === 'page' && selectedPageId) ||
        (navigationType === 'category' && selectedCategoryId) ||
        (navigationType === 'post' && selectedPostId);
      if (!hasSelection) {
        setShowingPicker(true);
      }
    } else {
      setShowingPicker(false);
    }
  }, [needsPicker, navigationType, selectedPageId, selectedCategoryId, selectedPostId]);

  // Auto-generate slug from English title
  useEffect(() => {
    if (autoSlug && titleEn) {
      setValue('slug', generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  // ─── Data Loading ───────────────────────────────────
  // Pages were consolidated into Posts (PostType.slug='page') on
  // 2026-04-29. The legacy `getPages()` API still works against the
  // legacy `pages` collection but only sees pre-consolidation entries.
  // To pick up newly-authored pages, resolve the `page` PostType id and
  // query posts by it. The picker UI doesn't change — Post has the same
  // `_id`, `title`, `slug` shape as the legacy Page interface.
  const loadPages = useCallback(async () => {
    if (pages.length > 0) return;
    setIsLoadingData(true);
    try {
      const ptResult = await getPostTypeReference();
      const ptList: any[] = Array.isArray(ptResult?.data)
        ? ptResult.data
        : (ptResult?.data as any)?.data || [];
      const pageType = ptList.find((pt: any) => pt.slug === 'page');
      if (!pageType) {
        // Fallback to legacy pages collection if the page PostType
        // hasn't been seeded yet (older orgs).
        const legacy = await getPages({
          limit: 200,
          sortBy: 'title.en',
          sortOrder: 'asc',
        });
        if (legacy.success && legacy.data) {
          const data = Array.isArray(legacy.data)
            ? legacy.data
            : (legacy.data as any).data || [];
          setPages(data);
        }
        return;
      }
      const result = await getPosts({
        postTypeId: pageType.id,
        limit: 200,
        sortBy: 'title.en',
        sortOrder: 'asc',
      });
      if (result.success && result.data) {
        const data = (result.data as any).data || [];
        setPages(data as any);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [pages.length]);

  const loadCategories = useCallback(async () => {
    if (categories.length > 0) return;
    setIsLoadingData(true);
    try {
      const result = await getCategoryTree();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [categories.length]);

  const loadPostTypes = useCallback(async () => {
    if (postTypes.length > 0) return;
    setIsLoadingData(true);
    try {
      const result = await getPostTypes({ limit: 100 });
      if (result.success && result.data) {
        setPostTypes(result.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load post types:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [postTypes.length]);

  const loadPosts = useCallback(async (postTypeId: string) => {
    setIsLoadingData(true);
    try {
      const result = await getPosts({ postTypeId, limit: 200 });
      if (result.success && result.data) {
        setPosts(result.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (navigationType === 'page') loadPages();
    else if (navigationType === 'category') loadCategories();
    else if (navigationType === 'post' || navigationType === 'posts')
      loadPostTypes();
  }, [navigationType, loadPages, loadCategories, loadPostTypes]);

  // Initialize post type for edit mode
  useEffect(() => {
    const rawPostId = (initialData as Navigation)?.postId;
    const existingPostId = extractId(rawPostId);
    if (mode === 'edit' && navigationType === 'post' && existingPostId) {
      if (postTypes.length > 0 && !selectedPostTypeId) {
        getPosts({ limit: 200 }).then((result) => {
          if (result.success && result.data) {
            const postsData = result.data.data || [];
            const existingPost = postsData.find((p: Post) => p._id === existingPostId);
            if (existingPost?.postTypeId) {
              setSelectedPostTypeId(existingPost.postTypeId);
              loadPosts(existingPost.postTypeId);
            }
          }
        });
      }
    }
  }, [mode, navigationType, initialData, postTypes.length, selectedPostTypeId, loadPosts]);

  useEffect(() => {
    if (selectedPostTypeId) {
      loadPosts(selectedPostTypeId);
    } else {
      setPosts([]);
    }
  }, [selectedPostTypeId, loadPosts]);

  // Clear picker IDs whenever the type changes.
  useEffect(() => {
    if (navigationType !== 'page') setValue('pageId', undefined);
    if (navigationType !== 'category') setValue('categoryId', undefined);
    if (navigationType !== 'post') {
      setValue('postId', undefined);
      setSelectedPostTypeId('');
    }
  }, [navigationType, setValue]);

  // Clear `url` ONLY on a user-driven type change (not on initial
  // mount / edit-form hydration). `url` is type-specific:
  //   - external / custom → author-typed URL
  //   - posts             → `/post/<typeSlug>` written by the dropdown
  //   - page / post / category → computed on submit from the picker
  // Carrying a stale URL across a type switch caused the
  // "(none selected)" bug for `posts` type, where a value like
  // `/posts?type=news` survived a switch from type=custom and the
  // slug-extractor couldn't match it. The `prevTypeRef` skips the
  // first run so existing saved URLs still hydrate correctly.
  const prevTypeRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevTypeRef.current === null) {
      prevTypeRef.current = navigationType;
      return;
    }
    if (prevTypeRef.current !== navigationType) {
      setValue('url', '');
      prevTypeRef.current = navigationType;
    }
  }, [navigationType, setValue]);

  // ─── Selection Handlers ─────────────────────────────

  const handlePageSelect = (page: Page) => {
    setValue('pageId', page._id);
    const titleEn = safeString(page.title?.en);
    const titleMm = safeString(page.title?.mm);
    if (autoSlug || !form.getValues('title.en')) {
      setValue('title.en', titleEn);
      if (titleMm) setValue('title.mm', titleMm);
    }
    setValue('slug', safeString(page.slug));
    setAutoSlug(false);
    setShowingPicker(false);
  };

  const handleCategorySelect = (cat: CategoryTreeNode) => {
    setValue('categoryId', cat._id);
    const nameEn = safeString(cat.name?.en);
    const nameMm = safeString(cat.name?.mm);
    if (autoSlug || !form.getValues('title.en')) {
      setValue('title.en', nameEn);
      if (nameMm) setValue('title.mm', nameMm);
    }
    setValue('slug', safeString(cat.slug));
    setAutoSlug(false);
    setShowingPicker(false);
  };

  const handlePostSelect = (post: Post) => {
    setValue('postId', post._id);
    const titleEn = safeString(post.title?.en);
    const titleMm = safeString(post.title?.mm);
    if (autoSlug || !form.getValues('title.en')) {
      setValue('title.en', titleEn);
      if (titleMm) setValue('title.mm', titleMm);
    }
    setValue('slug', safeString(post.slug));
    setAutoSlug(false);
    setShowingPicker(false);
  };

  // ─── Category Tree Helpers ──────────────────────────
  const toggleCategoryExpand = (id: string) => {
    setCategoryExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterCategoryTree = (
    nodes: CategoryTreeNode[],
    query: string
  ): CategoryTreeNode[] => {
    if (!query) return nodes;
    return nodes.reduce<CategoryTreeNode[]>((acc, node) => {
      const name = (safeString(node.name?.en) || safeString(node.name?.mm) || '').toLowerCase();
      const matchesSelf = name.includes(query.toLowerCase());
      const filteredChildren = filterCategoryTree(node.children || [], query);
      if (matchesSelf || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  // ─── Flatten Menu Tree for Parent Select ────────────
  const flattenMenuTree = (
    nodes: MenuTreeNode[],
    level = 0,
    excludeId?: string
  ): Array<{ value: string; label: string; level: number }> => {
    const result: Array<{ value: string; label: string; level: number }> = [];
    for (const node of nodes) {
      if (node._id !== excludeId) {
        result.push({
          value: node._id,
          label: safeString(node.title?.en) || safeString(node.title?.mm) || 'Untitled',
          level,
        });
        if (node.children?.length) {
          result.push(...flattenMenuTree(node.children, level + 1, excludeId));
        }
      }
    }
    return result;
  };

  const parentOptions = flattenMenuTree(menuTree, 0, initialData?._id);

  // ─── Filter Helpers ─────────────────────────────────
  const filteredPages = pageSearch
    ? pages.filter((p) =>
        (safeString(p.title?.en) || safeString(p.title?.mm) || safeString(p.slug)).toLowerCase().includes(pageSearch.toLowerCase())
      )
    : pages;

  const filteredCategories = filterCategoryTree(categories, categorySearch);

  const filteredPosts = postSearch
    ? posts.filter((p) =>
        (safeString(p.title?.en) || safeString(p.title?.mm) || safeString(p.slug)).toLowerCase().includes(postSearch.toLowerCase())
      )
    : posts;

  // ─── Submit ─────────────────────────────────────────
  const onSubmit = (data: NavigationFormData) => {
    startTransition(async () => {
      try {
        // Auto-compute the navigation `url` field for picker-based
        // link types (page / post / category) so the public-side
        // renderer can route on `url` alone — the publicWeb's
        // `generateHref` doesn't know about postId/categoryId.
        //
        //   - page     → `/<slug>`              (pages live at the
        //                                        root `/[slug]` route)
        //   - post     → `/post/<typeSlug>/<slug>` (matches the
        //                                          detail route)
        //   - category → `/category/<slug>`
        //
        // Author-supplied `url` for `internal`/`external`/`custom`
        // types passes through unchanged.
        let computedUrl: string | undefined = data.url;
        if (data.type === "post" && data.postId) {
          const p: any = posts.find((x: any) => x._id === data.postId);
          if (p?.slug) {
            const seg = p.postTypeSlug || "article";
            computedUrl = `/post/${seg}/${p.slug}`;
          }
        } else if (data.type === "page" && data.pageId) {
          const pg: any = pages.find((x: any) => x._id === data.pageId);
          if (pg?.slug) {
            computedUrl = `/${pg.slug}`;
          }
        } else if (data.type === "category" && data.categoryId) {
          // Walk the (possibly nested) category tree to find the
          // selected category's slug — categories may be returned
          // as a tree by the admin loader.
          const findCat = (list: any[]): any | null => {
            for (const c of list) {
              if (c?._id === data.categoryId) return c;
              if (Array.isArray(c?.children)) {
                const hit = findCat(c.children);
                if (hit) return hit;
              }
            }
            return null;
          };
          const cat = findCat(categories as any[]);
          if (cat?.slug) {
            computedUrl = `/category/${cat.slug}`;
          }
        }

        const submitData = {
          ...data,
          url: computedUrl,
          menuType,
          parentId: data.parentId || undefined,
          pageId: data.pageId || undefined,
          categoryId: data.categoryId || undefined,
          postId: data.postId || undefined,
          departmentId: departmentId || undefined,
        };

        let result;
        if (mode === 'create') {
          result = await createNavigationItem(submitData as any);
        } else if (initialData?._id) {
          // Don't send `version` — the admin form loads `initialData`
          // once and never refreshes it after subsequent saves, so the
          // value goes stale (form keeps `0` while the doc moves to
          // `1+`). The backend service has an `updateNavigationDto
          // .version === undefined` branch that fetches the current
          // version itself, which is what we want for an admin who
          // owns the doc and doesn't have concurrent editors fighting
          // over the same item. Sending the stale `0` here is what
          // produced the `NAVIGATION_VERSION_CONFLICT` after the very
          // first successful save in a session.
          result = await updateNavigationItem(initialData._id, submitData as any);
        } else {
          throw new Error('Navigation item ID is required for update');
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Menu item created successfully'
              : 'Menu item updated successfully'
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || 'Failed to save menu item');
        }
      } catch (error) {
        console.error('Navigation form error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  // ─── Picker View (full-width, replaces form) ───────
  const renderPickerView = () => {
    if (!needsPicker) return null;

    return (
      <div className="space-y-4">
        {/* Link Type selector + Back button */}
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0">
                <FormLabel>Link Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(navigationTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Picker panel (full width) */}
        <div className="border rounded-lg flex flex-col">
          {/* Picker Header */}
          <div className="px-3 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              {navigationType === 'page' && (
                <>
                  <FileText className="h-4 w-4" />
                  Select a Page
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {pages.length}
                  </Badge>
                </>
              )}
              {navigationType === 'category' && (
                <>
                  <FolderTree className="h-4 w-4" />
                  Select a Category
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {categories.length}
                  </Badge>
                </>
              )}
              {navigationType === 'post' && (
                <>
                  <Newspaper className="h-4 w-4" />
                  Select a Post
                </>
              )}
            </div>
          </div>

          {/* Post Type Tabs (only for post type) */}
          {navigationType === 'post' && postTypes.length > 0 && (
            <div className="px-2 pt-2 border-b">
              <div className="flex flex-wrap gap-1 pb-2">
                {postTypes.map((pt) => (
                  <button
                    key={pt._id}
                    type="button"
                    onClick={() => {
                      setSelectedPostTypeId(pt._id);
                      setValue('postId', undefined);
                      setPostSearch('');
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      selectedPostTypeId === pt._id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {safeString(pt.name?.en) || safeString(pt.name?.mm) || safeString(pt.slug) || 'Untitled'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  navigationType === 'page'
                    ? 'Search pages...'
                    : navigationType === 'category'
                      ? 'Search categories...'
                      : 'Search posts...'
                }
                value={
                  navigationType === 'page'
                    ? pageSearch
                    : navigationType === 'category'
                      ? categorySearch
                      : postSearch
                }
                onChange={(e) => {
                  if (navigationType === 'page') setPageSearch(e.target.value);
                  else if (navigationType === 'category') setCategorySearch(e.target.value);
                  else setPostSearch(e.target.value);
                }}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="overflow-y-auto p-1" style={{ maxHeight: '400px' }}>
            {isLoadingData && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Pages List */}
            {navigationType === 'page' && !isLoadingData && (
              <>
                {filteredPages.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    {pageSearch ? 'No pages match your search' : 'No pages found'}
                  </div>
                ) : (
                  filteredPages.map((page) => (
                    <button
                      key={page._id}
                      type="button"
                      onClick={() => handlePageSelect(page)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md transition-colors text-left ${
                        selectedPageId === page._id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{safeString(page.title?.en) || safeString(page.title?.mm) || safeString(page.slug) || 'Untitled'}</div>
                        <div className="text-xs text-muted-foreground truncate">/{page.slug}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {page.status}
                      </Badge>
                      {selectedPageId === page._id && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </>
            )}

            {/* Categories Tree */}
            {navigationType === 'category' && !isLoadingData && (
              <>
                {filteredCategories.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    {categorySearch ? 'No categories match your search' : 'No categories found'}
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <CategoryTreeItem
                      key={cat._id}
                      node={cat}
                      level={0}
                      selectedId={selectedCategoryId}
                      expandedIds={categoryExpandedIds}
                      onToggleExpand={toggleCategoryExpand}
                      onSelect={handleCategorySelect}
                    />
                  ))
                )}
              </>
            )}

            {/* Posts List */}
            {navigationType === 'post' && !isLoadingData && (
              <>
                {!selectedPostTypeId ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    Select a post type above
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    {postSearch ? 'No posts match your search' : 'No posts found'}
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <button
                      key={post._id}
                      type="button"
                      onClick={() => handlePostSelect(post)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md transition-colors text-left ${
                        selectedPostId === post._id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Newspaper className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{safeString(post.title?.en) || safeString(post.title?.mm) || safeString(post.slug) || 'Untitled'}</div>
                        <div className="text-xs text-muted-foreground truncate">/{post.slug}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {post.status}
                      </Badge>
                      {selectedPostId === post._id && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Helper: get selected item label ────────────────
  const getSelectedItemLabel = (): string | null => {
    const safeStr = (val: unknown): string => {
      if (typeof val === 'string' && val) return val;
      return '';
    };

    if (navigationType === 'page' && selectedPageId) {
      const page = pages.find((p) => p._id === selectedPageId);
      if (!page) return selectedPageId;
      return safeStr(page.title?.en) || safeStr(page.title?.mm) || safeStr(page.slug) || selectedPageId;
    }
    if (navigationType === 'category' && selectedCategoryId) {
      const findCat = (nodes: CategoryTreeNode[]): CategoryTreeNode | null => {
        for (const n of nodes) {
          if (n._id === selectedCategoryId) return n;
          if (n.children) {
            const found = findCat(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      const cat = findCat(categories);
      if (!cat) return selectedCategoryId;
      return safeStr(cat.name?.en) || safeStr(cat.name?.mm) || safeStr(cat.slug) || selectedCategoryId;
    }
    if (navigationType === 'post' && selectedPostId) {
      const post = posts.find((p) => p._id === selectedPostId);
      if (!post) return selectedPostId;
      return safeStr(post.title?.en) || safeStr(post.title?.mm) || safeStr(post.slug) || selectedPostId;
    }
    return null;
  };

  // ─── Form Fields ────────────────────────────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      {/* Link Type + Slug/URL - same row */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>Link Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(navigationTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="min-w-0">
          {needsPicker ? (
            <div>
              <FormLabel>Selected {navigationType === 'page' ? 'Page' : navigationType === 'category' ? 'Category' : 'Post'}</FormLabel>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 min-w-0 h-9 px-3 flex items-center rounded-md border bg-muted/30 text-sm truncate">
                  {getSelectedItemLabel() || <span className="text-muted-foreground">None selected</span>}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingPicker(true)}
                >
                  {getSelectedItemLabel() ? 'Change' : 'Select'}
                </Button>
              </div>
            </div>
          ) : navigationType === 'external' ? (
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External URL</FormLabel>
                  <FormControl>
                    <Input className="w-full" {...field} placeholder="https://example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : navigationType === 'posts' ? (
            // Post type list — pick a post type, store the resulting
            // `/post/<slug>` URL directly in `url` so the public side
            // routes correctly. No separate db field needed.
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => {
                // Read the current selection back from the saved URL
                // so editing pre-populates the dropdown.
                const currentSlug =
                  typeof field.value === 'string' &&
                  field.value.startsWith('/post/')
                    ? field.value.slice('/post/'.length).split('/')[0]
                    : '';
                return (
                  <FormItem>
                    <FormLabel>Post type</FormLabel>
                    <Select
                      value={currentSlug || '__none__'}
                      onValueChange={(v) =>
                        field.onChange(v === '__none__' ? '' : `/post/${v}`)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a post type…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          (none selected)
                        </SelectItem>
                        {postTypes.map((pt: any) => (
                          <SelectItem
                            key={pt._id}
                            value={pt.slug ?? pt._id}
                          >
                            {safeString(pt.name?.en) ||
                              safeString(pt.name?.mm) ||
                              safeString(pt.slug) ||
                              'Untitled'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ) : (
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug / Path</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        className="w-full"
                        {...field}
                        placeholder="menu-slug"
                        disabled={autoSlug}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 shrink-0">
                      <Checkbox
                        id="autoSlug"
                        checked={autoSlug}
                        onCheckedChange={(checked) => setAutoSlug(checked as boolean)}
                      />
                      <label htmlFor="autoSlug" className="text-sm text-muted-foreground">
                        Auto
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      {/* Title - full width */}
      <div className="space-y-2">
        <FormLabel>
          Title <span className="text-destructive">*</span>
        </FormLabel>
        <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
          <TabsList className="h-8 mb-2">
            <TabsTrigger value="en" className="text-xs px-2 py-1">
              EN
            </TabsTrigger>
            <TabsTrigger value="mm" className="text-xs px-2 py-1">
              MM
            </TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="mt-0">
            <FormField
              control={form.control}
              name="title.en"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Menu item title in English" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="mm" className="mt-0">
            <FormField
              control={form.control}
              name="title.mm"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="မီနူး ခေါင်းစဉ် (မြန်မာ)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Parent Item, Order, Status, Icon - single row */}
      <div className="grid grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>Parent Item</FormLabel>
              <Select
                value={field.value || '_none'}
                onValueChange={(value) => field.onChange(value === '_none' ? undefined : value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_none">None (Top level)</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {'—'.repeat(option.level)} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-full"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <IconSelector
                  value={field.value || ''}
                  onSelect={(iconName) => field.onChange(iconName)}
                  placeholder="Select icon..."
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Options - single row, distributed */}
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Visible</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openInNewTab"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Open in new tab</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiresAuth"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Requires authentication</FormLabel>
            </FormItem>
          )}
        />

        {/* Mega-menu toggle. Only meaningful for items that have
            children. The public renderer ignores this when the
            item is a leaf, but exposing it on every item keeps the
            UI symmetric and lets authors pre-configure before
            adding children. */}
        <FormField
          control={form.control}
          name="displayType"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value === "mega"}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? "mega" : "dropdown")
                  }
                />
              </FormControl>
              <FormLabel className="!mt-0">
                Display as mega menu
              </FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Add Item' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // ─── Layout ─────────────────────────────────────────
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {needsPicker && showingPicker ? (
          renderPickerView()
        ) : (
          renderFormFields()
        )}
      </form>
    </Form>
  );
}

export default NavigationForm;
